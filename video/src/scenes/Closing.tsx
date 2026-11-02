import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { Favicon } from "../components/Favicon";
import { IPhoneFrame } from "../components/IPhoneFrame";
import { KineticText } from "../components/KineticText";
import { useLayout } from "../components/layout";
import { easeInOut, mix, prog } from "../components/motion";
import { WalletPass } from "../components/WalletPass";
import { FONT, SITE } from "../theme";
import { local, T } from "../timings";
import { WalletStack, phoneGeometry } from "./AddToWallet";

const L = (s: number) => local("closing", s);

/** 50.1–56.1 s: pull back from the phone, then the mark, the line and where to get it. Final hold ≥ 3 s. */
export const Closing: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, V } = useLayout();
  const g = phoneGeometry(W, H, V);
  const back = prog(frame, 0, L(T.closing.logo) + 10, easeInOut);
  const logo = prog(frame, L(T.closing.logo), 40);
  const cta = prog(frame, L(T.closing.cta), 36);
  const S = V ? 200 : 150;
  const phoneScale = mix(1, 0.72, back);
  const pcx = mix(g.px + g.pw / 2, W / 2, back), pcy = mix(g.py + g.ph / 2, H / 2, back);
  return (
    <AbsoluteFill>
      {back < 1 && (
        <div style={{ position: "absolute", left: pcx - g.pw / 2, top: pcy - g.ph / 2, transform: `scale(${phoneScale})`, opacity: 1 - back, filter: `blur(${back * 10}px)` }}>
          <IPhoneFrame width={g.pw}>
            <WalletStack pw={g.pw} sw={g.sw} bump={0} />
            <div style={{ position: "absolute", left: g.slot.x - g.px - g.pw * 0.035, top: g.slot.y - g.py - g.pw * 0.035 }}>
              <WalletPass theme="classic:dark" width={g.slot.w} pre="cl" lift={0.5} />
            </div>
          </IPhoneFrame>
        </div>
      )}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: V ? 44 : 34 }}>
        <div style={{ display: "flex", flexDirection: V ? "column" : "row", alignItems: "center", gap: V ? 30 : 34, opacity: logo, transform: `scale(${0.94 + 0.06 * logo})` }}>
          <Favicon size={S} cells={logo} />
          <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: V ? 140 : 120, letterSpacing: "-0.045em", color: SITE.foreground }}>{COPY.wordmark}</div>
        </div>
        <KineticText text={COPY.tagline} start={L(T.closing.tagline)} size={V ? 52 : 46} weight={400} color={SITE.muted} tracking={-0.01} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: cta, transform: `translateY(${(1 - cta) * 20}px)`, marginTop: 14 }}>
          <div style={{ height: V ? 84 : 66, padding: `0 ${V ? 44 : 34}px`, borderRadius: 999, background: SITE.foreground, color: SITE.background, display: "flex", alignItems: "center", fontFamily: FONT.sans, fontWeight: 600, fontSize: V ? 34 : 26 }}>{COPY.cta}</div>
          <div style={{ fontFamily: FONT.mono, fontSize: V ? 34 : 28, color: SITE.foreground, letterSpacing: "-0.01em" }}>{COPY.url}</div>
        </div>
      </AbsoluteFill>
      <div style={{ position: "absolute", right: V ? 0 : 56, left: V ? 0 : undefined, bottom: V ? 80 : 44, textAlign: V ? "center" : "right", fontFamily: FONT.sans, fontSize: V ? 24 : 18, color: SITE.muted, opacity: cta }}>{COPY.disclaimer}</div>
    </AbsoluteFill>
  );
};
