import "server-only";
import { randomBytes } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import { connect } from "node:http2";
import sharp from "sharp";
import { LUM, artSvg, chipSvg, ctx, genericFields, logoSvg, pickTheme, type Field, type Profile } from "@/lib/designs";
import { getUser, sql, type User } from "./db";
import { fetchProfile, TokenRevoked, type GitHubProfile } from "./github";
import { buildPkpass, type PassSigner } from "./pkpass";
import { equal, seal, unseal } from "./session";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://gitcard.cospel.ar";

/** Each value is a path to a PEM file (local) or the PEM as one base64 line (Vercel: `base64 -w0 pass.pem`). */
const pem = (v: string) => (v.startsWith(".") || v.startsWith("/") ? readFileSync(v, "utf8") : Buffer.from(v, "base64").toString("utf8"));

/** Cospel's Apple pass identity (shared with cospel.ar), or null when not configured: the site then shows "Preview only". */
export function appleSigner(): PassSigner | null {
  const { PASS_TYPE_IDENTIFIER, APPLE_TEAM_IDENTIFIER, PASS_SIGNER_CERT, PASS_SIGNER_KEY, PASS_SIGNER_KEY_PASSPHRASE, APPLE_WWDR_CERT } = process.env;
  if (!PASS_TYPE_IDENTIFIER || !APPLE_TEAM_IDENTIFIER || !PASS_SIGNER_CERT || !PASS_SIGNER_KEY || !APPLE_WWDR_CERT) return null;
  return {
    passTypeIdentifier: PASS_TYPE_IDENTIFIER,
    teamIdentifier: APPLE_TEAM_IDENTIFIER,
    cert: pem(PASS_SIGNER_CERT),
    key: pem(PASS_SIGNER_KEY),
    keyPassphrase: PASS_SIGNER_KEY_PASSPHRASE || undefined,
    wwdr: pem(APPLE_WWDR_CERT),
  };
}

/** Prefixed so it can never collide with Cospel's own serials under the same Pass Type ID. */
export const serialOf = (id: string) => `gh-${id}`;
export const idOfSerial = (serial: string) => /^gh-(\d+)$/.exec(serial)?.[1] ?? null;

const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(",")})`;
const FONTS = join(process.cwd(), "public/fonts");
const fontFiles = readdirSync(FONTS).filter((f) => f.endsWith(".ttf")).map((f) => join(FONTS, f));
/** 8×8 grey JPEG until the first sync stores the real avatar. */
const NO_AVATAR = "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAgDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAwT/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAoC//9k=";

/** SVG (in points) to PNG at a Wallet scale, with the bundled fonts only. */
function png(svg: string, scale: number): Buffer {
  return new Resvg(svg, { fitTo: { mode: "zoom", value: scale }, font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Geist" } }).render().asPng();
}

/** What the designs draw from, for this user. Shared by the web preview and the pass. */
export async function profileOf(u: User): Promise<Profile> {
  const jpeg = Buffer.from(u.avatar ?? NO_AVATAR, "base64");
  const raw = await sharp(jpeg).resize(LUM, LUM).greyscale().raw().toBuffer();
  const lo = Math.min(...raw), hi = Math.max(...raw);
  return {
    login: u.login,
    name: u.name,
    total: u.total,
    calendar: { start: u.cal_start ?? new Date().toISOString().slice(0, 10), counts: u.counts ?? [] },
    joined: u.joined,
    updated: u.pass_updated.toISOString(),
    avatar: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
    lum: [...raw].map((v) => Math.round(((v - lo) / (hi - lo || 1)) * 100) / 100),
  };
}

const field = ([label, value]: Field, key: string, extra: object = {}) => ({ key, label, value, ...extra });

/** The signed .pkpass for a user, always rebuilt from the stored calendar and chosen design. */
export async function buildPass(u: User, signer: PassSigner): Promise<Buffer> {
  const { design: d, mode } = pickTheme(u.theme);
  const profile = await profileOf(u);
  const s = ctx(profile, "pass");
  const p = d.pal[mode];
  const url = `https://github.com/${u.login}`;
  const back = [
    { key: "profile", label: "GitHub profile", value: url },
    { key: "about", label: "About", value: "Your public GitHub contribution calendar for the last 12 months, refreshed daily. The number changes as the window moves. Not affiliated with or endorsed by GitHub." },
    { key: "manage", label: "Change design or remove your data", value: SITE },
    { key: "powered", label: "Powered by", value: "https://cospel.ar" },
  ];
  const g = genericFields(s);
  const generic = {
    headerFields: [field(g.header, "since")],
    primaryFields: [field(g.primary, "total")],
    secondaryFields: g.secondary.map((f, i) => field(f, `s${i}`)),
    auxiliaryFields: g.auxiliary.map((f, i) => field(f, `a${i}`)),
    backFields: back,
  };
  const pass: Record<string, unknown> = {
    formatVersion: 1,
    passTypeIdentifier: signer.passTypeIdentifier,
    teamIdentifier: signer.teamIdentifier,
    serialNumber: serialOf(u.id),
    organizationName: "Cospel",
    description: `GitHub contributions of @${u.login}`,
    backgroundColor: rgb(p.bg),
    foregroundColor: rgb(p.fg),
    labelColor: rgb(p.label),
    // Apple only calls HTTPS; local passes simply don't update.
    ...(SITE.startsWith("https://") ? { webServiceURL: `${SITE}/api/wallet`, authenticationToken: u.pass_token } : {}),
    barcodes: [{ format: "PKBarcodeFormatQR", message: url, messageEncoding: "iso-8859-1", altText: `github.com/${u.login}` }],
  };
  // name -> SVG in points, rendered at @1x/@2x/@3x
  const images: Record<string, string> = {};
  const art = artSvg(d, mode, s);
  if (d.layout === "store") {
    const fields = d.fields!(s);
    pass.logoText = u.login;
    pass.storeCard = {
      headerFields: [field(d.header(s), "header")],
      secondaryFields: fields.map((f, i) => field(f, `f${i}`, i === fields.length - 1 && i > 0 ? { textAlignment: "PKTextAlignmentRight" } : {})),
      backFields: back,
    };
    images.strip = art!;
    if (d.logo !== false) images.logo = logoSvg(s);
  } else if (d.layout === "poster") {
    pass.posterGeneric = {
      headerFields: [field(d.header(s), "header")],
      primaryFields: [{ key: "primary", value: d.primary!(s) }],
      footerFields: [{ key: "footer", value: d.footer!(s) }],
      backFields: back,
    };
    // iOS 26 and older ignore posterGeneric and show this (e.g. a pass synced to an older iPhone).
    pass.generic = generic;
    images.artwork = art!;
    images.primaryLogo = chipSvg(s, p.fg);
    images.logo = logoSvg(s);
  } else {
    pass.logoText = "gitcard";
    pass.generic = generic;
  }
  const files: Record<string, Buffer> = { "pass.json": Buffer.from(JSON.stringify(pass)) };
  const avatar = Buffer.from(profile.avatar.split(",")[1], "base64");
  for (const [scale, suffix] of [[1, ""], [2, "@2x"], [3, "@3x"]] as const) {
    for (const [name, svg] of Object.entries(images)) files[`${name}${suffix}.png`] = png(svg, scale);
    files[`icon${suffix}.png`] = await sharp(avatar).resize(38 * scale, 38 * scale).png().toBuffer();
    if (d.layout !== "store") files[`thumbnail${suffix}.png`] = await sharp(avatar).resize(90 * scale, 90 * scale).png().toBuffer();
  }
  return buildPkpass(files, signer);
}

/**
 * Saves a fresh GitHub profile. `pass_updated` moves only when something on the card changed;
 * returns whether it did. The window moves daily, so most days it does.
 */
export async function saveProfile(p: GitHubProfile, token?: string): Promise<boolean> {
  const [row] = await sql.query(
    `insert into users (id, login, name, token_enc, cal_start, counts, total, pass_token, joined, avatar, synced_at)
     values ($1, $2, $3, $4, $5, $6::int[], $7, $8, $9, $10, now())
     on conflict (id) do update set
       login = excluded.login, name = excluded.name, token_enc = coalesce(excluded.token_enc, users.token_enc),
       cal_start = excluded.cal_start, counts = excluded.counts, total = excluded.total, synced_at = now(),
       joined = excluded.joined, avatar = coalesce(excluded.avatar, users.avatar),
       pass_updated = case when (users.login, users.name, users.cal_start, users.counts, users.total, users.joined, users.avatar)
         is distinct from (excluded.login, excluded.name, excluded.cal_start, excluded.counts, excluded.total, excluded.joined, coalesce(excluded.avatar, users.avatar))
         then now() else users.pass_updated end
     returning pass_updated = now() as changed`,
    [p.id, p.login, p.name, token ? seal(token) : null, p.calendar.start, `{${p.calendar.counts.join(",")}}`, p.total, randomBytes(24).toString("base64url"), p.joined, p.avatar],
  );
  return Boolean(row?.changed);
}

/** Daily sync of one user: refetch, save, push when the card changed. Revoked tokens stop syncing. */
export async function syncUser(u: User): Promise<"changed" | "same" | "revoked"> {
  if (!u.token_enc) return "revoked";
  try {
    const changed = await saveProfile(await fetchProfile(unseal(u.token_enc)));
    if (changed) await push(u.id);
    return changed ? "changed" : "same";
  } catch (e) {
    if (!(e instanceof TokenRevoked)) throw e;
    await sql`update users set token_enc = null where id = ${u.id}`;
    return "revoked";
  }
}

/** Marks the pass changed (e.g. new theme) and asks the user's iPhones to fetch it. */
export async function touch(userId: string) {
  await sql`update users set pass_updated = now() where id = ${userId}`;
  await push(userId);
}

/**
 * Pushes every iPhone holding this user's pass; Wallet then asks for the new version.
 * Empty JSON payload, Pass Type ID as topic, TLS with the pass certificate (production APNs).
 */
export async function push(userId: string) {
  const signer = appleSigner();
  if (!signer) return;
  const tokens = ((await sql`select distinct push_token from registrations where user_id = ${userId}`) as { push_token: string }[]).map((r) => r.push_token);
  if (!tokens.length) return;
  const session = connect("https://api.push.apple.com", { cert: signer.cert, key: signer.key, passphrase: signer.keyPassphrase });
  session.on("error", (e) => console.error("[wallet] push", e.message));
  const gone: string[] = [];
  await Promise.all(
    tokens.map(
      (token) =>
        new Promise<void>((resolve) => {
          const req = session.request({ ":method": "POST", ":path": `/3/device/${token}`, "apns-topic": signer.passTypeIdentifier, "content-type": "application/json" });
          let status = 0;
          let body = "";
          req.on("response", (h) => (status = Number(h[":status"])));
          req.on("data", (d) => (body += d));
          req.on("error", () => resolve());
          req.on("close", () => {
            if (status === 410 || body.includes("BadDeviceToken")) gone.push(token);
            else if (status !== 200) console.error("[wallet] push", status, body);
            resolve();
          });
          req.end("{}");
        }),
    ),
  );
  session.close();
  if (gone.length) await sql`delete from registrations where push_token = any(${gone})`;
}

/** The user a Wallet web service call is about, when `Authorization: ApplePass <token>` matches. */
export async function walletUser(req: Request, passTypeId: string, serial: string): Promise<User | null> {
  const id = idOfSerial(serial);
  if (!id || passTypeId !== process.env.PASS_TYPE_IDENTIFIER) return null;
  const user = await getUser(id);
  const token = req.headers.get("authorization")?.replace(/^ApplePass /, "") ?? "";
  return user && equal(token, user.pass_token) ? user : null;
}
