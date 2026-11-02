import { LUM, levels, type Profile } from "../../../src/lib/designs";

/**
 * Fictional demo user. Deterministic: same seed, same year, every scene and every card.
 * 53 weeks × 7 days starting on a Sunday, weekday-heavy, three streaks, two quiet weeks,
 * scaled so the year adds up to exactly TOTAL.
 */
export const TOTAL = 1284;
export const START = "2025-11-02"; // a Sunday, so column = week, row = weekday (GitHub's layout)
export const DAYS = 365;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCounts(): number[] {
  const rnd = mulberry32(20261102);
  const raw = Array.from({ length: DAYS }, (_, i) => {
    const wd = i % 7; // 0 = Sunday
    const weekend = wd === 0 || wd === 6;
    const season = 1 + 0.45 * Math.sin((i / DAYS) * Math.PI * 4 - 0.6); // spring and autumn swell
    const active = rnd() < (weekend ? 0.32 : 0.82);
    return active ? (weekend ? 0.6 : 1.8) * season * (0.4 + rnd() * 1.6) : 0;
  });
  const quiet = [11, 34]; // two quiet weeks
  for (const w of quiet) for (let d = 0; d < 7; d++) raw[w * 7 + d] = 0;
  const streaks: [number, number][] = [[60, 9], [150, 14], [290, 23]];
  for (const [from, len] of streaks) for (let d = from; d < from + len; d++) raw[d] = Math.max(raw[d], 0.9 + rnd() * 1.4);
  // Scale to TOTAL with largest-remainder rounding, keeping active days at ≥ 1.
  const sum = raw.reduce((a, b) => a + b, 0);
  const scaled = raw.map((v) => (v / sum) * TOTAL);
  const counts = scaled.map((v) => (v > 0 ? Math.max(1, Math.floor(v)) : 0));
  let left = TOTAL - counts.reduce((a, b) => a + b, 0);
  const order = scaled.map((v, i) => [v - Math.floor(v), i] as const).filter(([, i]) => scaled[i] > 0).sort((a, b) => b[0] - a[0]);
  for (let k = 0; left !== 0; k = (k + 1) % order.length) {
    const i = order[k][1];
    if (left > 0) (counts[i]++, left--);
    else if (counts[i] > 1) (counts[i]--, left++);
  }
  return counts;
}

export const COUNTS = makeCounts();
export const LEVELS = levels(COUNTS);

/** Abstract monogram avatar: a gradient tile with initials. Not a photo, not a person. */
const AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#39d353"/><stop offset=".55" stop-color="#0e7a3a"/><stop offset="1" stop-color="#0d1117"/></linearGradient></defs><rect width="240" height="240" fill="url(#g)"/><text x="120" y="146" text-anchor="middle" font-family="Geist, Arial, sans-serif" font-weight="600" font-size="84" fill="#ffffff">AR</text></svg>`;
export const AVATAR = `data:image/svg+xml;base64,${btoa(AVATAR_SVG)}`;

/** Luminance grid the pixel-art designs dither from: the same diagonal gradient as the avatar. */
const LUMS = Array.from({ length: LUM * LUM }, (_, i) => {
  const x = i % LUM, y = Math.floor(i / LUM);
  const d = (x + y) / (2 * (LUM - 1));
  const inLetters = y > 8 && y < 16 && x > 4 && x < 20 && (x + y) % 3 !== 0;
  return inLetters ? 1 : Math.round((0.85 - d * 0.75) * 100) / 100;
});

export const DEMO: Profile = {
  login: "alexrivera-dev",
  name: "Alex Rivera",
  total: TOTAL,
  calendar: { start: START, counts: COUNTS },
  joined: "2019-03-14",
  updated: "2026-11-02T06:00:00Z",
  avatar: AVATAR,
  lum: LUMS,
};

/** Where the demo cards' QR codes point: the real site, so a scan from the video lands somewhere real. */
export const QR_URL = "https://gitcard.cospel.ar";
