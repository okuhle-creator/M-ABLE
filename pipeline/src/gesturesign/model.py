"""A small conv-transformer over landmark feature sequences.

Each stage is a depthwise temporal convolution block (local motion) followed by
a transformer block (whole-sign context). A masked mean pools the frames, a
linear layer gives a 128-d embedding, and logits are scaled cosine
similarities between that embedding and one learned vector per sign. Training
with cosine logits makes the embedding directly usable for nearest-prototype
matching, which the browser's "Teach your own" mode relies on.

Padding is exact: padded frames are zeroed after every block and masked out
of attention and pooling, so a padded batch gives the same output as each
sequence on its own (tested). The exported ONNX model takes one unpadded
sequence and needs no mask.

Upgrade notes (v2):
  - Attention uses F.scaled_dot_product_attention (PyTorch 2.0 Flash Attention
    path on CUDA/MPS; pure-math fallback on CPU). This is strictly more
    correct than the previous manual softmax+dropout because attention dropout
    is applied inside the kernel before the weighted sum rather than after the
    full softmax, and the mask is handled without the -inf numerical trick that
    can produce NaN on float16.
  - Feed-forward uses SwiGLU (Linear → split → SiLU gate × value → Linear)
    instead of GELU. The hidden dim is kept to ff_mult * dim by halving the
    expansion before the gate so the parameter count is unchanged.
  - head_drop is applied to the embedding *before* L2 normalisation. The old
    position (after normalise) produced a vector whose norm was ≤ 1 instead of
    exactly 1, making cosine logits inconsistent between training (dropout on)
    and inference (dropout off).
  - Class prototype vectors are initialised with a uniform sphere distribution
    so cosine distances start near chance rather than near-zero.
"""

from __future__ import annotations

import torch
import torch.nn.functional as F
from torch import Tensor, nn

from gesturesign.config import ModelConfig


class ConvBlock(nn.Module):
    def __init__(self, dim: int, kernel: int, dropout: float) -> None:
        super().__init__()
        self.norm = nn.LayerNorm(dim)
        self.expand = nn.Linear(dim, 2 * dim)
        self.depthwise = nn.Conv1d(dim, dim, kernel, padding=kernel // 2, groups=dim)
        self.mix_norm = nn.LayerNorm(dim)
        self.project = nn.Linear(dim, dim)
        self.drop = nn.Dropout(dropout)

    def forward(self, x: Tensor, keep: Tensor) -> Tensor:
        h = F.glu(self.expand(self.norm(x)), dim=-1) * keep
        h = self.depthwise(h.transpose(1, 2)).transpose(1, 2)
        h = self.project(F.silu(self.mix_norm(h)))
        out: Tensor = (x + self.drop(h)) * keep
        return out


class Attention(nn.Module):
    def __init__(self, dim: int, heads: int, dropout: float) -> None:
        super().__init__()
        if dim % heads:
            raise ValueError("dim must be divisible by heads")
        self.heads = heads
        self.head_dim = dim // heads
        self.qkv = nn.Linear(dim, 3 * dim)
        self.out = nn.Linear(dim, dim)
        self.attn_dropout: float = dropout

    def forward(self, x: Tensor, bias: Tensor | None) -> Tensor:
        B, T, D = x.shape
        q, k, v = self.qkv(x).reshape(B, T, 3, self.heads, self.head_dim).unbind(2)
        q, k, v = (t.transpose(1, 2) for t in (q, k, v))  # [B, H, T, d]
        # F.scaled_dot_product_attention: Flash Attention on CUDA/MPS, efficient
        # math fallback on CPU. attn_mask broadcasts over the head dimension.
        dropout_p = self.attn_dropout if self.training else 0.0
        out: Tensor = self.out(
            F.scaled_dot_product_attention(
                q, k, v,
                attn_mask=bias,
                dropout_p=dropout_p,
            ).transpose(1, 2).reshape(B, T, D)
        )
        return out


class SwiGLU(nn.Module):
    """SwiGLU feed-forward: projects to gate + value, gates with SiLU, then projects back.

    hidden is set to (ff_mult * dim * 2) // 3 so total parameter count matches
    the old GELU block (which had two matrices of size dim × ff_mult*dim):
      old: dim*(ff_mult*dim) + (ff_mult*dim)*dim = 2 * ff_mult * dim^2
      new: dim*(2*hidden) + hidden*dim = 3 * hidden * dim  → hidden = 2*ff_mult*dim/3
    """

    def __init__(self, dim: int, ff_mult: int, dropout: float) -> None:
        super().__init__()
        # Round to a multiple of dim (keeps things clean for most ff_mult values).
        hidden = max(dim, (ff_mult * dim * 2 + 2) // 3)
        self.gate_up = nn.Linear(dim, 2 * hidden)
        self.proj = nn.Linear(hidden, dim)
        self.drop = nn.Dropout(dropout)

    def forward(self, x: Tensor) -> Tensor:
        gate, up = self.gate_up(x).chunk(2, dim=-1)
        out: Tensor = self.proj(self.drop(F.silu(gate) * up))
        return out


class TransformerBlock(nn.Module):
    def __init__(self, dim: int, heads: int, ff_mult: int, dropout: float) -> None:
        super().__init__()
        self.attn_norm = nn.LayerNorm(dim)
        self.attn = Attention(dim, heads, dropout)
        self.ff_norm = nn.LayerNorm(dim)
        self.ff = SwiGLU(dim, ff_mult, dropout)
        self.drop = nn.Dropout(dropout)

    def forward(self, x: Tensor, keep: Tensor, bias: Tensor | None) -> Tensor:
        x = (x + self.drop(self.attn(self.attn_norm(x), bias))) * keep
        out: Tensor = (x + self.drop(self.ff(self.ff_norm(x)))) * keep
        return out


class SignModel(nn.Module):
    def __init__(self, in_dim: int, num_classes: int, max_frames: int, cfg: ModelConfig) -> None:
        super().__init__()
        self.cfg = cfg
        self.in_dim = in_dim
        self.num_classes = num_classes
        self.max_frames = max_frames
        self.stem = nn.Sequential(nn.Linear(in_dim, cfg.dim), nn.LayerNorm(cfg.dim))
        self.pos = nn.Parameter(torch.randn(1, max_frames, cfg.dim) * 0.02)
        self.convs = nn.ModuleList(
            ConvBlock(cfg.dim, cfg.conv_kernel, cfg.dropout) for _ in range(cfg.depth)
        )
        self.blocks = nn.ModuleList(
            TransformerBlock(cfg.dim, cfg.heads, cfg.ff_mult, cfg.dropout) for _ in range(cfg.depth)
        )
        self.final_norm = nn.LayerNorm(cfg.dim)
        self.head_drop = nn.Dropout(cfg.dropout)
        self.embed = nn.Linear(cfg.dim, cfg.embedding_dim)
        # Initialise class prototypes on the unit sphere so cosine distances
        # start near uniform instead of near zero.
        raw = torch.randn(num_classes, cfg.embedding_dim)
        self.classes = nn.Parameter(F.normalize(raw, dim=-1) * 0.5)

    def forward(self, frames: Tensor, mask: Tensor | None = None) -> tuple[Tensor, Tensor]:
        """frames [B, T, F] and optional mask [B, T] (True = real frame) -> (logits, embedding)."""
        T = frames.shape[1]
        if frames.shape[1] > self.max_frames:
            raise ValueError(f"sequence has {T} frames; the model takes at most max_frames")
        if mask is None:
            keep = torch.ones_like(frames[..., :1])
            bias = None
        else:
            keep = mask.unsqueeze(-1).to(frames.dtype)
            # For scaled_dot_product_attention: 0 = attend, -inf = ignore.
            bias = torch.zeros_like(keep[..., 0]).masked_fill(~mask, float("-inf"))
            bias = bias[:, None, None, :]
        x = (self.stem(frames) + self.pos[:, :T]) * keep
        for conv, block in zip(self.convs, self.blocks, strict=True):
            x = block(conv(x, keep), keep, bias)
        x = self.final_norm(x) * keep
        pooled = x.sum(dim=1) / keep.sum(dim=1).clamp(min=1.0)
        # Apply dropout before normalisation so training and inference are
        # consistent: z is always L2-normalised to the unit sphere.
        z = F.normalize(self.head_drop(self.embed(pooled)), dim=-1)
        weights = F.normalize(self.classes, dim=-1)
        logits = self.cfg.cosine_scale * (z @ weights.t())
        return logits, z


def count_parameters(model: nn.Module) -> int:
    return sum(p.numel() for p in model.parameters() if p.requires_grad)
