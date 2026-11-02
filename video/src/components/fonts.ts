import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** The app's own font files (public/fonts, linked in). loadFont blocks the render until each is ready. */
const FONTS: [family: string, file: string, weight?: string, style?: string][] = [
  ["Geist", "Geist-Regular.ttf", "400"],
  ["Geist", "Geist-SemiBold.ttf", "600"],
  ["Geist Mono", "GeistMono-Regular.ttf", "400"],
  ["Bricolage Grotesque", "BricolageGrotesque-ExtraBold.ttf", "800"],
  ["Archivo Black", "ArchivoBlack.ttf", "400"],
  ["Press Start 2P", "PressStart2P.ttf", "400"],
  ["Instrument Serif", "InstrumentSerif-Regular.ttf", "400"],
  ["Instrument Serif", "InstrumentSerif-Italic.ttf", "400", "italic"],
  ["UnifrakturMaguntia", "UnifrakturMaguntia.ttf", "400"],
];

export const fontsReady = Promise.all(
  FONTS.map(([family, file, weight = "400", style = "normal"]) => loadFont({ family, url: staticFile(`fonts/${file}`), weight, style })),
);
