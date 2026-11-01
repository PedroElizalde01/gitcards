import { syncableUsers } from "@/server/db";
import { syncUser } from "@/server/wallet";

export const maxDuration = 300;

/** Daily (vercel.json): refetch every connected user's calendar and push passes that changed. */
// ponytail: sequential, ~0.5 s per user ≈ 500 users per run; batch across runs or use a queue past that.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new Response(null, { status: 401 });
  const tally = { changed: 0, same: 0, revoked: 0, failed: 0 };
  for (const u of await syncableUsers()) {
    try {
      tally[await syncUser(u)]++;
    } catch (e) {
      tally.failed++;
      console.error("[cron] sync", u.login, e);
    }
  }
  console.info("[cron] sync", tally);
  return Response.json(tally);
}
