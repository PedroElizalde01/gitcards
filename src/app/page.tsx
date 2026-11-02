import { AsciiReveal } from "ascii-reveal";
import { headers } from "next/headers";
import { CardCycle } from "@/components/card-reveal";
import { Editor } from "@/components/editor";
import { LUM, cardHtml, pickTheme } from "@/lib/designs";
import { iosMajor } from "@/lib/ios";
import { getUser } from "@/server/db";
import { sessionUserId } from "@/server/session";
import { appleSigner, profileOf } from "@/server/wallet";
import { deleteAccount, signOut } from "./actions";

const ERRORS: Record<string, string> = {
  denied: "GitHub sign-in was cancelled.",
  state: "The sign-in link expired. Try again.",
  github: "GitHub didn't answer. Try again in a minute.",
  ios: "That design needs iOS 27 or later. Pick one that works on every iPhone.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const { error, deleted } = await searchParams;
  const id = await sessionUserId();
  const user = id ? await getUser(id) : null;

  if (!user) return <Landing error={typeof error === "string" ? ERRORS[error] : deleted ? "Your data was deleted." : undefined} />;

  const ios = iosMajor((await headers()).get("user-agent"));
  return (
    <>
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">@{user.login}</h1>
          <p className="text-sm text-muted">
            {user.total.toLocaleString("en-US")} contributions in the last 12 months
            {!user.token_enc && " · daily refresh stopped, sign in again to resume"}
          </p>
        </div>
        <form className="flex gap-4 text-sm text-muted">
          <button formAction={signOut} className="hover:text-foreground">
            Sign out
          </button>
          <button formAction={deleteAccount} className="hover:text-red-600">
            Delete my data
          </button>
        </form>
      </header>
      {error === "ios" && <p className="mb-6 text-sm text-red-600">{ERRORS.ios}</p>}
      <Editor profile={await profileOf(user)} initialTheme={pickTheme(user.theme).theme} ios={ios} canSign={appleSigner() !== null} />
    </>
  );
}

function Landing({ error }: { error?: string }) {
  const sample = {
    login: "octocat",
    name: "Your name",
    total: 683,
    // Illustration only, labelled as such below.
    calendar: { start: "2025-11-02", counts: Array.from({ length: 365 }, (_, i) => Math.max(0, Math.round(Math.sin(i / 9) * 4 + Math.sin(i * 1.7) * 3))) },
    joined: "2011-01-25",
    updated: new Date().toISOString(),
    avatar: "https://avatars.githubusercontent.com/u/583231?s=120",
    lum: Array(LUM * LUM).fill(0.5),
  };
  // ponytail: 6 light designs (~60 KB HTML); all 14 would add ~365 KB to the landing page.
  const cards = ["rings:dark", "ridges:light", "bars:dark", "clock:dark", "id:light", "weekday:dark"].map((t) => {
    const { design, mode } = pickTheme(t);
    return { name: design.name, html: cardHtml(design, mode, sample) };
  });
  return (
    <div className="grid flex-1 items-center gap-10 md:grid-cols-2">
      <AsciiReveal preset="decode" duration="cinematic" revealOnHydrate className="flex flex-col gap-5 [--ascii-flash:#3dff6e] [--ascii-font:var(--font-geist-mono)]">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Your GitHub, in your Wallet.</h1>
        <p className="text-lg text-muted">
          Sign in with GitHub, pick a design and add your contribution graph to Apple Wallet. It updates itself every day.
        </p>
        <a
          href="/api/auth/github/start"
          data-ascii="fade"
          className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-foreground px-6 font-medium text-background hover:opacity-90"
        >
          Continue with GitHub
        </a>
        <p className="text-xs text-muted">Read-only: gitcard asks for no permissions and only sees your public profile and contribution counts.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </AsciiReveal>
      <div className="mx-auto w-full max-w-[380px]">
        <CardCycle cards={cards} />
      </div>
    </div>
  );
}
