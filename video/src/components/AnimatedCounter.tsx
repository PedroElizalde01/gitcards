import { useCurrentFrame } from "remotion";
import { prog } from "./motion";

/** Counts 0 → value between start and end frames with tabular figures, US formatting. */
export const AnimatedCounter: React.FC<{ value: number; start: number; end: number; style?: React.CSSProperties }> = ({ value, start, end, style }) => {
  const frame = useCurrentFrame();
  const n = Math.round(value * prog(frame, start, end - start));
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{n.toLocaleString("en-US")}</span>;
};
