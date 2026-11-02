import qrcode from "qrcode-generator";
import { useMemo } from "react";
import { cardHtml, pickTheme } from "../../../src/lib/designs";
import { DEMO, QR_URL } from "../data/demo";
import "../card.css";

/** Real QR of the site URL, drawn the way the app draws its preview QR. */
const QR_SVG = (() => {
  const q = qrcode(0, "M");
  q.addData(QR_URL);
  q.make();
  const n = q.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.isDark(y, x)) d += `M${x},${y}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><path d="${d}" fill="#000"/></svg>`;
})();

/** The app's own card markup (cardHtml) for the demo user; only the QR target is swapped to the site. */
export function passHtml(theme: string, pre: string) {
  const { design, mode } = pickTheme(theme);
  return cardHtml(design, mode, DEMO, pre).replace(/<div class="qr"><svg[\s\S]*?<\/svg><\/div>/, `<div class="qr">${QR_SVG}</div>`);
}

export const passAspect = (theme: string) => (pickTheme(theme).design.layout === "poster" ? 448 / 358 : 392 / 300);

/**
 * A Wallet pass. `sheen` (0..1) sweeps a soft light across the surface; `lift` deepens the shadow.
 */
export const WalletPass: React.FC<{ theme: string; width: number; pre: string; sheen?: number; lift?: number; style?: React.CSSProperties }> = ({
  theme, width, pre, sheen, lift = 1, style,
}) => {
  const html = useMemo(() => passHtml(theme, pre), [theme, pre]);
  const radius = width * 0.036;
  return (
    <div
      style={{
        width, borderRadius: radius, overflow: "hidden", position: "relative",
        boxShadow: `0 ${2 * lift}px ${4 * lift}px rgba(0,0,0,.25), 0 ${30 * lift}px ${70 * lift}px -${18 * lift}px rgba(0,0,0,.65)`,
        ...style,
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: html }} />
      {sheen !== undefined && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: "screen",
          background: "linear-gradient(105deg, transparent 38%, rgba(255,255,255,.16) 47%, rgba(255,255,255,.28) 50%, rgba(255,255,255,.16) 53%, transparent 62%)",
          backgroundSize: "300% 100%", backgroundPosition: `${100 - sheen * 100}% 0`,
        }} />
      )}
    </div>
  );
};
