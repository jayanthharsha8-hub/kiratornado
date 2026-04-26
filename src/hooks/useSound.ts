// Minimal UI sound system — plays short synthesised ticks via Web Audio API.
// No external files needed. Sounds are generated procedurally.

let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

type SoundType = "tick" | "pulse" | "boot";

// Cyber/glitch UI sounds — short, soft, premium feel. Volume ~40%.
const MASTER = 0.4;

const SOUND_CONFIG: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
  tick:  { freq: 2400, duration: 0.05, type: "square",   gain: 0.05 },
  pulse: { freq: 720,  duration: 0.18, type: "triangle", gain: 0.07 },
  boot:  { freq: 200,  duration: 0.8,  type: "sawtooth", gain: 0.06 },
};

let lastPlay = 0;

export function playSound(sound: SoundType = "tick") {
  const now = Date.now();
  if (now - lastPlay < 70) return;
  lastPlay = now;

  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();

    const cfg = SOUND_CONFIG[sound];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = cfg.freq;
    filter.Q.value = 6;

    osc.type = cfg.type;
    osc.frequency.setValueAtTime(cfg.freq, ctx.currentTime);

    if (sound === "tick") {
      // tiny glitch downward sweep for cyber tick
      osc.frequency.exponentialRampToValueAtTime(cfg.freq * 0.55, ctx.currentTime + cfg.duration);
    } else if (sound === "pulse") {
      osc.frequency.exponentialRampToValueAtTime(cfg.freq * 1.6, ctx.currentTime + cfg.duration * 0.8);
    } else if (sound === "boot") {
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + cfg.duration * 0.6);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + cfg.duration);
    }

    const peak = cfg.gain * MASTER;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + cfg.duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + cfg.duration + 0.02);
  } catch {
    // Silently ignore if audio not available
  }
}

export function useSound() {
  return { playSound };
}
