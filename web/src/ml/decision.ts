/**
 * Turning model logits into what the page says.
 *
 * The score is a temperature-scaled softmax over shipped signs. It ranks
 * classes. It is not a calibrated probability, so the page never calls it
 * "confidence" and never treats a score near 30% as a match.
 *
 * Bands (defaults, overridable in settings):
 * - high: "Likely match"
 * - moderate: "Possible match — please confirm"
 * - low: "Sign not recognised"
 */

export interface Calibration {
  temperature: number;
  notSureBelow: number;
}

export interface Guess {
  index: number;
  probability: number;
}

/**
 * Product thresholds. `recogniseMin` is clamped at 0.35 so a 0.30 score cannot
 * be shown as a match, whatever the settings slider says.
 */
export interface ConfidenceThresholds {
  recogniseMin: number;
  likelyMin: number;
  /** Top-1 minus top-2 below this downgrades a likely match to a confirmation prompt. */
  minMargin: number;
}

export const MIN_RECOGNISE_SCORE = 0.35;

export const DEFAULT_THRESHOLDS: ConfidenceThresholds = {
  recogniseMin: 0.4,
  likelyMin: 0.62,
  minMargin: 0.08,
};

export function clampThresholds(raw: Partial<ConfidenceThresholds> | undefined): ConfidenceThresholds {
  const recogniseMin = clamp(
    raw?.recogniseMin ?? DEFAULT_THRESHOLDS.recogniseMin,
    MIN_RECOGNISE_SCORE,
    0.9,
  );
  const likelyMin = clamp(raw?.likelyMin ?? DEFAULT_THRESHOLDS.likelyMin, recogniseMin, 0.95);
  const minMargin = clamp(raw?.minMargin ?? DEFAULT_THRESHOLDS.minMargin, 0, 0.5);
  return { recogniseMin, likelyMin, minMargin };
}

function clamp(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, value));
}

export type DecisionKind = 'likely' | 'possible' | 'unrecognised' | 'nothing';

export type ConfidenceBand = 'high' | 'moderate' | 'low';

export interface Decision {
  kind: DecisionKind;
  band: ConfidenceBand;
  /** Up to three guesses among shipped signs, best first. Listed even when unrecognised. */
  top: Guess[];
  reason?: 'low-confidence' | 'partial' | 'ambiguous' | 'unstable';
}

/** Wording for the live result. A low score is never phrased as a confirmed sign. */
export function matchWording(kind: DecisionKind): string {
  switch (kind) {
    case 'likely':
      return 'Likely match';
    case 'possible':
      return 'Possible match — please confirm';
    case 'unrecognised':
      return 'Sign not recognised';
    case 'nothing':
      return 'Nothing to read in that clip.';
  }
}

/** Softmax over the shipped signs only; unshipped signs get probability 0. */
export function softmaxOver(
  logits: ArrayLike<number>,
  shipped: readonly boolean[],
  temperature: number,
): Float64Array {
  const out = new Float64Array(logits.length);
  let max = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < logits.length; i++) {
    if (shipped[i]) max = Math.max(max, (logits[i] ?? Number.NaN) / temperature);
  }
  if (!Number.isFinite(max)) return out.fill(Number.NaN);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    if (!shipped[i]) continue;
    const e = Math.exp((logits[i] ?? Number.NaN) / temperature - max);
    out[i] = e;
    sum += e;
  }
  for (let i = 0; i < out.length; i++) out[i] = (out[i] ?? 0) / sum;
  return out;
}

function emptyDecision(kind: 'nothing' | 'unrecognised'): Decision {
  return {
    kind,
    band: 'low',
    top: [],
    ...(kind === 'unrecognised' ? { reason: 'low-confidence' as const } : {}),
  };
}

export function decide(
  logits: ArrayLike<number>,
  shipped: readonly boolean[],
  calibration: Calibration,
  quality: { partial?: boolean; thresholds?: Partial<ConfidenceThresholds> } = {},
  k = 3,
): Decision {
  if (!shipped.some(Boolean)) return emptyDecision('nothing');
  for (let i = 0; i < logits.length; i++) {
    if (!Number.isFinite(logits[i] ?? Number.NaN)) return emptyDecision('nothing');
  }
  const thresholds = clampThresholds(quality.thresholds);
  const probs = softmaxOver(logits, shipped, calibration.temperature);
  const top = Array.from(probs, (probability, index) => ({ index, probability }))
    .filter((g) => shipped[g.index] && Number.isFinite(g.probability))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, k);
  const best = top[0]?.probability ?? 0;
  const second = top[1]?.probability ?? 0;
  if (!(best >= thresholds.recogniseMin)) {
    return {
      kind: 'unrecognised',
      band: 'low',
      top,
      reason: quality.partial ? 'partial' : 'low-confidence',
    };
  }
  let decision: Decision =
    best >= thresholds.likelyMin
      ? { kind: 'likely', band: 'high', top }
      : { kind: 'possible', band: 'moderate', top };
  if (best - second < thresholds.minMargin && decision.kind === 'likely') {
    decision = { ...decision, kind: 'possible', band: 'moderate', reason: 'ambiguous' };
  }
  if (quality.partial) {
    return { ...decision, kind: 'unrecognised', band: 'low', reason: 'partial' };
  }
  return decision;
}

export interface PriorPrediction {
  index: number;
  at: number;
}

/**
 * If a new likely label disagrees with the previous one inside a short window,
 * ask the signer to confirm instead of swapping the headline.
 * Agreement inside the window leaves the decision unchanged.
 */
export function stabilizeDecision(
  decision: Decision,
  prior: PriorPrediction | null,
  now: number,
  windowMs: number,
): Decision {
  const top = decision.top[0];
  if (!prior || !top || !(windowMs > 0) || now - prior.at > windowMs || now < prior.at) {
    return decision;
  }
  if (top.index === prior.index || decision.kind !== 'likely') return decision;
  return { ...decision, kind: 'possible', band: 'moderate', reason: 'unstable' };
}

/** Practice mode: how strongly the model saw the target sign (0..1). */
export function practiceScore(
  logits: ArrayLike<number>,
  shipped: readonly boolean[],
  target: number,
  calibration: Calibration,
): number {
  if (!shipped[target]) return 0;
  const p = softmaxOver(logits, shipped, calibration.temperature)[target] ?? 0;
  return Number.isFinite(p) ? p : 0;
}
