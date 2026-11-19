import {
  Camera,
  CameraOff,
  Eye,
  EyeOff,
  Film,
  FlipHorizontal,
  Hand,
  LoaderCircle,
  Play,
  RotateCcw,
  Square,
  Video,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Session, SessionSnapshot } from '../app/session';
import { CAMERA_MESSAGES, listCameraDevices, type CameraDevice } from '../lib/camera';
import { drawLandmarks } from '../lib/overlay';
import { handsMissing } from '../ml/landmarks';
import type { FrameStatus } from '../ml/segmenter';
import { ReplayPicker } from './ReplayPicker';
import { Button } from './ui';

const REPLAY_ASPECT = 9 / 16;

const STATUS_TEXT: Record<FrameStatus, string> = {
  nothing: 'No one in view',
  'no-hands': 'Hands not in view',
  partial: 'Move back: shoulders out of view',
  crowded: 'More than one person in view',
  ok: 'Tracking',
};

function StatusPill({ snap }: { snap: SessionSnapshot }) {
  if (snap.source === 'off' || snap.source === 'starting' || snap.replay?.done) return null;
  const signing = snap.signing;
  const status = snap.status;
  const text = signing ? 'Reading sign…' : status ? STATUS_TEXT[status] : 'Waiting for landmarks…';
  const tone = signing
    ? 'bg-accent text-accent-ink'
    : status === 'ok'
      ? 'bg-emerald-700/90 text-white'
      : 'bg-black/60 text-white';
  return (
    <p
      className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shadow-sm backdrop-blur ${tone}`}
      data-testid="tracking-status"
    >
      <span
        aria-hidden
        className={`size-2 rounded-full bg-current ${signing ? 'pulse-dot' : ''}`}
      />
      {text}
    </p>
  );
}

export function Stage({ session, snap }: { session: Session; snap: SessionSnapshot }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showReplay, setShowReplay] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [mirrored, setMirrored] = useState(true);
  const [devices, setDevices] = useState<CameraDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');

  useEffect(() => {
    session.attachVideo(videoRef.current);
    return () => {
      session.attachVideo(null);
    };
  }, [session]);

  // Load available camera devices
  useEffect(() => {
    let active = true;
    void listCameraDevices().then((devs) => {
      if (active && devs.length > 0) {
        setDevices(devs);
        if (!selectedDevice) {
          setSelectedDevice(devs[0]?.deviceId ?? '');
        }
      }
    });
    return () => {
      active = false;
    };
  }, [selectedDevice, snap.source]);

  // Keep canvas backing store responsive to DPR
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let pending: Float32Array | null = null;
    let raf = 0;
    const off = session.onFrame((frame, source) => {
      if (source !== 'camera' && handsMissing(frame)) return;
      pending = frame;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const ctx = canvasRef.current?.getContext('2d');
        const video = videoRef.current;
        if (!ctx || !pending) return;
        const aspect =
          source === 'camera' && video && video.videoWidth
            ? video.videoWidth / video.videoHeight
            : REPLAY_ASPECT;

        if (showLandmarks) {
          drawLandmarks(ctx, pending, undefined, { aspect });
        } else {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
      });
    });
    return () => {
      off();
      cancelAnimationFrame(raf);
    };
  }, [session, showLandmarks]);

  // Clear overlay when stopped
  useEffect(() => {
    if (snap.source === 'off') {
      const canvas = canvasRef.current;
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [snap.source]);

  const live = snap.source === 'camera';
  const replaying = snap.source === 'replay' || snap.source === 'injected';
  const problem = snap.cameraProblem ? CAMERA_MESSAGES[snap.cameraProblem] : null;

  const openReplay = () => {
    session.dismissCameraProblem();
    setShowReplay(true);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId);
    if (live) {
      session.stopCamera();
      void session.startCamera(deviceId);
    }
  };

  return (
    <section aria-labelledby="stage-heading" className="min-w-0">
      <h2 id="stage-heading" className="sr-only">
        Camera and landmarks
      </h2>
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-stage text-stage-ink shadow-card border border-line">
        <video
          ref={videoRef}
          className={`${mirrored ? 'mirrored' : ''} absolute inset-0 h-full w-full object-contain ${live ? '' : 'invisible'}`}
          muted
          playsInline
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full ${mirrored && live ? 'mirrored' : ''}`}
          role="img"
          aria-label="Tracked hands and upper body"
        />

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 z-10">
          <StatusPill snap={snap} />
          <div className="flex items-center gap-2">
            {live ? (
              <span className="rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono text-white/90 backdrop-blur">
                On-device processing
              </span>
            ) : replaying && snap.replay ? (
              <span className="max-w-[60%] truncate rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono text-white/90 backdrop-blur">
                Replay: {snap.replay.clip.title}
              </span>
            ) : null}
          </div>
        </div>

        {snap.source === 'off' && !problem ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
            <div className="grid size-13 place-items-center rounded-lg bg-white/10 border border-white/15">
              <Hand aria-hidden className="size-6 text-white/90" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-white">
                {snap.paused ? 'Camera paused' : 'Sign to your camera'}
              </p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-white/70 leading-relaxed">
                {snap.paused
                  ? 'The camera paused automatically when this tab was hidden.'
                  : 'All recognition runs 100% in your browser. Video never leaves your device.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  void session.startCamera(selectedDevice || undefined);
                }}
              >
                <Camera aria-hidden className="size-5" />
                {snap.paused ? 'Resume camera' : 'Start camera'}
              </Button>
              <Button variant="onStage" size="lg" onClick={openReplay}>
                <Film aria-hidden className="size-5" />
                Replay a clip
              </Button>
            </div>
          </div>
        ) : null}

        {snap.source === 'starting' ? (
          <div
            role="status"
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-white/80 z-10"
          >
            <LoaderCircle aria-hidden className="size-7 animate-spin text-accent" />
            Initializing camera…
          </div>
        ) : null}

        {problem ? (
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 z-20">
            <div
              role="alert"
              className="w-full max-w-md rounded-lg bg-surface p-5 text-sm text-ink shadow-lg border border-line"
              data-testid="camera-problem"
            >
              <p className="flex items-center gap-2 text-base font-semibold text-danger">
                <CameraOff aria-hidden className="size-5" />
                {problem.title}
              </p>
              <p className="mt-2 leading-relaxed text-ink-muted">{problem.body}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" onClick={openReplay}>
                  <Film aria-hidden className="size-4" />
                  Replay a clip instead
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    void session.startCamera(selectedDevice || undefined);
                  }}
                >
                  <RotateCcw aria-hidden className="size-4" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {snap.replay?.done && snap.source === 'replay' ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 z-10">
            <Button
              variant="onStage"
              onClick={() => {
                if (snap.replay) session.playReplay(snap.replay.clip);
              }}
            >
              <RotateCcw aria-hidden className="size-4" />
              Clip finished · play again
            </Button>
          </div>
        ) : null}

        {snap.trackerError && live ? (
          <p
            role="alert"
            className="absolute inset-x-3 bottom-3 rounded-md bg-black/80 px-3 py-2 text-sm text-white border border-white/20 z-10"
          >
            {snap.trackerError}
          </p>
        ) : null}
      </div>

      {/* Camera and Stage Control Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {live ? (
            <Button
              variant="secondary"
              onClick={() => {
                session.stopCamera();
              }}
            >
              <Square aria-hidden className="size-4 text-danger" />
              Stop camera
            </Button>
          ) : null}

          {replaying ? (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  session.stopReplay();
                }}
              >
                <Square aria-hidden className="size-4 text-danger" />
                Stop replay
              </Button>
              {snap.replay ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    if (snap.replay) session.playReplay(snap.replay.clip);
                  }}
                >
                  <Play aria-hidden className="size-4 text-accent" />
                  Play again
                </Button>
              ) : null}
            </>
          ) : null}

          {live || replaying ? (
            <Button
              variant="ghost"
              onClick={() => {
                setShowReplay((v) => !v);
              }}
              aria-expanded={showReplay}
            >
              <Film aria-hidden className="size-4 text-ink-muted" />
              {showReplay ? 'Hide clips' : 'Replay clips'}
            </Button>
          ) : null}
        </div>

        {/* View adjustments: Landmarks toggle, Mirror toggle, Device picker */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
          <button
            type="button"
            onClick={() => {
              setShowLandmarks((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
              showLandmarks
                ? 'border-accent-border bg-accent-soft text-accent'
                : 'border-line bg-surface text-ink-muted hover:bg-surface-muted'
            }`}
            title="Toggle landmark skeletal overlays"
          >
            {showLandmarks ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            <span>Landmarks</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMirrored((prev) => !prev);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer transition-colors ${
              mirrored
                ? 'border-line bg-surface text-ink hover:bg-surface-muted'
                : 'border-accent-border bg-accent-soft text-accent'
            }`}
            title="Toggle mirror view"
          >
            <FlipHorizontal className="size-3.5" />
            <span>Mirror</span>
          </button>

          {devices.length > 1 ? (
            <div className="inline-flex items-center gap-1 border border-line rounded-md bg-surface px-2 py-1">
              <Video className="size-3.5 text-ink-muted" />
              <select
                aria-label="Select camera device"
                value={selectedDevice}
                onChange={(e) => {
                  handleDeviceChange(e.target.value);
                }}
                className="bg-transparent text-xs text-ink outline-none cursor-pointer pr-1"
              >
                {devices.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      </div>

      {showReplay ? (
        <ReplayPicker
          active={snap.replay?.clip.id ?? null}
          onPlay={(clip) => {
            session.playReplay(clip);
            if (window.matchMedia('(max-width: 1023px)').matches) setShowReplay(false);
          }}
          onClose={() => {
            setShowReplay(false);
          }}
        />
      ) : null}
    </section>
  );
}
