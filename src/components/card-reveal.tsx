"use client";
import { AsciiReveal, type AsciiRevealHandle } from "ascii-reveal";
import { useRef } from "react";

// Landing sample card: decodes in as dithered ASCII on load, click replays from the click point.
export function CardReveal({ html }: { html: string }) {
  const ref = useRef<AsciiRevealHandle>(null);
  return (
    <AsciiReveal
      ref={ref}
      preset="dither"
      duration="cinematic"
      revealOnHydrate
      title="Click to replay"
      className="cursor-pointer [--ascii-accent:#3dff6e] [--ascii-flash:#3dff6e] [--ascii-font:var(--font-geist-mono)]"
      onClick={(e) => ref.current?.reveal({ origin: { x: e.clientX, y: e.clientY } })}
    >
      {/* data-ascii="media" makes the inline rings SVG render through the glyph grid like an image */}
      <div data-ascii="surface" dangerouslySetInnerHTML={{ __html: html.replace("<svg ", '<svg data-ascii="media" ') }} />
    </AsciiReveal>
  );
}
