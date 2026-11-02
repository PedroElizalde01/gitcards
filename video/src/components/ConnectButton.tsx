import { FONT, SITE } from "../theme";
import { COPY } from "../copy";

/** The landing's "Continue with GitHub" pill, as styled in src/app/page.tsx (dark scheme: foreground pill, background text). */
export const ConnectButton: React.FC<{ scale?: number; pressed?: number }> = ({ scale = 1, pressed = 0 }) => (
  <div style={{
    height: 48 * scale, padding: `0 ${24 * scale}px`, display: "inline-flex", alignItems: "center", borderRadius: 999,
    background: SITE.foreground, color: SITE.background, fontFamily: FONT.sans, fontWeight: 600, fontSize: 16 * scale,
    transform: `scale(${1 - 0.05 * pressed})`, opacity: 1 - 0.12 * pressed,
  }}>
    {COPY.landingCTA}
  </div>
);
