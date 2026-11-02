import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { cellOf, waveOrder } from "../components/ContributionHeatmap";
import { Favicon } from "../components/Favicon";
import { KineticText } from "../components/KineticText";
import { hookGrid, useLayout } from "../components/layout";
import { easeInOut, mix, prog } from "../components/motion";
import { LEVELS } from "../data/demo";
import { FONT, GH, ICON, SITE } from "../theme";
import { local, T } from "../timings";
import { HOOK_END_SCALE } from "./Hook";

/** 8.1–12.1 s: the heatmap collapses into the app icon, which reveals the wordmark. */
export const Logo: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, V } = useLayout();
  const g = hookGrid(W, H);
  const S = V ? 260 : 220; // favicon size
  const slide = prog(frame, local("logo", T.logo.wordmark), 42, easeInOut);
  const wordW = V ? 0 : 500;
  const cx = V ? W / 2 : W / 2 - mix(0, (wordW + 40) / 2, slide) ;
  const cy = V ? H * 0.4 : H * 0.42;
  const fx = cx - S / 2, fy = cy - S / 2;
  const tile = prog(frame, local("logo", T.logo.tile), 30);
  const pitch = g.cell + g.gap;
  // screen position of heatmap cell at the end of the hook push-in (scaled about the frame centre)
  const fromScreen = (x: number, y: number) => ({ x: W / 2 + (x - W / 2) * HOOK_END_SCALE, y: H / 2 + (y - H / 2) * HOOK_END_SCALE });
  const targets = Array.from({ length: 25 }, (_, k) => Math.round((k * (LEVELS.length - 1)) / 24));
  const span = local("logo", T.logo.convergeEnd);
  const rects = LEVELS.map((lv, i) => {
    const { col, row } = cellOf(i);
    if (col < g.fromCol || col >= g.fromCol + g.cols) return null;
    const c = col - g.fromCol;
    const start = fromScreen(g.x + c * pitch, g.y + row * pitch);
    const slot = targets.indexOf(i);
    const tr = slot >= 0 ? Math.floor(slot / 5) : 2, tc = slot >= 0 ? slot % 5 : 2;
    const end = { x: fx + ((ICON.offset + tc * ICON.pitch) / 32) * S, y: fy + ((ICON.offset + tr * ICON.pitch) / 32) * S };
    const delay = waveOrder(c, row, g.cols) * span * 0.35;
    const k = easeInOut(Math.min(1, Math.max(0, (frame - delay) / (span * 0.65))));
    const size = mix(g.cell * HOOK_END_SCALE, (ICON.cell / 32) * S, k);
    const op = slot >= 0 ? 1 : 1 - Math.min(1, k * 1.4);
    const color = slot >= 0 && k > 0.6 ? ICON.cells[ICON.grid[tr][tc]] : GH.levels[lv];
    if (op <= 0) return null;
    return <div key={i} style={{ position: "absolute", left: mix(start.x, end.x, k), top: mix(start.y, end.y, k), width: size, height: size, borderRadius: size * 0.24, background: color, opacity: op }} />;
  });
  const settled = frame >= span;
  return (
    <AbsoluteFill>
      {!settled && rects}
      <div style={{ position: "absolute", left: fx, top: fy, filter: `drop-shadow(0 30px 60px rgba(57,211,83,${0.18 * tile}))` }}>
        <Favicon size={S} tile={tile} cells={settled ? 1 : 0} />
      </div>
      {!V && (
        <div style={{ position: "absolute", left: fx + S + 40, top: cy - 70, height: 140, display: "flex", alignItems: "center", overflow: "hidden", width: wordW + 20 }}>
          <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 132, letterSpacing: "-0.045em", color: SITE.foreground, transform: `translateX(${(1 - slide) * -110}%)`, opacity: slide }}>{COPY.wordmark}</div>
        </div>
      )}
      {V && (
        <div style={{ position: "absolute", top: cy + S / 2 + 40, width: "100%", textAlign: "center", fontFamily: FONT.sans, fontWeight: 600, fontSize: 140, letterSpacing: "-0.045em", color: SITE.foreground, opacity: slide, transform: `translateY(${(1 - slide) * 40}px)` }}>{COPY.wordmark}</div>
      )}
      <div style={{ position: "absolute", top: V ? cy + S / 2 + 230 : cy + S / 2 + 70, width: "100%", display: "flex", justifyContent: "center" }}>
        <KineticText text={COPY.tagline} start={local("logo", T.logo.tagline)} size={V ? 56 : 48} weight={400} color={SITE.muted} tracking={-0.01} />
      </div>
    </AbsoluteFill>
  );
};
