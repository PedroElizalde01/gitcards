import { sql } from "@/server/db";
import { appleSigner, buildPass, serialOf, walletUser } from "@/server/wallet";

/**
 * Apple's Wallet web service (webServiceURL = <site>/api/wallet), routes exactly as Apple names them:
 * https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes
 */
type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: Request, ctx: Ctx) {
  const p = (await ctx.params).path;
  // devices/{deviceId}/registrations/{passTypeId}?passesUpdatedSince=<our lastUpdated>
  if (p[0] === "devices" && p[2] === "registrations" && p.length === 4) {
    if (p[3] !== process.env.PASS_TYPE_IDENTIFIER) return new Response(null, { status: 404 });
    const since = Number(new URL(req.url).searchParams.get("passesUpdatedSince")) || 0;
    const rows = (await sql`
      select u.id::text, extract(epoch from u.pass_updated) * 1000 as ms from registrations r join users u on u.id = r.user_id
      where r.device_id = ${p[1]} and u.pass_updated > to_timestamp(${since} / 1000.0)`) as { id: string; ms: number }[];
    if (!rows.length) return new Response(null, { status: 204 });
    return Response.json({ serialNumbers: rows.map((r) => serialOf(r.id)), lastUpdated: String(Math.ceil(Math.max(...rows.map((r) => Number(r.ms))))) });
  }
  // passes/{passTypeId}/{serial}
  if (p[0] === "passes" && p.length === 3) {
    const user = await walletUser(req, p[1], p[2]);
    const signer = appleSigner();
    if (!user || !signer) return new Response(null, { status: 401 });
    const since = Date.parse(req.headers.get("if-modified-since") ?? "");
    if (since && Math.floor(user.pass_updated.getTime() / 1000) <= since / 1000) return new Response(null, { status: 304 });
    return new Response(new Uint8Array(await buildPass(user, signer)), {
      headers: { "Content-Type": "application/vnd.apple.pkpass", "Last-Modified": user.pass_updated.toUTCString(), "Cache-Control": "no-store" },
    });
  }
  return new Response(null, { status: 404 });
}

// devices/{deviceId}/registrations/{passTypeId}/{serial}: an iPhone added the pass.
export async function POST(req: Request, ctx: Ctx) {
  const p = (await ctx.params).path;
  if (p[0] === "log") {
    const { logs } = (await req.json().catch(() => ({}))) as { logs?: unknown };
    if (Array.isArray(logs)) for (const line of logs.slice(0, 20)) console.error("[wallet] device log", String(line).slice(0, 500));
    return new Response(null, { status: 200 });
  }
  if (p[0] !== "devices" || p[2] !== "registrations" || p.length !== 5) return new Response(null, { status: 404 });
  const user = await walletUser(req, p[3], p[4]);
  if (!user) return new Response(null, { status: 401 });
  const { pushToken } = (await req.json().catch(() => ({}))) as { pushToken?: unknown };
  if (typeof pushToken !== "string" || !pushToken) return new Response(null, { status: 400 });
  const [row] = (await sql`
    insert into registrations (device_id, user_id, push_token) values (${p[1]}, ${user.id}, ${pushToken})
    on conflict (device_id, user_id) do update set push_token = excluded.push_token
    returning (xmax = 0) as created`) as { created: boolean }[];
  // A device has one push token for all its passes.
  await sql`update registrations set push_token = ${pushToken} where device_id = ${p[1]}`;
  return new Response(null, { status: row?.created ? 201 : 200 });
}

// The pass was removed from that iPhone.
export async function DELETE(req: Request, ctx: Ctx) {
  const p = (await ctx.params).path;
  if (p[0] !== "devices" || p[2] !== "registrations" || p.length !== 5) return new Response(null, { status: 404 });
  const user = await walletUser(req, p[3], p[4]);
  if (!user) return new Response(null, { status: 401 });
  await sql`delete from registrations where device_id = ${p[1]} and user_id = ${user.id}`;
  return new Response(null, { status: 200 });
}
