import { Composition } from "remotion";
import "./components/fonts";
import { DURATION, FPS } from "./timings";
import { Trailer } from "./Trailer";

export const Root: React.FC = () => (
  <>
    <Composition id="Trailer" component={Trailer} width={1920} height={1080} fps={FPS} durationInFrames={DURATION} defaultProps={{ sfx: true }} />
    <Composition id="TrailerVertical" component={Trailer} width={1080} height={1920} fps={FPS} durationInFrames={DURATION} defaultProps={{ sfx: true }} />
  </>
);
