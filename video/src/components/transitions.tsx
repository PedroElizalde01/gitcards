import { AbsoluteFill } from "remotion";
import type { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

type P = Record<string, never>;

/** Zoom-through: the old shot pushes past the camera and blurs out while the new one settles in. */
const Zoom: React.FC<TransitionPresentationComponentProps<P>> = ({ children, presentationDirection, presentationProgress: p }) => (
  <AbsoluteFill style={presentationDirection === "exiting"
    ? { transform: `scale(${1 + p * 0.5})`, opacity: Math.max(0, 1 - p * 2.2), filter: `blur(${p * 8}px)` }
    : { transform: `scale(${0.94 + 0.06 * p})`, opacity: Math.max(0, (p - 0.4) / 0.6) }}>
    {children}
  </AbsoluteFill>
);
export const zoomThrough = (): TransitionPresentation<P> => ({ component: Zoom, props: {} });

/** Dip: old content fades out fully before the new fades in, so busy layouts never double-expose. */
const Dip: React.FC<TransitionPresentationComponentProps<P>> = ({ children, presentationDirection, presentationProgress: p }) => (
  <AbsoluteFill style={presentationDirection === "exiting"
    ? { opacity: Math.max(0, 1 - p * 2), transform: `translateY(${-p * 30}px)` }
    : { opacity: Math.max(0, p * 2 - 1), transform: `translateY(${(1 - p) * 30}px)` }}>
    {children}
  </AbsoluteFill>
);
export const dip = (): TransitionPresentation<P> => ({ component: Dip, props: {} });
