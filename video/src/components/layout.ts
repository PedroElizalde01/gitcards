import { useVideoConfig } from "remotion";
import { WEEKS } from "./ContributionHeatmap";

export const useLayout = () => {
  const { width: W, height: H } = useVideoConfig();
  return { W, H, V: H > W };
};

/** Hook heatmap geometry, shared by the hook and the logo converge so the match cut lines up. */
export function hookGrid(W: number, H: number) {
  const V = H > W;
  const cols = V ? 27 : WEEKS;
  const fromCol = V ? WEEKS - 27 : 0;
  const cell = V ? 30 : 26, gap = V ? 6 : 6;
  const w = cols * (cell + gap) - gap, h = 7 * (cell + gap) - gap;
  const x = (W - w) / 2, y = V ? H * 0.36 - h / 2 : H * 0.4 - h / 2;
  return { cols, fromCol, cell, gap, x, y, w, h };
}
