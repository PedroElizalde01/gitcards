import { useCurrentFrame } from "remotion";
import { LEVELS } from "../data/demo";
import { GH } from "../theme";
import { easeOut } from "./motion";

export const WEEKS = 53;

/** Cell i (day index) → column/row in GitHub's layout: weeks are columns, Sunday on top. */
export const cellOf = (i: number) => ({ col: Math.floor(i / 7), row: i % 7 });

/** Diagonal wave order 0..1: left-to-right with a slight top-to-bottom lean. */
export const waveOrder = (col: number, row: number, cols = WEEKS) => (col + row * 1.6) / (cols - 1 + 6 * 1.6);

/**
 * The demo year as a heatmap. Each square lights up as the wave passes (start→end frames),
 * easing in with a small scale settle and ramping through the palette up to its own level.
 * `cols` limits how many weeks are drawn (vertical layout), `fromCol` picks where they start.
 */
export const ContributionHeatmap: React.FC<{ cell: number; gap: number; start: number; end: number; palette?: string[]; cols?: number; fromCol?: number }> = ({
  cell, gap, start, end, palette = GH.levels, cols = WEEKS, fromCol = 0,
}) => {
  const frame = useCurrentFrame();
  const pitch = cell + gap;
  const span = end - start;
  return (
    <svg width={cols * pitch - gap} height={7 * pitch - gap} style={{ display: "block", overflow: "visible" }}>
      {LEVELS.map((lv, i) => {
        const { col, row } = cellOf(i);
        if (col < fromCol || col >= fromCol + cols) return null;
        const c = col - fromCol;
        const at = start + waveOrder(c, row, cols) * span * 0.78;
        const k = easeOut(Math.min(1, Math.max(0, (frame - at) / (span * 0.22))));
        const shown = Math.round(k * lv); // ramps through the levels up to its own
        const x = c * pitch, y = row * pitch, h = cell / 2;
        const s = 0.55 + 0.45 * k;
        return (
          <rect key={i} x={x} y={y} width={cell} height={cell} rx={cell * 0.22} fill={palette[k > 0 ? shown : 0]} opacity={0.35 + 0.65 * k}
            transform={`translate(${x + h} ${y + h}) scale(${s}) translate(${-x - h} ${-y - h})`} />
        );
      })}
    </svg>
  );
};
