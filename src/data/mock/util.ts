// Deterministic seeded helpers so sample data is identical on every reload.
// Ported from the web app's mock layer.

const hashSeed = (seed: string): number => {
  let h = 1_779_033_703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.codePointAt(i)!, 3_432_918_353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
};

const mulberry32 = (seed: number) => (): number => {
  seed = (seed + 0x6d_2b_79_f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
};

export type Rand = () => number;

export const rngFor = (seed: string): Rand => mulberry32(hashSeed(seed));

export const intBetween = (rand: Rand, min: number, max: number): number =>
  Math.floor(min + rand() * (max - min + 1));

export const pick = <T>(rand: Rand, arr: readonly T[]): T =>
  arr[Math.floor(rand() * arr.length)];

export const shuffle = <T>(rand: Rand, arr: readonly T[]): T[] => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const eachDay = (
  from: string,
  to: string,
): { date: string; label: string }[] => {
  const out: { date: string; label: string }[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  for (
    let d = new Date(start);
    d <= end && out.length < 400;
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    out.push({
      date: d.toISOString().slice(0, 10),
      label: `${DAY_NAMES[d.getUTCDay()]} ${d.getUTCDate()}`,
    });
  }
  return out;
};

// 24 hourly counts with a daytime-heavy shape, summing near `total`.
export const hourlyShape = (rand: Rand, total: number): number[] => {
  const weights = [
    2, 1, 1, 1, 1, 2, 4, 7, 11, 14, 15, 14, 13, 12, 12, 13, 14, 15, 13, 10, 8,
    6, 4, 3,
  ];
  const jittered = weights.map((w) => w * (0.7 + rand() * 0.6));
  const sum = jittered.reduce((a, b) => a + b, 0);
  return jittered.map((w) => Math.round((w / sum) * total));
};
