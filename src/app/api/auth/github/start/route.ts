import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { cookieOpts } from "@/server/session";

/** Sends the user to GitHub with `state` and PKCE. No scopes: public profile and contributions only. */
export async function GET(req: Request) {
  const state = randomBytes(16).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  (await cookies()).set("gc_oauth", `${state}.${verifier}`, { ...cookieOpts, maxAge: 600 });
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID ?? "",
    redirect_uri: `${new URL(req.url).origin}/api/auth/github/callback`,
    state,
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }).toString();
  return Response.redirect(url, 302);
}
