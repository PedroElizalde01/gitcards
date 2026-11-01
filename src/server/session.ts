import "server-only";
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/** One secret (`openssl rand -base64 32`), split into a cookie-signing key and a token-encryption key. */
function key(purpose: string) {
  if (!process.env.APP_SECRET) throw new Error("APP_SECRET is not set");
  return createHmac("sha256", process.env.APP_SECRET).update(purpose).digest();
}

const COOKIE = "gc_session";
const MAX_AGE = 60 * 60 * 24 * 30;
export const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };

const sig = (v: string) => createHmac("sha256", key("session")).update(v).digest("base64url");

export function equal(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** The signed-in GitHub user id, or null. Cookie: `<id>.<expiry>.<hmac>`. */
export async function sessionUserId(): Promise<string | null> {
  const v = (await cookies()).get(COOKIE)?.value ?? "";
  const [id, exp, mac] = v.split(".");
  if (!id || !exp || !mac || Number(exp) < Date.now() / 1000 || !equal(mac, sig(`${id}.${exp}`))) return null;
  return id;
}

export async function startSession(userId: string) {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  (await cookies()).set(COOKIE, `${payload}.${sig(payload)}`, { ...cookieOpts, maxAge: MAX_AGE });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** GitHub tokens at rest: AES-256-GCM, `iv.tag.ciphertext` in base64url. */
export function seal(plain: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key("token"), iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function unseal(sealed: string): string {
  const [iv, tag, data] = sealed.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key("token"), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}
