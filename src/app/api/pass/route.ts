import { fitsIOS, isTheme, pickTheme } from "@/lib/designs";
import { iosMajor } from "@/lib/ios";
import { getUser, sql } from "@/server/db";
import { sessionUserId } from "@/server/session";
import { appleSigner, buildPass, touch } from "@/server/wallet";

/**
 * The signed-in user's pass in the `?theme=` design (saved; an already installed card gets it by push).
 * Safari on iPhone opens it straight in the Add to Wallet sheet.
 * A poster design is refused on an iPhone older than iOS 27, before anything is saved.
 */
export async function GET(req: Request) {
  const id = await sessionUserId();
  if (!id) return new Response("Sign in first", { status: 401 });
  const param = new URL(req.url).searchParams.get("theme");
  const saved = await getUser(id);
  if (!saved) return new Response("Sign in first", { status: 401 });
  const theme = isTheme(param) ? param : saved.theme;
  if (!fitsIOS(pickTheme(theme).design, iosMajor(req.headers.get("user-agent")))) return Response.redirect(new URL("/?error=ios", req.url), 303);
  if (((await sql`update users set theme = ${theme} where id = ${id} and theme <> ${theme} returning id`) as unknown[]).length) await touch(id);
  const user = (await getUser(id))!;
  const signer = appleSigner();
  if (!signer) return new Response("Apple Wallet signing is not configured", { status: 503 });
  try {
    const pkpass = await buildPass(user, signer);
    return new Response(new Uint8Array(pkpass), {
      headers: { "Content-Type": "application/vnd.apple.pkpass", "Content-Disposition": `attachment; filename="gitcard-${user.login}.pkpass"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("[pass] signing", e);
    return new Response("Could not create the pass. Try again later.", { status: 500 });
  }
}
