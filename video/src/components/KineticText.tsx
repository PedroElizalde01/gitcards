import { useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { easeOut, prog } from "./motion";

/**
 * Masked per-word slide-up with blur-to-sharp and a letter-spacing settle.
 * In at `start`, optional exit at `end` (fade, lift and blur). Stagger: 4 frames (~67 ms) per word.
 */
export const KineticText: React.FC<{
  text: string; start: number; end?: number; size: number; weight?: number; color?: string; font?: string;
  align?: React.CSSProperties["textAlign"]; stagger?: number; lineHeight?: number; maxWidth?: number; tracking?: number;
}> = ({ text, start, end, size, weight = 600, color = "#fafafa", font = FONT.sans, align = "center", stagger = 4, lineHeight = 1.08, maxWidth, tracking = -0.025 }) => {
  const frame = useCurrentFrame();
  const out = end === undefined ? 0 : prog(frame, end, 18);
  if (frame < start - 1 || out >= 1) return null;
  const words = text.split(" ");
  return (
    <div style={{ fontFamily: font, fontWeight: weight, fontSize: size, color, textAlign: align, lineHeight, maxWidth, opacity: 1 - out, transform: `translateY(${-out * size * 0.25}px)`, filter: out ? `blur(${out * 8}px)` : undefined }}>
      {words.map((w, i) => {
        const k = prog(frame, start + i * stagger, 34, easeOut);
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top", paddingBottom: size * 0.12, marginBottom: -size * 0.12 }}>
            <span style={{ display: "inline-block", transform: `translateY(${(1 - k) * 105}%)`, filter: `blur(${(1 - k) * 10}px)`, opacity: k, letterSpacing: `${tracking + (1 - k) * 0.06}em` }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          </span>
        );
      })}
    </div>
  );
};
