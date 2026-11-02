/**
 * All timing in one place. The track ("Launch Sequence", public/music.mp3) is 120 BPM with the first
 * beat at 0.1 s; accents land every 4 s from the drop at 20.1 s. Cuts and key hits sit on that grid.
 */
export const FPS = 60;
export const BPM = 120;
export const FIRST_BEAT = 0.1; // seconds
export const f = (sec: number) => Math.round(sec * FPS);
/** Frame of beat n (0-based). */
export const beat = (n: number) => f(FIRST_BEAT + (n * 60) / BPM);

/** Scene start times (s). Each scene begins exactly at its cut. */
export const CUT = {
  hook: 0,
  logo: 8.1, // match cut, no transition
  // cuts sit a few frames before the beat so the new scene is fully in when the hit lands
  connect: 11.9,
  editor: 19.8, // settles on the drop at 20.1
  fan: 31.8,
  preview: 35.8,
  wallet: 43.8,
  closing: 49.8,
  end: 56.1,
} as const;

/** Transition length (frames) after each scene; 0 = hard/match cut. */
export const TRANSITION = { hook: 0, logo: 24, connect: 24, editor: 24, fan: 30, preview: 24, wallet: 30 } as const;

export const DURATION = f(CUT.end);

/** Absolute seconds of every beat inside scenes, expressed in each scene's local frames via `local`. */
export const local = (scene: keyof typeof CUT, sec: number) => f(sec - CUT[scene]);

export const T = {
  hook: { waveEnd: 4.1, line1In: 0.6, line1Out: 3.8, line2In: 4.1, line2Out: 7.7 },
  logo: { converge: 8.1, convergeEnd: 9.1, tile: 8.9, wordmark: 9.4, tagline: 9.6 },
  connect: { cursorStart: 12.7, click: 13.6, privacyIn: 14.1, privacyOut: 17.4, dataIn: 17.6, countStart: 17.8, countEnd: 19.6 },
  editor: { switches: [20.1, 22.6, 25.1, 27.6, 30.1], morph: 0.5 },
  fan: { headline: 32.6, sub: 33.1 },
  preview: { toLight: 37.6, toDark: 38.6, flip: 40.1, flipDur: 0.8 },
  wallet: { tap: 44.6, flyStart: 44.8, land: 46.1, headline: 46.6, sub: 47.0 },
  closing: { pullBack: 49.8, logo: 51.6, tagline: 52.0, cta: 52.4, hold: 53.1 },
  audio: { fadeOutStart: 54.6 },
};

/** Sound effects: one flag mutes the whole layer. */
export const SFX = {
  enabled: true,
  volume: 0.35,
  cues: [
    { sec: 13.6, src: "sfx/click.wav" },
    { sec: 19.75, src: "sfx/whoosh.wav" },
    { sec: 31.75, src: "sfx/whoosh.wav" },
    { sec: 39.9, src: "sfx/whoosh.wav" },
    { sec: 44.6, src: "sfx/click.wav" },
    { sec: 46.1, src: "sfx/drop.wav" },
  ],
};
