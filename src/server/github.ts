import "server-only";
import sharp from "sharp";
import type { Calendar } from "@/lib/designs";

export interface GitHubProfile {
  id: number;
  login: string;
  name: string | null;
  calendar: Calendar;
  total: number;
  /** YYYY-MM-DD */
  joined: string;
  /** 240px JPEG as base64; null when the download failed (the stored one is kept). */
  avatar: string | null;
}

/** GitHub said the token is gone (revoked or app uninstalled). */
export class TokenRevoked extends Error {}

const QUERY = `query {
  viewer {
    databaseId login name createdAt avatarUrl(size: 240)
    contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } } }
  }
}`;

/** The token owner's profile and last-12-months calendar (GitHub's default window). */
export async function fetchProfile(token: string): Promise<GitHubProfile> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "gitcard" },
    body: JSON.stringify({ query: QUERY }),
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });
  if (res.status === 401) throw new TokenRevoked();
  const json = await res.json();
  const v = json?.data?.viewer;
  if (!res.ok || !v) throw new Error(`GitHub GraphQL ${res.status}: ${JSON.stringify(json?.errors ?? json).slice(0, 300)}`);
  const days: { date: string; contributionCount: number }[] = v.contributionsCollection.contributionCalendar.weeks.flatMap((w: { contributionDays: unknown[] }) => w.contributionDays);
  return {
    id: v.databaseId,
    login: v.login,
    name: v.name || null,
    total: v.contributionsCollection.contributionCalendar.totalContributions,
    joined: String(v.createdAt).slice(0, 10),
    avatar: await avatarJpeg(v.avatarUrl),
    calendar: { start: days[0]?.date ?? new Date().toISOString().slice(0, 10), counts: days.map((d) => d.contributionCount) },
  };
}

async function avatarJpeg(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return (await sharp(Buffer.from(await res.arrayBuffer())).resize(240, 240).flatten({ background: "#ffffff" }).jpeg({ quality: 85 }).toBuffer()).toString("base64");
  } catch {
    return null;
  }
}

export async function exchangeCode(code: string, verifier: string, redirectUri: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`GitHub token exchange failed: ${json.error ?? res.status}`);
  return json.access_token;
}

/** Revokes the app's grant so the token stops working (account deletion). */
export async function revokeGrant(token: string) {
  const basic = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString("base64");
  await fetch(`https://api.github.com/applications/${process.env.GITHUB_CLIENT_ID}/grant`, {
    method: "DELETE",
    headers: { Authorization: `Basic ${basic}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "gitcard" },
    body: JSON.stringify({ access_token: token }),
  }).catch(() => null);
}
