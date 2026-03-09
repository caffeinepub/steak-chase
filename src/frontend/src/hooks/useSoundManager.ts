/**
 * useSoundManager — synthesized game sounds via Web Audio API.
 * No audio files loaded; all sounds generated programmatically.
 */

interface SoundManager {
  playCollect: () => void;
  playPowerUp: () => void;
  playEnemyEat: () => void;
  playLifeLost: () => void;
  playGameOver: () => void;
  playLevelComplete: () => void;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    return new Ctor();
  } catch {
    return null;
  }
}

// Lazily create a shared AudioContext (one per page lifecycle)
let sharedCtx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (!sharedCtx || sharedCtx.state === "closed") {
    sharedCtx = getAudioContext();
  }
  return sharedCtx;
}

function resumeCtx(ctx: AudioContext): Promise<void> {
  if (ctx.state === "suspended") return ctx.resume();
  return Promise.resolve();
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType = "triangle",
  gainPeak = 0.25,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

export function useSoundManager(muted: boolean): SoundManager {
  const play = (fn: (ctx: AudioContext) => void) => {
    if (muted) return;
    const ctx = getCtx();
    if (!ctx) return;
    resumeCtx(ctx)
      .then(() => fn(ctx))
      .catch(() => undefined);
  };

  const playCollect = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 880, now, 0.08, "triangle", 0.2);
    });

  const playPowerUp = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 440, now, 0.1, "square", 0.18);
      playTone(ctx, 660, now + 0.1, 0.1, "square", 0.18);
      playTone(ctx, 880, now + 0.2, 0.15, "square", 0.2);
    });

  const playEnemyEat = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      playTone(ctx, 600, now, 0.06, "sine", 0.25);
      playTone(ctx, 900, now + 0.07, 0.1, "sine", 0.25);
    });

  const playLifeLost = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.3);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    });

  const playGameOver = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      // Three descending tones — sad jingle
      playTone(ctx, 440, now, 0.2, "sawtooth", 0.28);
      playTone(ctx, 330, now + 0.22, 0.2, "sawtooth", 0.28);
      playTone(ctx, 220, now + 0.45, 0.4, "sawtooth", 0.3);
    });

  const playLevelComplete = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      // Quick ascending victory fanfare
      [523, 659, 784, 1047].forEach((freq, i) => {
        playTone(ctx, freq, now + i * 0.1, 0.12, "triangle", 0.22);
      });
    });

  return {
    playCollect,
    playPowerUp,
    playEnemyEat,
    playLifeLost,
    playGameOver,
    playLevelComplete,
  };
}
