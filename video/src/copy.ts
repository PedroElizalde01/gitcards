/** Every line of on-screen copy (English, US). Real app strings are marked. */
export const COPY = {
  hook1: "A year of commits.",
  hook2: "Now in your pocket.",
  wordmark: "gitcard",
  tagline: "Your GitHub, in your Wallet.", // real: landing headline
  landingSub: "Sign in with GitHub, pick a design and add your contribution graph to Apple Wallet. It updates itself every day.", // real
  landingCTA: "Continue with GitHub", // real
  landingFine: "Read-only: gitcard asks for no permissions and only sees your public profile and contribution counts.", // real
  sampleCard: "Sample card", // real
  tabTitle: "gitcard — your GitHub, in your Wallet", // real: page title
  url: "gitcard.cospel.ar",
  privacyH: "Read-only. No permissions asked.",
  privacySub: "Only your public profile and contribution counts.",
  handle: "@alexrivera-dev",
  name: "Alex Rivera",
  totalSuffix: "contributions in the last 12 months", // real: signed-in header
  fanH: "Ship commits. Collect cards.",
  fanSub: "14 designs, each in dark and light.",
  toggle: ["Dark", "Light"] as const, // real
  editorGroup: "Works on every iPhone", // real
  syncH: "Always up to date.",
  syncSub: "Refreshes itself every day.",
  cta: "Get your card",
  disclaimer: "Not affiliated with GitHub or Apple.", // real: footer
  back: [
    ["GitHub profile", "https://github.com/alexrivera-dev"],
    ["About", "Your public GitHub contribution calendar for the last 12 months, refreshed daily. The number changes as the window moves. Not affiliated with or endorsed by GitHub."],
    ["Change design or remove your data", "https://gitcard.cospel.ar"],
    ["Powered by", "https://cospel.ar"],
  ] as const, // real: pass backFields (src/server/wallet.ts)
};
