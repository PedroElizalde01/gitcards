import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { KineticText } from "../components/KineticText";
import { useLayout } from "../components/layout";
import { springAt } from "../components/motion";
import { WalletPass, passAspect } from "../components/WalletPass";
import { SITE, SPRING_SOFT, THEMES } from "../theme";
import { local, T } from "../timings";

/** 32.1–36.1 s: the five designs fan out like a hand of cards. Same data on every one. */
export const Fan: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, V } = useLayout();
  const open = springAt(frame, 0, fps, SPRING_SOFT);
  const drift = Math.sin(frame / 70) * 6;
  const cw = V ? 520 : 330;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: V ? 190 : 110, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
        <KineticText text={COPY.fanH} start={local("fan", T.fan.headline)} size={V ? 92 : 88} maxWidth={V ? 900 : undefined} />
        <KineticText text={COPY.fanSub} start={local("fan", T.fan.sub)} size={V ? 38 : 32} weight={400} color={SITE.muted} tracking={-0.01} />
      </div>
      <div style={{ position: "absolute", left: W / 2, top: V ? H * 0.62 : H * 0.64, perspective: 2000 }}>
        {THEMES.map((t, i) => {
          const k = i - 2; // -2..2, centre card in front
          const depth = Math.abs(k);
          const x = V ? k * 70 * open : k * 300 * open;
          const y = V ? k * 150 * open : depth * depth * 16 * open;
          const rot = V ? k * 3 * open : k * 9 * open;
          const h = cw * passAspect(t.key);
          return (
            <div key={t.key} style={{
              position: "absolute", left: -cw / 2 + x, top: -h / 2 + y + drift * (k % 2 ? 1 : -1) * 0.5,
              transform: `rotate(${rot}deg) translateZ(${-depth * 60}px) rotateY(${-k * 4 * open}deg)`,
              zIndex: V ? 10 + i : 10 - depth, filter: !V && depth === 2 ? `blur(${1.2 * open}px)` : undefined,
            }}>
              <WalletPass theme={t.key} width={cw} pre={`fan${i}`} lift={1.2} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
