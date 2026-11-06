import { presentationData as data } from './presentation-data';

export type Layer = { readonly src: string; readonly x: number; readonly y: number; readonly w: number; readonly h: number };
type Pulse = { start: number; duration: number; index: number; peak: number };
export const COLLAGE_PERIOD = 52;
export const GRID_PERIOD = 38;
export const CERAMIC_PERIOD = 11;
export const CHARACTER_PERIOD = 12;

function random(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

function schedule(count: number, period: number, seed: number, fade: boolean): Pulse[] {
  const rand = random(seed);
  let order = Array.from({ length: count }, (_, i) => i);
  const shuffle = () => { order = order.sort(() => rand() - 0.5); };
  shuffle();
  let cursor = 0;
  let time = 0.45;
  let group = 0;
  const pulses: Pulse[] = [];
  while (time < period - (fade ? 2.5 : 4)) {
    const size = [1, 2, 1, 3, 1, 1, 2][group % 7];
    for (let k = 0; k < size; k++) {
      if (cursor >= order.length) { cursor = 0; shuffle(); }
      pulses.push({
        start: time + k * (rand() * 0.22),
        duration: fade ? 1 + rand() * 0.7 : 0.8 + rand() * 0.4,
        index: order[cursor++],
        peak: fade ? 0.7 : 0.4 + rand() * 0.15,
      });
    }
    time += fade ? 1.1 + rand() * 0.55 : 1.15 + rand() * 0.55;
    group++;
  }
  return pulses;
}

const objectPulses = schedule(data.objects.length, COLLAGE_PERIOD, 39177, false);
const imagePulses = schedule(data.grid.length, GRID_PERIOD, 721039, true);

export function pulseValues(time: number, kind: 'objects' | 'grid') {
  const pulses = kind === 'objects' ? objectPulses : imagePulses;
  const count = kind === 'objects' ? data.objects.length : data.grid.length;
  const period = kind === 'objects' ? COLLAGE_PERIOD : GRID_PERIOD;
  const t = time % period;
  const values = Array<number>(count).fill(0);
  for (const pulse of pulses) {
    const phase = (t - pulse.start) / pulse.duration;
    if (phase > 0 && phase < 1) {
      // Cosine acceleration: stationary at the start, peak, and end.
      values[pulse.index] = Math.max(values[pulse.index], pulse.peak * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase)));
    }
  }
  return values;
}

export function ceramicState(time: number): { active: number; amount: number } {
  const t = time % CERAMIC_PERIOD;
  // Center first, then right. Faster four-second reconstruction cycles, with
  // intact pauses; neither vase starts before the other has reconstructed.
  const active = t >= 5.5 ? 0 : 1;
  const phase = (t - (active === 1 ? 0.5 : 5.5)) / 4;
  if (phase <= 0 || phase >= 1) return { active, amount: 0 };
  return { active, amount: Math.pow(Math.sin(Math.PI * phase), 2) };
}

export function characterState(time: number, slot: number) {
  const t = time % CHARACTER_PERIOD;
  const order = [0, 1, 3, 2];
  const initial = order.indexOf(slot);
  const local = t - 1.1 - slot * 0.16;
  if (local <= 0 || local >= 9.6) return { from: slot, to: slot, mix: 0 };
  const phase = local / 2.4;
  const step = Math.floor(phase);
  const part = phase - step;
  const from = order[(initial + step) % 4];
  const to = order[(initial + step + 1) % 4];
  // Existing-view hold, followed by a gentle transition, never a fake rotation.
  const p = Math.max(0, Math.min(1, (part - 0.48) / 0.52));
  const mix = 0.5 - 0.5 * Math.cos(Math.PI * p);
  return { from, to, mix };
}

export function fragmentMovement(piece: Layer, whole: Layer, index: number, amount: number) {
  const centerX = whole.x + whole.w / 2;
  const centerY = whole.y + whole.h / 2;
  const px = piece.x + piece.w / 2;
  const py = piece.y + piece.h / 2;
  const angle = Math.atan2(py - centerY, px - centerX);
  const distance = 25 + (index % 3) * 5;
  return {
    dx: Math.cos(angle) * distance * amount,
    dy: Math.sin(angle) * distance * amount,
    angle: ((index % 2 ? 1 : -1) * (0.7 + (index % 3) * 0.25) * Math.PI / 180) * amount,
  };
}