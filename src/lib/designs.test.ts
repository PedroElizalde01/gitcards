// Run: pnpm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { DESIGNS, LUM, MODES, cardHtml, fitsIOS, levels, pickTheme, type Profile } from "./designs.ts";

const profile = (counts: number[]): Profile => ({
  login: "octocat", name: null, total: counts.reduce((a, b) => a + b, 0), calendar: { start: "2025-11-02", counts },
  joined: "2011-01-25", updated: "2026-11-01T00:00:00Z", avatar: "data:image/png;base64,", lum: Array(LUM * LUM).fill(0.5),
});

test("levels: zero stays 0, quartiles of non-zero days map to 1-4", () => {
  assert.deepEqual(levels([0, 1, 2, 3, 4, 100]), [0, 1, 1, 2, 3, 4]);
  assert.deepEqual(levels([0, 0, 0]), [0, 0, 0]);
});

test("every design renders in both modes, for a busy year and an empty one", () => {
  for (const counts of [Array.from({ length: 365 }, (_, i) => i % 5), Array(365).fill(0), []])
    for (const d of DESIGNS) for (const m of MODES) assert.doesNotMatch(cardHtml(d, m, profile(counts)), /NaN|undefined|Infinity/, `${d.id}:${m}`);
});

test("themes: unknown falls back, posters need iOS 27", () => {
  assert.equal(pickTheme("classic").theme, "classic:dark");
  assert.equal(pickTheme("nope:light").theme, "classic:light");
  const poster = pickTheme("bento:dark").design;
  assert.equal(fitsIOS(poster, 26), false);
  assert.equal(fitsIOS(poster, 27), true);
  assert.equal(fitsIOS(poster, null), true);
  assert.equal(fitsIOS(pickTheme("rings:light").design, 18), true);
});
