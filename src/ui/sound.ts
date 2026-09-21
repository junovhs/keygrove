/**
 * The interface sound bus. Borrowed from noceremony's `src/sound.ts` and re-voiced
 * for a typing tutor: the keystroke is the sound heard most, so it is the quietest
 * and most varied; misses are a soft low thud, never a buzzer; the passage end and
 * a lesson clear are the only cues allowed to feel like a reward.
 *
 * - **Attachable.** Any element can make a noise by carrying `data-sound="cue"`;
 *   one delegated listener on the document handles the whole app. Code paths that
 *   are not a press call `sound.play("cue")` directly.
 * - **Procedural.** Every cue is a recipe of a few oscillator / noise voices, so the
 *   app ships with real sound and zero download. A cue with `src` plays a sample.
 * - **Cheap.** Nothing is constructed until the first audible use, and nothing at
 *   all while muted. Repeated cues are rate-limited so a held key cannot buzz.
 */

/** A single synthesised layer of a cue. */
export type Voice = {
  /** Oscillator shape. Omit for a band-passed noise burst instead. */
  wave?: OscillatorType;
  /** Starting frequency in Hz — the oscillator's pitch, or the noise band's centre. */
  freq: number;
  /** Optional glide target; the voice sweeps `freq` → `to`, then holds. */
  to?: number;
  /** How much of the voice's length the glide takes, 0–1 (default 1). Short = struck, long = slide. */
  bend?: number;
  /** Offset from the top of the cue, in seconds. */
  at?: number;
  /** Length in seconds. */
  dur: number;
  /** Peak gain, before the cue's own gain and the master gain. */
  gain: number;
  /** Attack ramp in seconds; shorter reads as a click, longer as a swell. */
  attack?: number;
  /** Resonance of the noise band. Ignored by oscillator voices. */
  q?: number;
};

type Cue = {
  voices?: Voice[];
  src?: string;
  /** Overall level for the cue, 0–1. Defaults to 1. */
  gain?: number;
  /** Random pitch spread either side of unity, so repeats are not identical. */
  jitter?: number;
  /** Minimum gap between two plays of this cue, in ms. Defaults to 45. */
  throttle?: number;
};

/** One run of notes played `repeats` times end to end; overlapping so it rings as one shimmer. */
export function arpeggio(notes: readonly number[], repeats: number, step: number, dur: number, gain: number): Voice[] {
  const voices: Voice[] = [];
  for (let pass = 0; pass < repeats; pass += 1) {
    const level = gain * (1 - (pass / repeats) * 0.55);
    notes.forEach((freq, index) => {
      voices.push({ wave: 'sine', freq, at: Number(((pass * notes.length + index) * step).toFixed(4)), dur, gain: level, attack: 0.002 });
    });
  }
  return voices;
}

/** C, E, G, G#, G in the sixth octave. */
const SPARKLE_NOTES = [1046.5, 1318.51, 1567.98, 1661.22, 1567.98];

/**
 * The cue palette. Names describe the *event*, never the sound, so a cue can be
 * re-voiced without a rename rippling through the app.
 */
const CUES = {
  /** A correct keystroke. A dry wooden tick; `play('key', v, pitch)` varies it with the combo. */
  key: {
    voices: [
      { wave: 'triangle', freq: 640, to: 520, bend: 0.2, dur: 0.038, gain: 0.16, attack: 0.001 },
      { freq: 3400, dur: 0.009, gain: 0.05, q: 1.4 },
    ],
    gain: 0.7,
    jitter: 0.04,
    throttle: 18,
  },
  /** A word landing on Space. A slightly rounder tick with a tiny lift. */
  word: {
    voices: [
      { wave: 'triangle', freq: 440, to: 392, bend: 0.25, dur: 0.05, gain: 0.18, attack: 0.001 },
      { wave: 'sine', freq: 784, at: 0.03, dur: 0.06, gain: 0.08, attack: 0.002 },
      { freq: 2600, dur: 0.01, gain: 0.045, q: 1.3 },
    ],
    gain: 0.85,
    jitter: 0.04,
    throttle: 30,
  },
  /** A wrong key. Low and short — a shrug, not a scolding. */
  miss: {
    voices: [
      { wave: 'triangle', freq: 175, to: 128, bend: 0.3, dur: 0.11, gain: 0.3, attack: 0.002 },
      { freq: 900, to: 300, bend: 0.4, dur: 0.06, gain: 0.09, q: 0.9 },
    ],
    gain: 1.2,
    jitter: 0.03,
    throttle: 60,
  },
  /** A long streak milestone (every 20 correct in a row). A tiny high glint. */
  streak: {
    voices: [
      { wave: 'sine', freq: 1318.5, dur: 0.05, gain: 0.09, attack: 0.002 },
      { wave: 'sine', freq: 1568, at: 0.045, dur: 0.09, gain: 0.08, attack: 0.002 },
    ],
    gain: 1.2,
    jitter: 0.02,
    throttle: 300,
  },
  /** Starting a passage. A soft lift so the first key is not the first thing heard. */
  begin: {
    voices: [
      { wave: 'sine', freq: 392, dur: 0.06, gain: 0.14, attack: 0.004 },
      { wave: 'sine', freq: 523, at: 0.05, dur: 0.09, gain: 0.13, attack: 0.004 },
    ],
    gain: 1.3,
    jitter: 0.02,
  },
  /** A passage finished. A tiny C-major charm, high and dry enough not to be a jingle. */
  complete: {
    voices: [
      { wave: 'sine', freq: 523.25, dur: 0.075, gain: 0.2, attack: 0.003 },
      { wave: 'sine', freq: 659.25, at: 0.055, dur: 0.085, gain: 0.19, attack: 0.003 },
      { wave: 'sine', freq: 783.99, at: 0.11, dur: 0.14, gain: 0.18, attack: 0.004 },
      { wave: 'triangle', freq: 1567.98, at: 0.11, dur: 0.075, gain: 0.035 },
    ],
    gain: 1.55,
    jitter: 0.02,
  },
  /** A lesson cleared for the first time: the charm, one step higher and longer. */
  clear: {
    voices: [
      { wave: 'sine', freq: 659.25, dur: 0.08, gain: 0.2, attack: 0.003 },
      { wave: 'sine', freq: 783.99, at: 0.07, dur: 0.09, gain: 0.19, attack: 0.003 },
      { wave: 'sine', freq: 1046.5, at: 0.15, dur: 0.22, gain: 0.18, attack: 0.004 },
      { wave: 'sine', freq: 1318.5, at: 0.15, dur: 0.16, gain: 0.07, attack: 0.004 },
      { wave: 'triangle', freq: 2093, at: 0.15, dur: 0.09, gain: 0.03 },
    ],
    gain: 1.5,
    jitter: 0.02,
  },
  /** A passage that did not pass. Two soft descending notes, gentle. */
  settle: {
    voices: [
      { wave: 'sine', freq: 494, dur: 0.08, gain: 0.16, attack: 0.006 },
      { wave: 'sine', freq: 392, at: 0.075, dur: 0.14, gain: 0.16, attack: 0.006 },
    ],
    gain: 1.3,
    jitter: 0.02,
  },
  /** A keepsake earned at a checkpoint: the sparkle run. */
  sparkle: {
    voices: arpeggio(SPARKLE_NOTES, 5, 0.042, 0.115, 0.13),
    gain: 1.4,
    jitter: 0.02,
    throttle: 400,
  },
  /** A panel, drawer or view arriving. Two quick notes upward. */
  open: {
    voices: [
      { wave: 'sine', freq: 330, dur: 0.065, gain: 0.22, attack: 0.003 },
      { wave: 'sine', freq: 494, at: 0.055, dur: 0.085, gain: 0.2, attack: 0.003 },
      { wave: 'triangle', freq: 988, at: 0.055, dur: 0.05, gain: 0.045 },
    ],
    gain: 1.6,
    jitter: 0.03,
  },
  /** The same surface leaving. The same interval, travelled down. */
  close: {
    voices: [
      { wave: 'sine', freq: 494, dur: 0.06, gain: 0.2, attack: 0.003 },
      { wave: 'sine', freq: 330, at: 0.052, dur: 0.08, gain: 0.22, attack: 0.003 },
    ],
    gain: 1.5,
    jitter: 0.03,
  },
  /** Stepping through a briefing or a level. Two tiny dry ticks. */
  step: {
    voices: [
      { wave: 'triangle', freq: 659, dur: 0.036, gain: 0.16, attack: 0.001 },
      { wave: 'triangle', freq: 784, at: 0.042, dur: 0.04, gain: 0.14, attack: 0.001 },
      { freq: 3400, dur: 0.007, gain: 0.035, q: 1.6 },
    ],
    gain: 1.65,
    jitter: 0.06,
    throttle: 30,
  },
  /** Choosing a lesson, finger or level. A crisp two-note answer. */
  select: {
    voices: [
      { wave: 'sine', freq: 587, dur: 0.045, gain: 0.19, attack: 0.002 },
      { wave: 'sine', freq: 740, at: 0.045, dur: 0.065, gain: 0.18, attack: 0.002 },
      { freq: 2900, dur: 0.009, gain: 0.04, q: 1.4 },
    ],
    gain: 1.3,
    jitter: 0.05,
  },
  /** A briefing tile filled by the right key. */
  fill: {
    voices: [
      { wave: 'triangle', freq: 523, dur: 0.05, gain: 0.18, attack: 0.001 },
      { wave: 'sine', freq: 1046, at: 0.03, dur: 0.07, gain: 0.07, attack: 0.002 },
      { freq: 3000, dur: 0.009, gain: 0.04, q: 1.4 },
    ],
    gain: 1.3,
    jitter: 0.04,
  },
  /** A switch turning on. */
  'toggle-on': {
    voices: [
      { wave: 'sine', freq: 440, dur: 0.055, gain: 0.2, attack: 0.002 },
      { wave: 'sine', freq: 660, at: 0.05, dur: 0.08, gain: 0.19, attack: 0.002 },
      { freq: 2600, dur: 0.009, gain: 0.035, q: 1.3 },
    ],
    gain: 1.3,
    jitter: 0.03,
  },
  /** The same switch turning off. */
  'toggle-off': {
    voices: [
      { wave: 'sine', freq: 660, dur: 0.05, gain: 0.18, attack: 0.002 },
      { wave: 'sine', freq: 440, at: 0.047, dur: 0.075, gain: 0.2, attack: 0.002 },
    ],
    gain: 1.05,
    jitter: 0.03,
  },
  /** A status message sliding in. A soft, unobtrusive pair. */
  toast: {
    voices: [
      { wave: 'sine', freq: 494, dur: 0.065, gain: 0.12, attack: 0.008 },
      { wave: 'sine', freq: 587, at: 0.052, dur: 0.09, gain: 0.11, attack: 0.008 },
    ],
    gain: 1.95,
    jitter: 0.03,
  },
  /** A refused action or a reset. Low and short. */
  error: {
    voices: [
      { wave: 'triangle', freq: 165, to: 130, bend: 0.25, dur: 0.1, gain: 0.3, attack: 0.003 },
      { wave: 'triangle', freq: 155, to: 124, bend: 0.25, at: 0.1, dur: 0.13, gain: 0.28 },
    ],
    gain: 1.75,
    jitter: 0.02,
  },
  /** Pointer crossing a control. Deliberately near-subliminal. */
  hover: {
    voices: [
      { wave: 'sine', freq: 720, to: 780, bend: 0.45, dur: 0.032, gain: 0.052 },
      { freq: 3200, dur: 0.007, gain: 0.022, q: 1.5 },
    ],
    gain: 1.1,
    jitter: 0.07,
    throttle: 70,
  },
  /** Hovering navigation and view-changing controls. */
  'hover-nav': {
    voices: [
      { wave: 'sine', freq: 620, to: 760, bend: 0.5, dur: 0.038, gain: 0.052 },
      { freq: 3000, dur: 0.007, gain: 0.02, q: 1.5 },
    ],
    gain: 1.75,
    jitter: 0.06,
    throttle: 70,
  },
  /** Hovering a primary / constructive control. */
  'hover-positive': {
    voices: [
      { wave: 'sine', freq: 700, dur: 0.028, gain: 0.045 },
      { wave: 'sine', freq: 880, at: 0.025, dur: 0.034, gain: 0.04 },
    ],
    gain: 1.65,
    jitter: 0.05,
    throttle: 70,
  },
  /** Hovering a destructive control (reset progress). */
  'hover-danger': {
    voices: [
      { wave: 'triangle', freq: 410, to: 340, bend: 0.45, dur: 0.045, gain: 0.065 },
      { freq: 1700, dur: 0.008, gain: 0.018, q: 1.2 },
    ],
    gain: 2,
    jitter: 0.04,
    throttle: 70,
  },
  /** Generic press for any `data-sound` host that names nothing. */
  tap: {
    voices: [
      { wave: 'triangle', freq: 520, to: 460, bend: 0.35, dur: 0.055, gain: 0.24, attack: 0.002 },
      { freq: 2600, dur: 0.011, gain: 0.055, q: 1.3 },
    ],
    gain: 0.75,
    jitter: 0.05,
  },
} satisfies Record<string, Cue>;

/** Every cue the app can ask for. New entries in {@link CUES} widen this. */
export type CueName = keyof typeof CUES;

const STORAGE_KEY = 'keygrove:muted';
/** Ceiling on the whole bus, so no cue can ever be loud. */
const MASTER_GAIN = 0.65;
/** Longest a single cue may run; the safety net for a malformed recipe. */
const MAX_CUE_SECONDS = 1.5;

function storedMute(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

/** Owns the audio graph. One instance is exported as {@link sound}. */
class SoundBus {
  private muted = storedMute();
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private readonly samples = new Map<string, AudioBuffer | 'loading'>();
  private readonly lastPlayed = new Map<string, number>();
  private readonly listeners = new Set<(muted: boolean) => void>();
  /** Test seam: every play() that gets past the mute / throttle gates is reported here. */
  onPlay: ((name: CueName) => void) | null = null;

  get isMuted(): boolean { return this.muted; }

  /** Subscribe to mute changes; returns an unsubscribe. Fires immediately. */
  onChange(fn: (muted: boolean) => void): () => void {
    this.listeners.add(fn);
    fn(this.muted);
    return () => this.listeners.delete(fn);
  }

  /** Muting suspends the context rather than tearing it down, so unmuting is instant. */
  setMuted(muted: boolean): void {
    if (muted === this.muted) return;
    this.muted = muted;
    try { localStorage.setItem(STORAGE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
    if (muted) void this.ctx?.suspend(); else void this.ctx?.resume();
    this.listeners.forEach((fn) => fn(muted));
  }

  toggleMuted(): boolean { this.setMuted(!this.muted); return this.muted; }

  /**
   * Play a cue. Safe from anywhere, at any rate, before any gesture and while muted —
   * all of those are silent no-ops. `pitch` scales every voice's frequency (1 = as written).
   */
  play(name: CueName, volume = 1, pitch = 1): void {
    if (this.muted || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) return;
    const cue: Cue = CUES[name];
    if (!cue) return;
    const now = performance.now();
    const previous = this.lastPlayed.get(name) ?? -Infinity;
    if (now - previous < (cue.throttle ?? 45)) return;
    this.lastPlayed.set(name, now);
    this.onPlay?.(name);
    const ctx = this.context();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const level = (cue.gain ?? 1) * volume;
    if (cue.src) this.playSample(cue.src, level, cue.jitter ?? 0);
    else this.playVoices(cue.voices ?? [], level, (cue.jitter ?? 0), pitch);
  }

  /**
   * Wire the declarative surface: `data-sound="cue"` plays on pointerdown, and hovering any
   * button/link plays `hover` (or `data-sound-hover`). `fallback`/`hoverFallback` answer for
   * elements that carry no attribute; returning null means silence.
   */
  wire(fallback?: (host: HTMLElement) => CueName | null, hoverFallback?: (host: HTMLElement) => CueName | null, root: Document | HTMLElement = document): void {
    root.addEventListener('pointerdown', (event) => {
      const target = event.target as HTMLElement | null;
      const host = target?.closest<HTMLElement>('[data-sound]');
      if (host && !host.hasAttribute('disabled')) { this.play((host.dataset.sound || 'tap') as CueName); return; }
      if (!fallback || !target) return;
      const actionable = target.closest<HTMLElement>('button, a, [data-action]');
      if (!actionable || actionable.hasAttribute('disabled')) return;
      const cue = fallback(actionable);
      if (cue) this.play(cue);
    }, { passive: true });
    root.addEventListener('pointerover', (event: Event) => {
      const pointer = event as PointerEvent;
      if (pointer.pointerType !== 'mouse') return;
      const host = (pointer.target as HTMLElement | null)?.closest<HTMLElement>('[data-sound-hover], button, a, [data-action]');
      if (!host || host.hasAttribute('disabled') || host.getAttribute('aria-disabled') === 'true' || host.contains(pointer.relatedTarget as Node | null)) return;
      const cue = host.dataset.soundHover || hoverFallback?.(host) || 'hover';
      this.play(cue as CueName);
    }, { passive: true });
  }

  /* ------------------------------------------------------------ internals */

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    const ctx = new Ctor({ latencyHint: 'interactive' });
    const master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
    this.ctx = ctx; this.master = master;
    return ctx;
  }

  /** One second of white noise, generated once and shared by every noise voice. */
  private noiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.noise) return this.noise;
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    this.noise = buffer;
    return buffer;
  }

  private playVoices(voices: readonly Voice[], level: number, jitter: number, pitch: number): void {
    const ctx = this.ctx!, master = this.master!;
    // One random offset for the whole cue: layers stay in tune while consecutive presses differ.
    const detune = (1 + (Math.random() * 2 - 1) * jitter) * pitch;
    const t0 = ctx.currentTime + 0.001;
    for (const voice of voices) {
      const start = t0 + (voice.at ?? 0);
      const dur = Math.min(voice.dur, MAX_CUE_SECONDS);
      const stop = start + dur;
      const from = voice.freq * detune, to = (voice.to ?? voice.freq) * detune;
      const bendUntil = start + dur * Math.min(Math.max(voice.bend ?? 1, 0.02), 1);
      const gain = ctx.createGain();
      const attack = Math.min(voice.attack ?? 0.004, dur * 0.5);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(voice.gain * level, start + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, stop);
      gain.connect(master);
      if (voice.wave) {
        const osc = ctx.createOscillator();
        osc.type = voice.wave;
        osc.frequency.setValueAtTime(from, start);
        if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, bendUntil);
        osc.connect(gain); osc.start(start); osc.stop(stop);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      } else {
        const src = ctx.createBufferSource();
        src.buffer = this.noiseBuffer(ctx); src.loop = true;
        const band = ctx.createBiquadFilter();
        band.type = 'bandpass'; band.Q.value = voice.q ?? 1.2;
        band.frequency.setValueAtTime(from, start);
        if (to !== from) band.frequency.exponentialRampToValueAtTime(to, bendUntil);
        src.connect(band).connect(gain);
        src.start(start, Math.random() * 0.5); src.stop(stop);
        src.onended = () => { src.disconnect(); band.disconnect(); gain.disconnect(); };
      }
    }
  }

  private playSample(src: string, level: number, jitter: number): void {
    const ctx = this.ctx!, master = this.master!;
    const cached = this.samples.get(src);
    if (cached === undefined) {
      this.samples.set(src, 'loading');
      void fetch(src).then((r) => r.arrayBuffer()).then((b) => ctx.decodeAudioData(b)).then((buf) => this.samples.set(src, buf)).catch(() => this.samples.delete(src));
      return;
    }
    if (cached === 'loading') return;
    const source = ctx.createBufferSource();
    source.buffer = cached;
    source.playbackRate.value = 1 + (Math.random() * 2 - 1) * jitter;
    const gain = ctx.createGain();
    gain.gain.value = level;
    source.connect(gain).connect(master);
    source.start();
    source.onended = () => { source.disconnect(); gain.disconnect(); };
  }
}

/** The app's single sound bus. */
export const sound = new SoundBus();

/** Binds the topbar mute button to the bus and keeps its pressed state and label in step. */
export function wireAudioToggle(button: HTMLElement | null): void {
  if (!button) return;
  sound.onChange((muted) => {
    button.classList.toggle('is-muted', muted);
    button.setAttribute('aria-pressed', String(!muted));
    button.setAttribute('aria-label', muted ? 'Turn interface sounds on' : 'Turn interface sounds off');
    button.title = muted ? 'Sound off' : 'Sound on';
  });
  button.addEventListener('click', () => {
    const muted = sound.toggleMuted();
    // Confirm the new state in the medium it controls: unmuting is audible, muting has nothing left to say.
    if (!muted) sound.play('toggle-on');
  });
}
