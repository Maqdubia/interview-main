// Lightweight client-side audio metric extraction from a recorded Blob.
// Computes duration, RMS energy, estimated speech rate (when transcript words known),
// and detects basic filler word density.

export type AudioMetrics = {
  durationSec: number;
  avgRms: number;
  fillerCount: number;
  fillerWords: string[];
  wordCount: number;
  wordsPerMinute: number;
  fillerRatio: number;
};

const FILLERS = ["um", "uh", "uhm", "erm", "like", "you know", "basically", "actually", "literally", "kinda", "sorta"];

export async function audioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => {
      const d = isFinite(a.duration) ? a.duration : 0;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    a.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    a.src = url;
  });
}

export async function rmsEnergy(blob: Blob): Promise<number> {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const buf = await blob.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const ch = decoded.getChannelData(0);
    let sum = 0;
    const step = Math.max(1, Math.floor(ch.length / 20000));
    let n = 0;
    for (let i = 0; i < ch.length; i += step) { sum += ch[i] * ch[i]; n++; }
    ctx.close();
    return Math.sqrt(sum / Math.max(n, 1));
  } catch { return 0; }
}

export function countFillers(transcript: string) {
  const t = " " + transcript.toLowerCase() + " ";
  let count = 0;
  const found: string[] = [];
  FILLERS.forEach((f) => {
    const re = new RegExp(`\\b${f}\\b`, "g");
    const m = t.match(re);
    if (m) { count += m.length; found.push(f); }
  });
  return { count, found };
}

export async function computeAudioMetrics(blob: Blob, transcript: string): Promise<AudioMetrics> {
  const [durationSec, avgRms] = await Promise.all([audioDuration(blob), rmsEnergy(blob)]);
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordsPerMinute = durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0;
  const { count, found } = countFillers(transcript);
  const fillerRatio = wordCount > 0 ? count / wordCount : 0;
  return { durationSec: Math.round(durationSec * 10) / 10, avgRms: Math.round(avgRms * 1000) / 1000, fillerCount: count, fillerWords: found, wordCount, wordsPerMinute, fillerRatio: Math.round(fillerRatio * 1000) / 1000 };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
