# gitcard

Your GitHub contribution graph as an Apple Wallet pass. Sign in with GitHub, pick a design, tap **Add to Apple Wallet**. The card refreshes itself every day.

Live at **[gitcard.cospel.ar](https://gitcard.cospel.ar)** · Powered by [Cospel](https://cospel.ar)

## How it works

1. **Sign in** with GitHub OAuth (PKCE, no scopes). gitcard only reads your public profile and contribution calendar.
2. **Pick a design**: 14 designs, each in dark and light. The web preview and the Wallet image come from the same SVG, so what you see is what you get.
3. **Add to Wallet**: `/api/pass` signs a `.pkpass` on the fly and Safari opens it in the Add sheet.
4. **Daily refresh**: a Vercel cron refetches every calendar, and when something changed it sends an APNs push. Wallet then pulls the new pass through Apple's [pass web service](https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes).

## Designs and iOS versions

| Layout | Wallet style | Works on |
|---|---|---|
| Store | `storeCard` with a 375×144 strip | every iPhone |
| Generic | `generic` with a thumbnail | every iPhone |
| Poster | `posterGeneric` with 358×448 artwork | iOS 27 and later |

The iOS version is read from Safari's `Version/N` user-agent token (`iPhone OS` is frozen at 18_6 since iOS 26). Below iOS 27, posters are hidden and `/api/pass` refuses them. Poster passes also carry a `generic` fallback, so a poster synced to an older iPhone still shows a usable card.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Neon Postgres · Vercel (Fluid Compute + Cron)

- Pass images: SVG rendered to PNG by [`@resvg/resvg-js`](https://github.com/yisibl/resvg-js) using the bundled fonts in `public/fonts` (OFL).
- Signing: PKCS#7 detached signature with `node-forge`, stored zip, no pass library.
- Animations: [`ascii-reveal`](https://github.com/quanhoangindex/ascii-reveal).

```
src/
  app/
    page.tsx                         landing + editor
    api/auth/github/{start,callback} OAuth
    api/pass                         download the signed pass
    api/wallet/v1/[...path]          Apple's pass web service
    api/cron/sync                    daily refresh + push
  components/editor.tsx              design picker
  lib/designs.ts                     every design (isomorphic, shared by web and pass)
  lib/ios.ts                         iOS version detection
  server/wallet.ts                   pass building, sync, APNs push
  server/pkpass.ts                   manifest, signature, zip
  server/session.ts                  signed cookie, AES-GCM token storage
schema.sql                           database schema
```

## Running locally

Requires Node 22+, pnpm, a Neon database, a GitHub OAuth App, and an Apple Pass Type ID certificate.

```bash
pnpm install
cp .env.example .env.local   # fill it in, see the comments in the file
pnpm db:schema               # needs psql; or paste schema.sql into the Neon SQL editor
pnpm dev
```

- **GitHub OAuth App** callback: `http://localhost:3000/api/auth/github/callback` (and the production URL).
- **Apple signing**: put the pass certificate, key and Apple WWDR certificate in `secrets/` (git-ignored) and point `PASS_SIGNER_*` / `APPLE_WWDR_CERT` at them. On Vercel, store each PEM as one base64 line in a sensitive env var. Without them the editor runs in preview-only mode.
- Passes built over `http://` have no `webServiceURL`, so they install but never update.

```bash
pnpm typecheck && pnpm lint && pnpm test
```

## Privacy

- Stored per user: GitHub id, login, name, avatar, account creation date, contribution counts, chosen design, and the GitHub token encrypted with AES-256-GCM.
- Device registrations store Wallet's device id and push token only.
- **Delete my data** revokes the GitHub grant and removes the user and their registrations. Installed passes stop updating.

## License

Code: [MIT](LICENSE). Excluded: the fonts (SIL OFL) and the Add to Apple Wallet badge (Apple's artwork license).

## Credits

Not affiliated with GitHub or Apple. Apple Wallet and the Add to Apple Wallet badge are trademarks of Apple Inc., used per Apple's guidelines. Fonts are under the SIL Open Font License (`public/fonts/LICENSE.txt`).
