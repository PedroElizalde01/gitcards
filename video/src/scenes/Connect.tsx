import { AbsoluteFill, Img, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { AnimatedCounter } from "../components/AnimatedCounter";
import { ConnectButton } from "../components/ConnectButton";
import { Cursor } from "../components/Cursor";
import { Favicon } from "../components/Favicon";
import { KineticText } from "../components/KineticText";
import { useLayout } from "../components/layout";
import { easeInOut, mix, prog } from "../components/motion";
import { WalletPass } from "../components/WalletPass";
import { AVATAR, TOTAL } from "../data/demo";
import { ACCENT, FONT, SITE } from "../theme";
import { local, T } from "../timings";

const L = (s: number) => local("connect", s);

/** Browser window around the real landing page (dark scheme). */
const Browser: React.FC<{ w: number; h: number; V: boolean; pressed: number }> = ({ w, h, V, pressed }) => (
  <div style={{ position: "relative", width: w, height: h, borderRadius: 18, overflow: "hidden", background: SITE.background, boxShadow: "0 50px 120px -30px rgba(0,0,0,.9), 0 0 0 1px #27272a" }}>
    <div style={{ height: 56, background: "#141416", display: "flex", alignItems: "center", gap: 18, padding: "0 20px", borderBottom: "1px solid #27272a" }}>
      <div style={{ display: "flex", gap: 8 }}>{["#3f3f46", "#3f3f46", "#3f3f46"].map((c, i) => <div key={i} style={{ width: 13, height: 13, borderRadius: 99, background: c }} />)}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, background: SITE.background, borderRadius: 10, padding: "8px 14px", maxWidth: V ? 420 : 420 }}>
        <Favicon size={18} />
        <span style={{ fontFamily: FONT.sans, fontSize: 14, color: SITE.foreground, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{COPY.tabTitle}</span>
      </div>
      <div style={{ flex: 1, height: 34, borderRadius: 10, background: "#1c1c1f", display: "flex", alignItems: "center", padding: "0 14px", fontFamily: FONT.sans, fontSize: 15, color: SITE.muted }}>{COPY.url}</div>
    </div>
    <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: V ? 50 : 70, padding: V ? "70px 60px" : "0 110px", height: h - 56 - (V ? 0 : 50), justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 22, width: V ? "100%" : 560 }}>
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: V ? 64 : 58, lineHeight: 1.05, letterSpacing: "-0.025em", color: SITE.foreground }}>{COPY.tagline}</div>
        <div style={{ fontFamily: FONT.sans, fontSize: V ? 26 : 21, lineHeight: 1.5, color: SITE.muted }}>{COPY.landingSub}</div>
        <div><ConnectButton scale={V ? 1.3 : 1.15} pressed={pressed} /></div>
        <div style={{ fontFamily: FONT.sans, fontSize: V ? 17 : 13, lineHeight: 1.5, color: SITE.muted }}>{COPY.landingFine}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <WalletPass theme="rings:dark" width={V ? 420 : 340} pre="land" lift={0.5} />
        <div style={{ fontFamily: FONT.sans, fontSize: V ? 16 : 13, color: SITE.muted }}>{COPY.sampleCard} · Activity Rings</div>
      </div>
    </div>
    {!V && <div style={{ position: "absolute", bottom: 18, left: 110, fontFamily: FONT.sans, fontSize: 12, color: SITE.muted }}>Powered by Cospel.ar. {COPY.disclaimer}</div>}
  </div>
);

const Lock: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <rect x="9" y="21" width="30" height="21" rx="5" stroke={SITE.foreground} strokeWidth="2.6" />
    <path d="M16 21v-6a8 8 0 0 1 16 0v6" stroke={SITE.foreground} strokeWidth="2.6" strokeLinecap="round" />
    <circle cx="24" cy="31" r="2.6" fill={ACCENT} />
  </svg>
);

/** 12.1–20.1 s: landing → "Continue with GitHub" → read-only beat → the profile loads. */
export const Connect: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, V } = useLayout();
  const bw = V ? 960 : 1560, bh = V ? 1380 : 860;
  const bx = (W - bw) / 2, by = (H - bh) / 2;
  // button centre in screen space (approximate from the browser layout)
  const btn = V ? { x: bx + 60 + 160, y: by + 56 + 70 + 300 } : { x: bx + 110 + (bw - 220 - 970) / 2 + 120, y: by + 530 };
  const move = prog(frame, L(T.connect.cursorStart), L(T.connect.click) - L(T.connect.cursorStart) - 4, easeInOut);
  const cx = mix(W * 0.82, btn.x, move), cy = mix(H * 0.9, btn.y, move);
  const click = prog(frame, L(T.connect.click), 22);
  const pressed = Math.sin(Math.PI * click);
  const dim = prog(frame, L(T.connect.privacyIn) - 6, 30);
  const privOut = prog(frame, L(T.connect.privacyOut), 18);
  const data = prog(frame, L(T.connect.dataIn), 30);
  const lockIn = prog(frame, L(T.connect.privacyIn), 40);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: bx, top: by, opacity: 1 - dim, filter: dim ? `blur(${dim * 14}px)` : undefined, transform: `scale(${1 - dim * 0.04})` }}>
        <Browser w={bw} h={bh} V={V} pressed={pressed} />
      </div>
      {dim < 1 && <Cursor x={cx} y={cy} size={V ? 40 : 32} click={click} opacity={(1 - dim) * prog(frame, L(T.connect.cursorStart) - 10, 12)} />}
      {/* read-only beat */}
      {frame >= L(T.connect.privacyIn) && privOut < 1 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 36, flexDirection: "column", opacity: 1 - privOut }}>
          <div style={{ width: 132, height: 132, borderRadius: 34, border: "1px solid #27272a", background: "rgba(24,24,27,.7)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${0.85 + 0.15 * lockIn})`, opacity: lockIn, boxShadow: `0 0 80px rgba(61,255,110,${0.12 * lockIn})` }}>
            <Lock size={72} />
          </div>
          <KineticText text={COPY.privacyH} start={L(T.connect.privacyIn) + 8} size={V ? 76 : 84} maxWidth={V ? 900 : undefined} />
          <KineticText text={COPY.privacySub} start={L(T.connect.privacyIn) + 22} size={V ? 34 : 32} weight={400} color={SITE.muted} tracking={-0.01} maxWidth={V ? 860 : undefined} />
        </AbsoluteFill>
      )}
      {/* the profile loads */}
      {data > 0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 26, opacity: data }}>
          <Img src={AVATAR} style={{ width: 132, height: 132, borderRadius: 999, transform: `scale(${0.8 + 0.2 * data})`, boxShadow: "0 0 0 1px #27272a" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 44, color: SITE.foreground, letterSpacing: "-0.02em" }}>{COPY.name}</div>
            <div style={{ fontFamily: FONT.mono, fontSize: 26, color: SITE.muted, marginTop: 6 }}>{COPY.handle}</div>
          </div>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <AnimatedCounter value={TOTAL} start={L(T.connect.countStart)} end={L(T.connect.countEnd)} style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: V ? 200 : 180, letterSpacing: "-0.05em", color: SITE.foreground, lineHeight: 1 }} />
            <div style={{ fontFamily: FONT.sans, fontSize: V ? 34 : 30, color: SITE.muted, marginTop: 14 }}>{COPY.totalSuffix}</div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
