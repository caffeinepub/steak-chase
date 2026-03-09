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
  playBossSurvived: () => void;
  playBossDied: () => void;
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

  const playBossSurvived = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      // Triumphant ascending fanfare — big and dramatic
      [523, 659, 784, 1047, 1319].forEach((freq, i) => {
        playTone(ctx, freq, now + i * 0.12, 0.18, "square", 0.28);
      });
      // Final flourish chord
      playTone(ctx, 1047, now + 0.7, 0.5, "triangle", 0.22);
      playTone(ctx, 1319, now + 0.72, 0.5, "triangle", 0.18);
    });

  const playBossDied = () =>
    play((ctx) => {
      const now = ctx.currentTime;
      // Dramatic descending death knell
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(330, now);
      osc1.frequency.linearRampToValueAtTime(110, now + 0.6);
      gain1.gain.setValueAtTime(0.35, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc1.start(now);
      osc1.stop(now + 0.7);
      // Low rumble
      playTone(ctx, 80, now + 0.1, 0.5, "sawtooth", 0.2);
      playTone(ctx, 60, now + 0.3, 0.6, "sawtooth", 0.22);
    });

  return {
    playCollect,
    playPowerUp,
    playEnemyEat,
    playLifeLost,
    playGameOver,
    playLevelComplete,
    playBossSurvived,
    playBossDied,
  };
}
