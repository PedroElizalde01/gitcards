import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { KineticText } from "../components/KineticText";
import { useLayout } from "../components/layout";
import { ModeToggle } from "../components/ModeToggle";
import { prog } from "../components/motion";
import { ThemeSwitcher, themeIndexAt } from "../components/ThemeSwitcher";
import { WalletPass } from "../components/WalletPass";
import { pickTheme } from "../../../src/lib/designs";
import { FONT, SITE, THEMES } from "../theme";
import { f, local, T } from "../timings";

const L = (s: number) => local("editor", s);

/** Editor tiles, in the app's own groups. The five morph designs are among them. */
const STORE = ["classic:dark", "months:light", "rings:dark", "console:light", "bars:dark", "weekday:dark"];
const POSTER = ["swiss:light", "bento:dark", "ridges:dark"];

const Tile: React.FC<{ theme: string; on: boolean; w: number }> = ({ theme, on, w }) => (
  <div style={{ padding: 8, borderRadius: 14, border: `1.5px solid ${on ? SITE.foreground : SITE.line}`, transition: "none" }}>
    <WalletPass theme={theme} width={w} pre={`t-${theme.replace(":", "-")}`} lift={0.2} />
    <div style={{ marginTop: 8, textAlign: "center", fontFamily: FONT.sans, fontWeight: 600, fontSize: 13, color: SITE.foreground }}>{pickTheme(theme).design.name}</div>
  </div>
);

/** 20.1–32.1 s: the signature moment. One pass morphs through five real designs; the data never changes. */
export const Editor: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, V } = useLayout();
  const switches = T.editor.switches.map(L);
  const idx = themeIndexAt(frame, switches);
  const current = THEMES[idx].key;
  const enter = prog(frame, 0, 40);
  const push = 1 + 0.03 * (frame / f(12));
  const pw = V ? 700 : 470;
  const name = (
    <div style={{ position: "relative", height: V ? 90 : 70, width: V ? W : 600 }}>
      {switches.map((s, i) => (
        <div key={i} style={{ position: "absolute", inset: 0, display: "flex", justifyContent: V ? "center" : "flex-start" }}>
          <KineticText text={THEMES[i].name} start={s + 4} end={i < switches.length - 1 ? switches[i + 1] - 10 : undefined} size={V ? 64 : 52} align={V ? "center" : "left"} />
        </div>
      ))}
    </div>
  );
  if (V) {
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 40, opacity: enter, transform: `scale(${push})` }}>
        {name}
        <ThemeSwitcher width={pw} switches={switches} morph={f(T.editor.morph)} />
        <ModeToggle light={0} scale={1.4} />
      </AbsoluteFill>
    );
  }
  const tw = 128;
  return (
    <AbsoluteFill style={{ opacity: enter, transform: `scale(${push})` }}>
      <div style={{ position: "absolute", left: 150, top: 120 }}>{name}</div>
      <div style={{ position: "absolute", left: 150, top: 215, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <ThemeSwitcher width={pw} switches={switches} morph={f(T.editor.morph)} />
        <ModeToggle light={0} />
        <Img src={staticFile("wallet/add-to-apple-wallet.svg")} style={{ height: 48 }} />
      </div>
      <div style={{ position: "absolute", left: 790, top: 120, display: "flex", flexDirection: "column", gap: 18 }}>
        {[[COPY.editorGroup, STORE], ["Poster · iOS 27 and later", POSTER]].map(([title, list]) => (
          <div key={title as string}>
            <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 15, color: SITE.foreground, marginBottom: 12 }}>{title as string}</div>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(6, ${tw + 19}px)`, gap: 14 }}>
              {(list as string[]).map((t) => <Tile key={t} theme={t} w={tw} on={t === current} />)}
            </div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
