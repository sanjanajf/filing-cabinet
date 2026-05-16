"use client";

const STORAGE_KEY = "workspace.sounds.enabled";

let ctx: AudioContext | null = null;
let cachedEnabled: boolean | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function soundsEnabled(): boolean {
  if (!isBrowser()) return false;
  if (cachedEnabled !== null) return cachedEnabled;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    cachedEnabled = raw === null ? true : raw !== "0";
  } catch {
    cachedEnabled = true;
  }
  return cachedEnabled;
}

export function setSoundsEnabled(on: boolean): void {
  cachedEnabled = on;
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

function getCtx(): AudioContext | null {
  if (!isBrowser()) return null;
  if (ctx) return ctx;
  const W = window as unknown as {
    AudioContext?: typeof AudioContext;
    webkitAudioContext?: typeof AudioContext;
  };
  const Ctor = W.AudioContext ?? W.webkitAudioContext;
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

type ToneOpts = {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  peak?: number;
  endFreq?: number;
};

function tone(audio: AudioContext, opts: ToneOpts) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = opts.type ?? "triangle";
  osc.frequency.setValueAtTime(opts.freq, opts.start);
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(40, opts.endFreq),
      opts.start + opts.duration
    );
  }
  const peak = opts.peak ?? 0.07;
  gain.gain.setValueAtTime(0.0001, opts.start);
  gain.gain.exponentialRampToValueAtTime(peak, opts.start + 0.008);
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    opts.start + opts.duration
  );
  osc.connect(gain).connect(audio.destination);
  osc.start(opts.start);
  osc.stop(opts.start + opts.duration + 0.02);
}

function playIfEnabled(fn: (audio: AudioContext, t: number) => void) {
  if (!soundsEnabled()) return;
  const audio = getCtx();
  if (!audio) return;
  if (audio.state === "suspended") {
    audio.resume().catch(() => {});
  }
  const t = audio.currentTime + 0.001;
  try {
    fn(audio, t);
  } catch {
    // ignore audio failures — never block UI
  }
}

export function playFolderOpen(): void {
  playIfEnabled((audio, t) => {
    tone(audio, { freq: 523.25, start: t, duration: 0.06, type: "triangle", peak: 0.06 });
    tone(audio, { freq: 783.99, start: t + 0.06, duration: 0.08, type: "triangle", peak: 0.06 });
  });
}

export function playFolderClose(): void {
  playIfEnabled((audio, t) => {
    tone(audio, { freq: 783.99, start: t, duration: 0.06, type: "triangle", peak: 0.06 });
    tone(audio, { freq: 523.25, start: t + 0.06, duration: 0.08, type: "triangle", peak: 0.06 });
  });
}

export function playFileMove(): void {
  playIfEnabled((audio, t) => {
    tone(audio, {
      freq: 1200,
      endFreq: 700,
      start: t,
      duration: 0.05,
      type: "square",
      peak: 0.04,
    });
  });
}

export function playImportDone(): void {
  playIfEnabled((audio, t) => {
    tone(audio, { freq: 659.25, start: t, duration: 0.07, type: "triangle", peak: 0.06 });
    tone(audio, { freq: 783.99, start: t + 0.07, duration: 0.07, type: "triangle", peak: 0.06 });
    tone(audio, { freq: 1046.5, start: t + 0.14, duration: 0.12, type: "triangle", peak: 0.07 });
  });
}

export function playNewNote(): void {
  playIfEnabled((audio, t) => {
    tone(audio, { freq: 1318.5, start: t, duration: 0.04, type: "triangle", peak: 0.05 });
    tone(audio, { freq: 1760, start: t + 0.035, duration: 0.06, type: "triangle", peak: 0.04 });
  });
}

export function playDelete(): void {
  playIfEnabled((audio, t) => {
    tone(audio, {
      freq: 180,
      endFreq: 90,
      start: t,
      duration: 0.09,
      type: "triangle",
      peak: 0.08,
    });
  });
}

export function playEmptyTrash(): void {
  playIfEnabled((audio, t) => {
    const duration = 0.32;
    tone(audio, {
      freq: 900,
      endFreq: 110,
      start: t,
      duration,
      type: "sawtooth",
      peak: 0.05,
    });
    tone(audio, {
      freq: 1300,
      endFreq: 180,
      start: t + 0.02,
      duration: duration - 0.02,
      type: "triangle",
      peak: 0.04,
    });
  });
}

export function playFolderReorder(): void {
  playIfEnabled((audio, t) => {
    tone(audio, { freq: 880, start: t, duration: 0.04, type: "triangle", peak: 0.05 });
    tone(audio, { freq: 988, start: t + 0.04, duration: 0.05, type: "triangle", peak: 0.05 });
  });
}
