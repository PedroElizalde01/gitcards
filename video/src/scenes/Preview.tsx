import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { useLayout } from "../components/layout";
import { ModeToggle } from "../components/ModeToggle";
import { easeInOut, prog } from "../components/motion";
import { WalletPass } from "../components/WalletPass";
import { FONT, GH } from "../theme";
import { f, local, T } from "../timings";

const L = (s: number) => local("preview", s);

/** Back of the pass: the real back fields (src/server/wallet.ts), laid out as a details list. */
const Back: React.FC<{ w: number; h: number }> = ({ w, h }) => (
  <div style={{ width: w, height: h, borderRadius: w * 0.036, background: GH.bg, padding: w * 0.06, boxSizing: "border-box", fontFamily: FONT.sans, boxShadow: "0 30px 70px -18px rgba(0,0,0,.65)", display: "flex", flexDirection: "column", gap: w * 0.045 }}>
    {COPY.back.map(([label, value]) => (
      <div key={label} style={{ borderBottom: "1px solid #21262d", paddingBottom: w * 0.035 }}>
        <div style={{ fontSize: w * 0.03, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em", color: GH.label }}>{label}</div>
        <div style={{ fontSize: w * 0.038, lineHeight: 1.35, color: value.startsWith("https://") ? "#58a6ff" : GH.fg, marginTop: 6 }}>{value}</div>
      </div>
    ))}
  </div>
);

/** 36.1–44.1 s: the pass floats in 3D, switches to light and back, then flips to its back. */
export const Preview: React.FC = () => {
  const frame = useCurrentFrame();
  const { V } = useLayout();
  const w = V ? 720 : 520, h = w * (392 / 300);
  const t = frame / 60;
  const light = prog(frame, L(T.preview.toLight), 18, easeInOut) * (1 - prog(frame, L(T.preview.toDark), 18, easeInOut));
  const flip = prog(frame, L(T.preview.flip), f(T.preview.flipDur), easeInOut);
  const enter = prog(frame, 0, 50);
  const ry = Math.sin(t * 0.9) * 9 + flip * 180;
  const rx = Math.cos(t * 0.7) * 5;
  const sheen = frame < L(40) ? prog(frame, L(36.5), f(1.6)) : prog(frame, L(41.6), f(1.8));
  const showBack = ry % 360 > 90 && ry % 360 < 270;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: V ? 70 : 44 }}>
      <div style={{ perspective: 1800, opacity: enter, transform: `translateY(${(1 - enter) * 40 + Math.sin(t * 1.3) * 8}px)` }}>
        <div style={{ position: "relative", width: w, height: h, transformStyle: "preserve-3d", transform: `rotateX(${rx}deg) rotateY(${ry}deg)` }}>
          {!showBack ? (
            <div style={{ position: "absolute", inset: 0 }}>
              <WalletPass theme="classic:dark" width={w} pre="pv-d" sheen={sheen} style={{ position: "absolute" }} />
              {light > 0 && <WalletPass theme="classic:light" width={w} pre="pv-l" sheen={sheen} style={{ position: "absolute", opacity: light }} />}
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0, transform: "rotateY(180deg)" }}>
              <Back w={w} h={h} />
            </div>
          )}
        </div>
      </div>
      <div style={{ opacity: enter * (1 - flip) }}><ModeToggle light={light} scale={V ? 1.5 : 1.15} /></div>
    </AbsoluteFill>
  );
};
