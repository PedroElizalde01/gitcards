"use client";
import { AsciiReveal, type AsciiRevealHandle } from "ascii-reveal";
import { useEffect, useRef, useState } from "react";

// Card decodes in as dithered ASCII on load and whenever `html` changes; click replays from the click point.
export function CardReveal({ html, className = "" }: { html: string; className?: string }) {
  const ref = useRef<AsciiRevealHandle>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false; // mount is covered by revealOnHydrate
    else ref.current?.reveal();
  }, [html]);
  return (
    <AsciiReveal
      ref={ref}
      preset="dither"
      duration="cinematic"
      revealOnHydrate
      title="Click to replay"
      className={`cursor-pointer [--ascii-accent:#3dff6e] [--ascii-flash:#3dff6e] [--ascii-font:var(--font-geist-mono)] ${className}`}
      onClick={(e) => ref.current?.reveal({ origin: { x: e.clientX, y: e.clientY } })}
    >
      {/* data-ascii="media" makes inline art SVGs render through the glyph grid like an image */}
      <div data-ascii="surface" dangerouslySetInnerHTML={{ __html: html.replaceAll("<svg ", '<svg data-ascii="media" ') }} />
    </AsciiReveal>
  );
}

/** Landing: rotates sample cards every 5 s, each change decoding in through CardReveal. Still under reduced motion. */
export function CardCycle({ cards }: { cards: { name: string; html: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => document.hidden || setI((n) => (n + 1) % cards.length), 5000);
    return () => clearInterval(t);
  }, [cards.length]);
  return (
    <>
      {/* fixed box so poster/store height differences don't shift the page */}
      <div className="flex aspect-[300/392] items-center">
        <CardReveal html={cards[i].html} className="w-full" />
      </div>
      <p className="mt-2 text-center text-xs text-muted">Sample card · {cards[i].name}</p>
    </>
  );
}
