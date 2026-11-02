import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COPY } from "../copy";
import { Cursor } from "../components/Cursor";
import { IPhoneFrame } from "../components/IPhoneFrame";
import { KineticText } from "../components/KineticText";
import { useLayout } from "../components/layout";
import { easeInOut, mix, prog, springAt } from "../components/motion";
import { WalletPass } from "../components/WalletPass";
import { SITE } from "../theme";
import { local, T } from "../timings";

const L = (s: number) => local("wallet", s);

/** Generic stacked passes already in the phone: plain neutral cards, no names or brands. */
const STACK = ["#3a3a3c", "#2c2c2e", "#48484a"];

export function phoneGeometry(W: number, H: number, V: boolean) {
  const pw = V ? 460 : 400;
  const ph = pw * (844 / 390);
  const px = V ? (W - pw) / 2 : 1240;
  const py = V ? H - ph - 70 : (H - ph) / 2;
  const bezel = pw * 0.035;
  const sw = pw - 2 * bezel;
  const slot = { x: px + bezel + sw * 0.05, y: py + bezel + pw * 0.62, w: sw * 0.9 };
  return { pw, ph, px, py, slot, sw };
}

/** Phone screen content: the stack, nudged by `bump` when a pass lands. */
export const WalletStack: React.FC<{ pw: number; sw: number; bump: number }> = ({ pw, sw, bump }) => (
  <>
    {STACK.map((c, i) => (
      <div key={i} style={{ position: "absolute", left: sw * 0.05, top: pw * (0.2 + i * 0.14) - bump * (6 - i * 2), width: sw * 0.9, height: sw * 0.9 * 0.63, borderRadius: sw * 0.04, background: `linear-gradient(160deg, ${c}, #1c1c1e)`, boxShadow: "0 -1px 0 rgba(255,255,255,.08) inset, 0 -8px 20px rgba(0,0,0,.4)" }} />
    ))}
  </>
);

/** 44.1–50.1 s: tap the official badge, the pass drops into the phone's stack and settles. */
export const AddToWallet: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, V } = useLayout();
  const g = phoneGeometry(W, H, V);
  const startW = V ? 440 : 380;
  const start = V ? { x: (W - startW) / 2, y: 140 } : { x: 520 - startW / 2, y: 150 };
  const badgeH = V ? 84 : 64;
  const badge = V ? { x: W / 2, y: start.y + startW * (392 / 300) + 40 } : { x: 520, y: start.y + startW * (392 / 300) + 60 };
  const fly = springAt(frame, L(T.wallet.flyStart), fps, { damping: 22, stiffness: 90, mass: 1 });
  const landed = frame >= L(T.wallet.land);
  const bump = landed ? Math.sin(Math.min(1, (frame - L(T.wallet.land)) / 14) * Math.PI) : 0;
  const x = mix(start.x, g.slot.x, fly), y = mix(start.y, g.slot.y, fly), w = mix(startW, g.slot.w, fly);
  const tap = prog(frame, L(T.wallet.tap), 20);
  const move = prog(frame, 4, L(T.wallet.tap) - 6, easeInOut);
  const badgeOut = prog(frame, L(T.wallet.flyStart), 20);
  const phoneIn = prog(frame, 0, 40);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: g.px, top: g.py + (1 - phoneIn) * 60, opacity: phoneIn }}>
        <IPhoneFrame width={g.pw}>
          <WalletStack pw={g.pw} sw={g.sw} bump={bump} />
        </IPhoneFrame>
      </div>
      <div style={{ position: "absolute", left: x, top: y + (landed ? bump * 4 : 0), zIndex: 5 }}>
        <WalletPass theme="classic:dark" width={w} pre="aw" lift={1 - 0.5 * fly} />
      </div>
      <div style={{ position: "absolute", left: badge.x, top: badge.y, transform: `translate(-50%, 0) scale(${1 - 0.06 * Math.sin(Math.PI * tap)})`, opacity: 1 - badgeOut }}>
        <Img src={staticFile("wallet/add-to-apple-wallet.svg")} style={{ height: badgeH, display: "block" }} />
      </div>
      {tap < 1 && <Cursor x={mix(W * 0.4, badge.x + 30, move)} y={mix(H * 0.95, badge.y + badgeH * 0.55, move)} size={V ? 40 : 32} click={tap} opacity={1 - badgeOut} />}
      <div style={{ position: "absolute", left: V ? 0 : 140, top: V ? 200 : H * 0.4, width: V ? W : 1000, display: "flex", flexDirection: "column", alignItems: V ? "center" : "flex-start", gap: 18 }}>
        <KineticText text={COPY.syncH} start={L(T.wallet.headline)} size={V ? 96 : 92} align={V ? "center" : "left"} />
        <KineticText text={COPY.syncSub} start={L(T.wallet.sub)} size={V ? 40 : 36} weight={400} color={SITE.muted} align={V ? "center" : "left"} tracking={-0.01} />
      </div>
    </AbsoluteFill>
  );
};
