"use client";

import { useMemo, useState } from "react";
import { DESIGNS, POSTER_MIN_IOS, cardHtml, fitsIOS, pickTheme, type Design, type Mode, type Profile } from "@/lib/designs";

/**
 * Design picker. `ios` is the iPhone's iOS major (null off-iPhone): posters are hidden below iOS 27,
 * because Wallet there can't show them (the server refuses them too).
 */
export function Editor({ profile, initialTheme, ios, canSign }: { profile: Profile; initialTheme: string; ios: number | null; canSign: boolean }) {
  const init = pickTheme(initialTheme);
  const [id, setId] = useState(fitsIOS(init.design, ios) ? init.design.id : "classic");
  const [mode, setMode] = useState<Mode>(init.mode);
  const design = DESIGNS.find((d) => d.id === id)!;
  const cards = useMemo(() => new Map(DESIGNS.map((d) => [d.id, cardHtml(d, mode, profile)])), [mode, profile]);
  const groups: [string, Design[]][] = [
    ["Works on every iPhone", DESIGNS.filter((d) => d.layout !== "poster")],
    [`Poster · iOS ${POSTER_MIN_IOS} and later`, DESIGNS.filter((d) => d.layout === "poster" && fitsIOS(d, ios))],
  ];
  const postersHidden = !groups[1][1].length;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,360px)_1fr] md:items-start">
      <div className="mx-auto flex w-full max-w-[360px] flex-col gap-4 md:sticky md:top-8">
        <div dangerouslySetInnerHTML={{ __html: cardHtml(design, mode, profile, `${id}-${mode}-big`) }} />

        <div role="radiogroup" aria-label="Color mode" className="flex self-center rounded-full border border-line p-1 text-sm">
          {(["dark", "light"] as const).map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-full px-4 py-1.5 capitalize ${mode === m ? "bg-foreground text-background" : "text-muted hover:text-foreground"}`}>
              {m}
            </button>
          ))}
        </div>

        {canSign ? (
          <div className="flex flex-col items-center gap-2">
            {/* The download saves the chosen design first; an installed card switches to it too. */}
            <a href={`/api/pass?theme=${id}:${mode}`} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-black px-6 font-medium text-white ring-1 ring-white/20 hover:bg-black/85">
              <WalletIcon />
              Add to Apple Wallet
            </a>
            <p className="text-center text-xs text-muted">
              {design.layout === "poster" && ios === null
                ? `Poster designs need iOS ${POSTER_MIN_IOS} on your iPhone. Older iPhones show a basic version.`
                : "On iPhone, Safari opens the card: tap Add. It refreshes itself every day."}
            </p>
          </div>
        ) : (
          <p className="rounded-lg border border-line p-3 text-sm text-muted">Preview only: Apple Wallet signing isn&apos;t configured on this server, so no card can be issued yet.</p>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {groups.map(([title, list]) =>
          list.length ? (
            <fieldset key={title}>
              <legend className="mb-3 text-sm font-medium">{title}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {list.map((d) => (
                  <label key={d.id} className={`cursor-pointer rounded-xl border p-2 transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-foreground ${id === d.id ? "border-foreground" : "border-line hover:border-muted"}`}>
                    <input type="radio" name="design" value={d.id} checked={id === d.id} onChange={() => setId(d.id)} className="sr-only" />
                    <div dangerouslySetInnerHTML={{ __html: cards.get(d.id)! }} />
                    <div className="mt-2 text-center text-xs font-medium">{d.name}</div>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null,
        )}
        {postersHidden && (
          <p className="text-sm text-muted">
            Poster designs need iOS {POSTER_MIN_IOS} or later, so they&apos;re hidden on this iPhone. On iOS {POSTER_MIN_IOS}, open this page in Safari to see them.
          </p>
        )}
      </div>
    </div>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 9h18M3 12.5h18" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
