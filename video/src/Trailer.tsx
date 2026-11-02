import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile } from "remotion";
import { Background } from "./components/Background";
import { easeInOut } from "./components/motion";
import { dip, zoomThrough } from "./components/transitions";
import { AddToWallet } from "./scenes/AddToWallet";
import { Closing } from "./scenes/Closing";
import { Connect } from "./scenes/Connect";
import { Editor } from "./scenes/Editor";
import { Fan } from "./scenes/Fan";
import { Hook } from "./scenes/Hook";
import { Logo } from "./scenes/Logo";
import { Preview } from "./scenes/Preview";
import { CUT, DURATION, f, SFX, T, TRANSITION } from "./timings";

const ORDER = ["hook", "logo", "connect", "editor", "fan", "preview", "wallet", "closing"] as const;
const SCENES = { hook: Hook, logo: Logo, connect: Connect, editor: Editor, fan: Fan, preview: Preview, wallet: AddToWallet, closing: Closing };
const PRESENT = { hook: null, logo: zoomThrough, connect: dip, editor: zoomThrough, fan: zoomThrough, preview: dip, wallet: dip } as const;

export type TrailerProps = { sfx: boolean };

export const Trailer: React.FC<TrailerProps> = ({ sfx }) => (
  <AbsoluteFill>
    <Background />
    <TransitionSeries>
      {ORDER.flatMap((key, i) => {
        const next = ORDER[i + 1];
        const t = next ? TRANSITION[key as keyof typeof TRANSITION] : 0;
        // each scene starts exactly at its cut; it also covers the transition that follows it
        const dur = f((next ? CUT[next] : CUT.end) - CUT[key]) + t;
        const Scene = SCENES[key];
        const items = [
          <TransitionSeries.Sequence key={key} durationInFrames={dur}>
            <Scene />
          </TransitionSeries.Sequence>,
        ];
        const present = PRESENT[key as keyof typeof PRESENT];
        if (next && t > 0 && present) items.push(<TransitionSeries.Transition key={`${key}-t`} presentation={present()} timing={linearTiming({ durationInFrames: t, easing: easeInOut })} />);
        return items;
      })}
    </TransitionSeries>
    <Audio src={staticFile("music.mp3")} volume={(fr) => interpolate(fr, [0, 6, f(T.audio.fadeOutStart), DURATION], [0, 1, 1, 0], { extrapolateRight: "clamp" })} />
    {sfx && SFX.enabled && SFX.cues.map((c, i) => (
      <Sequence key={i} from={f(c.sec)} durationInFrames={f(1)}>
        <Audio src={staticFile(c.src)} volume={SFX.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
