import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COPY } from "../copy";
import { ContributionHeatmap } from "../components/ContributionHeatmap";
import { KineticText } from "../components/KineticText";
import { hookGrid, useLayout } from "../components/layout";
import { f, local, T } from "../timings";

/** 0–8.1 s: the year lights up in a diagonal wave. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H, V } = useLayout();
  const g = hookGrid(W, H);
  const push = 1 + 0.035 * (frame / f(8.1)); // slow push-in; the logo scene starts from the same scale
  const size = V ? 92 : 104;
  const textY = V ? H * 0.58 : H * 0.66;
  return (
    <AbsoluteFill style={{ transform: `scale(${push})` }}>
      <div style={{ position: "absolute", left: g.x, top: g.y }}>
        <ContributionHeatmap cell={g.cell} gap={g.gap} cols={g.cols} fromCol={g.fromCol} start={f(0.15)} end={local("hook", T.hook.waveEnd)} />
      </div>
      <div style={{ position: "absolute", top: textY, width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "absolute" }}>
          <KineticText text={COPY.hook1} start={local("hook", T.hook.line1In)} end={local("hook", T.hook.line1Out)} size={size} />
        </div>
        <div style={{ position: "absolute" }}>
          <KineticText text={COPY.hook2} start={local("hook", T.hook.line2In)} end={local("hook", T.hook.line2Out)} size={size} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
export const HOOK_END_SCALE = 1.035;
