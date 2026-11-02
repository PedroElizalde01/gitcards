"use client";
import { AsciiReveal, type AsciiRevealHandle } from "ascii-reveal";
import { useEffect, useRef } from "react";

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
