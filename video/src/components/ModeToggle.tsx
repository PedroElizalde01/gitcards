import { COPY } from "../copy";
import { FONT, SITE } from "../theme";

/** The editor's Dark/Light radio pill (src/components/editor.tsx). `light` 0..1 slides the selection. */
export const ModeToggle: React.FC<{ light: number; scale?: number }> = ({ light, scale = 1 }) => {
  const w = 86 * scale, h = 38 * scale, pad = 4 * scale;
  return (
    <div style={{ position: "relative", display: "flex", padding: pad, borderRadius: 999, border: `1px solid ${SITE.line}`, fontFamily: FONT.sans, fontSize: 15 * scale }}>
      <div style={{ position: "absolute", top: pad, left: pad + light * w, width: w, height: h, borderRadius: 999, background: SITE.foreground }} />
      {COPY.toggle.map((m, i) => {
        const on = i === 0 ? 1 - light : light;
        return (
          <div key={m} style={{ position: "relative", width: w, height: h, display: "flex", alignItems: "center", justifyContent: "center", color: on > 0.5 ? SITE.background : SITE.muted }}>{m}</div>
        );
      })}
    </div>
  );
};
