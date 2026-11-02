# gitcard launch trailer: brief

Status: **approved and built** (2026-11-02). Decisions:
- Name **gitcard**.
- Demo QR points to **gitcard.cospel.ar**.
- Music: `public/music.mp3`, "Launch Sequence", measured at 120 BPM with the first beat at 0.1 s.
- The three config-only changes were applied.

Built version differs from the storyboard below in one way: cuts sit 0.2–0.3 s before each beat, so the new scene is fully in when the hit lands (`src/timings.ts`). The track is 60 s long, the video 56.1 s, with the music fading out from 54.6 s.

## 0. Corrections from the prompt (the code wins)

| Prompt says | Code says | Video uses |
|---|---|---|
| Product name "GITCARDS" | `gitcard` everywhere in the app: page title "gitcard — your GitHub, in your Wallet", pass logo text, README. The repo is named `gitcards`. | **gitcard**, lowercase (see Q1) |
| URL `gitcards.app` | Production is `gitcard.cospel.ar` | **gitcard.cospel.ar** |
| Five themes (Classic, Forest, Terminal, Minimal White, Developer XP) | 14 designs, each in dark and light, in `src/lib/designs.ts`. "Forest", "Terminal" and "Minimal White" don't exist. | 5 real designs mapped to the requested moods (§3) |
| Button "Connect with GitHub" | `Continue with GitHub` | **Continue with GitHub** |
| Toggles for display name and avatar on/off | Only a **Dark / Light** toggle exists | Dark/Light toggle |
| Pass back shows "last synced" | Back fields: GitHub profile, About, Change design or remove your data, Powered by | Real back fields |
| "Re-issue anytime" if there's no sync | Daily cron refresh and APNs push exist | **"Always up to date."** |
| Favicon appears small on the pass | The pass logo is the user's avatar, not the gitcard mark | Favicon in the browser tab and brand moments only, never on the pass (it would misrepresent the product) |
| A post-issue screen | None. Safari hands the pass to iOS's own Add sheet | Show the pass landing in a stylized Wallet stack, with no Apple UI or logos |
| Demo user `@octodev` | That GitHub account exists and belongs to a real person | `@alexrivera-dev`, "Alex Rivera" (no GitHub account with that name as of 2026-11-02) |

## 1. Brand tokens (extracted)

**App icon / favicon:** `src/app/icon.svg`
- 32×32 rounded tile, `rx 7.5`, background `#0d1117`.
- 5×5 grid of `4.4` cells with `rx 1.1` on a `5.4` pitch, starting at `3,3`.
- Levels: `#1b222c` `#0e4429` `#006d32` `#26a641` `#39d353`. A diagonal streak climbs to the top right.
- iPhone home-screen icon: `src/app/apple-icon.png` (180 px).
- Grid pattern (row 0 is the top):
  ```
  0 0 1 3 4
  0 1 2 4 3
  1 2 4 3 2
  2 4 3 2 1
  3 4 2 1 0
  ```

**Wordmark:** none exists as a file. "gitcard" is set in Geist SemiBold, lowercase. I'll typeset it, with no invented logo shapes.

**Site colors** (`src/app/globals.css`):

| Token | Light | Dark (the video uses dark) |
|---|---|---|
| background | `#fafaf9` | `#09090b` |
| foreground | `#18181b` | `#fafafa` |
| muted | `#71717a` | `#a1a1aa` |
| line | `#e4e4e7` | `#27272a` |

**Contribution palette** (`GH_DARK`): `#161b22` `#0e4429` `#006d32` `#26a641` `#39d353`. The card background is `#0d1117`, foreground `#e6edf3`, label `#7d8590`.

**Accent:** `#3dff6e` is the flash colour used by the site's ascii-reveal animation (`src/components/card-reveal.tsx`). The video uses it sparingly.

**Type:**
- UI: Geist and Geist Mono via `next/font/google`. In the video they load through `@remotion/google-fonts`.
- Cards: local TTFs in `public/fonts/` (Geist, Geist Mono, Bricolage Grotesque ExtraBold, Archivo Black, Press Start 2P, Instrument Serif, UnifrakturMaguntia), loaded with `@remotion/fonts`.
- Native card text uses the system stack `-apple-system, "SF Pro Text", "Helvetica Neue", Helvetica, Arial`. The render machine is Linux with no SF Pro, so it falls back to Helvetica Neue or Arial (see Q4).

**Shapes:**
- Card: radius `13px`, shadow `0 1px 0 rgb(0 0 0 / .04), 0 12px 32px -12px rgb(0 0 0 / .35)`.
- Buttons: fully rounded pills, `h-12`.
- Design tiles in the editor: `rounded-xl`, 1px border in the `line` colour.

**Official assets:** the Add to Apple Wallet badge is `public/wallet/add-to-apple-wallet.svg`, Apple's US-UK artwork, used unmodified.

**Real copy:**
- Hero: "Your GitHub, in your Wallet."
- Subhead: "Sign in with GitHub, pick a design and add your contribution graph to Apple Wallet. It updates itself every day."
- Privacy: "Read-only: gitcard asks for no permissions and only sees your public profile and contribution counts."
- Editor:
  - Section titles: "Works on every iPhone" and "Poster · iOS 27 and later".
  - Hint: "On iPhone, Safari opens the card: tap Add. It refreshes itself every day."
- Footer: "Powered by Cospel.ar. Not affiliated with GitHub or Apple."

## 2. Fidelity strategy

`src/lib/designs.ts` has no server dependencies, so the video **imports the app's real `cardHtml()`** and renders real cards with fictional data. Theme fidelity is exact by construction.

The card styles (the `.card` rules in `globals.css`) are mirrored into `video/src/card.css`. That file is the only part copied rather than imported.

## 3. Five themes (real designs mapped to the requested moods)

| Requested mood | Real design (`id:mode`) | Layout | Background | Character |
|---|---|---|---|---|
| GitHub Classic | Two-Row Classic `classic:dark` | store | `#0d1117` | Two-band heatmap in GitHub greens; fields Active days / Streak / Best day |
| Forest | Twelve Months `months:light` | store | `#f3f5f2` | Twelve month grids in natural greens (`#e1e6df` → `#16602f`) |
| Terminal / dark statement | Activity Rings `rings:dark` | store | `#000000` | Three rings: active days, weeks, months |
| Minimal White | Swiss `swiss:light` | poster | `#fbfbf9` | Archivo Black handle, black type, red accent `#e2231a` |
| Developer XP | Pocket Console `console:light` | store | `#9bbc0f` | Game Boy-style greens, Press Start 2P, header reads "XP 1,284" |

- The order runs Classic → Twelve Months → Activity Rings → Swiss → Pocket Console.
- Swiss is a poster, which has a taller aspect (358×448 vs 300×392). The morph handles the shape change with a masked wipe.
- "XP" is a visual label only, exactly as in the app.

## 4. Demo data (`video/src/data/demo.ts`)

- **Generator:** seeded PRNG producing a 53×7 grid.
  - Weekdays about 3× weekends.
  - Three streaks (9, 14 and 23 days), two quiet weeks, and a spring and autumn swell.
  - Scaled so the total is exactly **1,284**.
- **User:** Alex Rivera, `@alexrivera-dev`, joined 2019.
- **Avatar:** an abstract generated gradient monogram "AR", not a photo and not a person.
- **Shared:** the same data object feeds every scene and every card.
- **Dates:** US format ("Nov 2, 2026"), window Nov 2025 to Nov 2026.

## 5. Storyboard: 55 s, 60 fps (3,300 frames), 1920×1080

All key hits are placed on a 120 BPM grid (0.5 s per beat) until the real track arrives. They get re-aligned to it at that point.

| # | Time | Scene | What happens | On-screen copy |
|---|---|---|---|---|
| 1 | 0.0–6.0 | **Hook** | Black, with grain and a faint dot grid. The full-width 53×7 heatmap lights up in a diagonal wave, each cell easing in with a small scale settle through the 5 levels. Slow push-in. | "A year of commits." (0.5–3.3) then "Now in your pocket." (3.3–6.0) |
| 2 | 6.0–10.5 | **Logo reveal** | Heatmap cells collapse and converge into the 5×5 favicon grid, which snaps into its tile (6.0–7.5). The wordmark slides out from behind it (7.5). | "gitcard" · "Your GitHub, in your Wallet." (7.8–10.5) |
| 3a | 10.5–12.5 | **Landing** | Zoom-through from the favicon into a browser tab with that icon. The real landing hero is shown with the real rotating sample card. | Real hero copy |
| 3b | 12.5–15.5 | **Privacy beat** | The cursor clicks "Continue with GitHub". The view softens to a calm lock moment. | "Read-only. No permissions asked." with sub "Only your public profile and contribution counts." |
| 3c | 15.5–17.5 | **Data loads** | Avatar, `@alexrivera-dev`, and the total counting up in tabular figures. | "1,284 contributions" / "Last 12 months" |
| 4a | 17.5–28.5 | **Theme morph** (signature) | Editor layout. One pass morphs through the 5 designs, 2.2 s each, with an ascii-dither wipe that echoes the site's own reveal. The data stays identical. The matching editor tile highlights in sync. | Design names, one each: "Two-Row Classic", "Twelve Months", "Activity Rings", "Swiss", "Pocket Console" |
| 4b | 28.5–31.5 | **Card hand** | The five passes fan out side by side with soft depth of field. | "Ship commits. Collect cards." with sub "14 designs, each in dark and light." |
| 5 | 31.5–38.5 | **Preview** | Chosen pass (Two-Row Classic) floats in 3D with a slow light sheen. The real Dark/Light toggle flips it to light and back. The pass flips to its back at 35.0. | Back fields: "GitHub profile", "About", "Change design or remove your data", "Powered by" |
| 6 | 38.5–46.5 | **Add to Apple Wallet** | Tap on the official badge (39.5). The pass slides down into an iPhone frame and lands on a Wallet-style stack with a settle (40–42.5, the drop lands on a beat). | "Always up to date." (42.5–45.5) with sub "Refreshes itself every day." |
| 7 | 46.5–55.0 | **Closing** | Pull back from the phone, dissolve to the favicon and wordmark. Final frame held from 52.0 to 55.0. | "Your GitHub, in your Wallet." · "Get your card" · "gitcard.cospel.ar" · corner: "Not affiliated with GitHub or Apple." |

**Readability check.** Every line stays on screen for at least 1.5 s plus 0.3 s per word:
- The 5-word lines get 2.7 s or more.
- The design names get 2.2 s, enough for 2–3 words.

**Vertical cut (1080×1920).** Same scenes and timings, with these layout changes:
- The heatmap becomes 27 weeks shown at once with a slow horizontal pan.
- The fan becomes a vertical cascade.
- The editor shows only the preview, with no tile grid.
- The phone fills the frame.

## 6. All on-screen copy (`video/src/copy.ts`)

```
hook1        A year of commits.
hook2        Now in your pocket.
wordmark     gitcard
tagline      Your GitHub, in your Wallet.
landingCTA   Continue with GitHub              (real UI)
privacyH     Read-only. No permissions asked.
privacySub   Only your public profile and contribution counts.
user         Alex Rivera · @alexrivera-dev
total        1,284 contributions
totalLabel   Last 12 months
themes       Two-Row Classic · Twelve Months · Activity Rings · Swiss · Pocket Console
fanH         Ship commits. Collect cards.
fanSub       14 designs, each in dark and light.
toggle       Dark · Light                      (real UI)
backFields   GitHub profile · About · Change design or remove your data · Powered by
syncH        Always up to date.
syncSub      Refreshes itself every day.
cta          Get your card
url          gitcard.cospel.ar
disclaimer   Not affiliated with GitHub or Apple.
```

Card-internal text comes from `cardHtml()` with the demo data, for example "Contributions 1,284", "Active days", "Streak", "Best day", "XP".

## 7. Build plan

- **Location:** `video/` as its own package (Remotion 4.0.540, TypeScript, React 19), using its own `pnpm install --ignore-workspace`.
- **Compositions:** `Trailer` (1920×1080, 60 fps, 3,300 frames) and `TrailerVertical` (1080×1920).
- **Folders:**
  - `src/scenes/`: one file per scene, joined with `<TransitionSeries>`.
  - `src/components/`: `WalletPass` (wraps `cardHtml`), `ContributionHeatmap`, `ThemeSwitcher`, `IPhoneFrame`, `ConnectButton`, `Cursor`, `KineticText`, `AnimatedCounter`, `Favicon`.
  - Config files: `theme.ts`, `copy.ts`, `timings.ts`, `data/demo.ts`.
- **Motion:**
  - Springs use damping ≥ 20 with no overshoot.
  - Eases use `bezier(0.16, 1, 0.3, 1)`.
  - Staggered entrances are offset by 3–5 frames (50–80 ms).
  - `@remotion/motion-blur` on the drop and the fan.
- **Audio:**
  - `video/public/music.mp3` is **missing**. An `<Audio>` placeholder stays muted until it's added.
  - Sound effects go on their own track with a single mute flag: soft clicks, a low whoosh, and the drop.
- **Required changes outside `video/`** (config only, no app code):
  - Add `"video"` to the root `tsconfig.json` `exclude` and to the eslint ignores, so the Next build doesn't type-check Remotion.
  - Add `video` to a new `.vercelignore` so deploys don't upload it.

## 8. Risks and assumptions

- [R18] **Remotion license.** Remotion is free for individuals and companies with up to 3 people, otherwise it needs a company license. Confirm this applies to you or Cospel.
- [R19] **QR codes.** Store designs draw a real QR of `https://github.com/<login>`. For `@alexrivera-dev` that would point at an account anyone could register later (see Q2).
- [R20] **SF Pro.** The render machine has no SF Pro, so native card text falls back to Helvetica Neue or Arial and will look slightly different from an iPhone.
- [R21] **Wallet stack.** It is stylized: generic rounded cards, no Apple UI chrome, no Apple logo.

## 9. Questions before I build

- **[Q1]** Name on screen: **gitcard** (what the app says) or **gitcards** (the repo name)? This changes the wordmark and copy only.
- **[Q2]** QR on the demo cards:
  - (a) Encode `https://gitcard.cospel.ar`, so scanning it in the video takes people to the site. Recommended.
  - (b) Hide the QR area.
  - (c) Keep the profile-URL behaviour with the demo handle.
- **[Q3]** Music: will you drop a track at `video/public/music.mp3`, and what is its BPM? Otherwise I'll keep the 120 BPM grid with a muted placeholder.
- **[Q4]** Are you OK with the three small config changes outside `video/` listed in §7?
