import { cookies } from "next/headers";
import { exchangeCode, fetchProfile } from "@/server/github";
import { equal, startSession } from "@/server/session";
import { push, saveProfile } from "@/server/wallet";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const jar = await cookies();
  const [state, verifier] = (jar.get("gc_oauth")?.value ?? "").split(".");
  jar.delete("gc_oauth");
  const back = (error?: string) => Response.redirect(new URL(error ? `/?error=${error}` : "/", url.origin), 302);
  if (url.searchParams.get("error")) return back("denied");
  if (!state || !verifier || !equal(state, url.searchParams.get("state") ?? "")) return back("state");
  try {
    const token = await exchangeCode(url.searchParams.get("code") ?? "", verifier, `${url.origin}/api/auth/github/callback`);
    const profile = await fetchProfile(token);
    if (await saveProfile(profile, token)) await push(String(profile.id));
    await startSession(String(profile.id));
    return back();
  } catch (e) {
    console.error("[auth] callback", e);
    return back("github");
  }
}
