import { Easing, interpolate, spring } from "remotion";
import { SPRING } from "../theme";

/** The brief's ease-out: cubic-bezier(0.16, 1, 0.3, 1). */
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 over [start, start+dur] frames, eased, clamped. */
export const prog = (frame: number, start: number, dur: number, ease = easeOut) =>
  interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** High-damping spring that starts at `start` (no visible overshoot). */
export const springAt = (frame: number, start: number, fps: number, config = SPRING) =>
  spring({ frame: frame - start, fps, config: { ...config, overshootClamping: true } });

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
