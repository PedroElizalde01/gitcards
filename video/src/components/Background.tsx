import { AbsoluteFill, useCurrentFrame } from "remotion";
import { SITE } from "../theme";

/** Deep dark base, a slow drifting green glow, a faint dot grid (the contribution grid as texture) and film grain. */
export const Background: React.FC<{ glow?: number }> = ({ glow = 1 }) => {
  const frame = useCurrentFrame();
  const t = frame / 60;
  const gx = 50 + Math.sin(t * 0.21) * 18, gy = 40 + Math.cos(t * 0.17) * 14;
  return (
    <AbsoluteFill style={{ background: SITE.background }}>
      <AbsoluteFill style={{ background: `radial-gradient(60% 55% at ${gx}% ${gy}%, rgba(38,166,65,${0.13 * glow}), transparent 70%), radial-gradient(45% 40% at ${100 - gx}% ${100 - gy}%, rgba(57,211,83,${0.05 * glow}), transparent 70%)` }} />
      <AbsoluteFill style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1.2px)", backgroundSize: "28px 28px", backgroundPosition: `${(t * 2) % 28}px 0px`, maskImage: "radial-gradient(75% 70% at 50% 50%, black 30%, transparent 100%)" }} />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 8} stitchTiles="stitch" /></filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
