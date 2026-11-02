import { useCurrentFrame } from "remotion";
import { ACCENT, THEMES } from "../theme";
import { easeInOut } from "./motion";
import { WalletPass, passAspect } from "./WalletPass";

const COLS = 10, ROWS = 13;
const jitter = (i: number) => ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;

/** Per-cell alpha of a diagonal contribution-cell wipe at progress p. */
function cells(p: number) {
  const out: number[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const th = (c / COLS) * 0.55 + (1 - r / ROWS) * 0.3 + jitter(r * COLS + c) * 0.15;
    out.push(Math.min(1, Math.max(0, (p * 1.25 - th) / 0.1)));
  }
  return out;
}

const svgUri = (body: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${COLS} ${ROWS}" preserveAspectRatio="none">${body}</svg>`)}")`;

/**
 * One pass that morphs through the five designs. At each switch frame the next design
 * decodes in through a diagonal grid of cells (the contribution grid as a wipe), with a
 * faint accent flash on the wavefront, echoing the site's ascii-reveal. Data never changes.
 */
export const ThemeSwitcher: React.FC<{ width: number; switches: number[]; morph: number; onIndex?: (i: number) => void }> = ({ width, switches, morph }) => {
  const frame = useCurrentFrame();
  let idx = 0;
  for (let i = 0; i < switches.length; i++) if (frame >= switches[i]) idx = i;
  const p = idx > 0 ? easeInOut(Math.min(1, (frame - switches[idx]) / morph)) : 1;
  const box = width * (392 / 300);
  const layer = (k: number, extra?: React.CSSProperties) => {
    const t = THEMES[k];
    return (
      <div style={{ position: "absolute", left: 0, top: (box - width * passAspect(t.key)) / 2, ...extra }}>
        <WalletPass theme={t.key} width={width} pre={`sw${k}`} />
      </div>
    );
  };
  const a = cells(p);
  const mask = svgUri(a.map((v, i) => (v > 0 ? `<rect x="${i % COLS}" y="${Math.floor(i / COLS)}" width="1.02" height="1.02" fill="#fff" fill-opacity="${v.toFixed(3)}"/>` : "")).join(""));
  const flash = a.map((v, i) => (v > 0 && v < 1 ? `<rect x="${i % COLS + 0.08}" y="${Math.floor(i / COLS) + 0.08}" width=".84" height=".84" rx=".12" fill="${ACCENT}" fill-opacity="${((1 - Math.abs(2 * v - 1)) * 0.55).toFixed(3)}"/>` : "")).join("");
  return (
    <div style={{ position: "relative", width, height: box }}>
      {p < 1 && idx > 0 && layer(idx - 1)}
      {layer(idx, p < 1 ? { maskImage: mask, WebkitMaskImage: mask, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" } : undefined)}
      {p < 1 && idx > 0 && (
        <div style={{ position: "absolute", inset: 0, backgroundImage: svgUri(flash), backgroundSize: "100% 100%", mixBlendMode: "screen" }} />
      )}
    </div>
  );
};

/** Index of the design shown at a local frame. */
export const themeIndexAt = (frame: number, switches: number[]) => switches.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
