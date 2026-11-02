import { pickTheme } from "../../src/lib/designs";

/** Site tokens (src/app/globals.css, dark scheme). The video lives on the dark site. */
export const SITE = {
  background: "#09090b",
  foreground: "#fafafa",
  muted: "#a1a1aa",
  line: "#27272a",
  /** Light scheme, for the toggle moment. */
  light: { background: "#fafaf9", foreground: "#18181b", muted: "#71717a", line: "#e4e4e7" },
};

/** Contribution palette (GH_DARK in src/lib/designs.ts) and the GitHub-dark card surface. */
export const GH = {
  levels: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
  bg: "#0d1117",
  fg: "#e6edf3",
  label: "#7d8590",
};

/** Flash colour of the site's ascii-reveal animation (src/components/card-reveal.tsx). Used sparingly. */
export const ACCENT = "#3dff6e";

/** App icon (src/app/icon.svg): tile, cell colours and the 5×5 level pattern, row 0 at the top. */
export const ICON = {
  tile: "#0d1117",
  cells: ["#1b222c", "#0e4429", "#006d32", "#26a641", "#39d353"],
  grid: [
    [0, 0, 1, 3, 4],
    [0, 1, 2, 4, 3],
    [1, 2, 4, 3, 2],
    [2, 4, 3, 2, 1],
    [3, 4, 2, 1, 0],
  ],
  // geometry in the 32-unit viewBox
  size: 32, radius: 7.5, cell: 4.4, cellRadius: 1.1, pitch: 5.4, offset: 3,
};

export const FONT = {
  sans: "Geist, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
};

/** The five designs of the theme morph: real designs from src/lib/designs.ts, in this order. */
export const THEMES = ["classic:dark", "months:light", "rings:dark", "swiss:light", "console:light"].map((t) => {
  const { design, mode } = pickTheme(t);
  return { key: t, design, mode, name: design.name, bg: design.pal[mode].bg };
});

/** Motion: high-damping springs and the expo-out curve from the brief. */
export const SPRING = { damping: 26, stiffness: 120, mass: 1 };
export const SPRING_SOFT = { damping: 30, stiffness: 70, mass: 1.2 };
