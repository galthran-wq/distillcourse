"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt: string;
  /** Intrinsic size when known (prevents layout shift in prose). */
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Click-to-expand for sourced images: the inline <img> is the trigger, the
 * modal shows the SAME file at up to full viewport size. One file serves
 * both roles, which is why the pipeline stores sourced images at high
 * resolution (docs/figures.md §Sourced images).
 *
 * Open/close is animated (backdrop fade + image zoom, ~200ms); the closing
 * state keeps the dialog mounted until its exit animation ends.
 */
export default function Lightbox({ src, alt, width, height, className }: Props) {
  const [state, setState] = useState<"closed" | "open" | "closing">("closed");

  useEffect(() => {
    if (state === "closed") return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState("closing");
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [state]);

  // Unmount on a timer, never on animationend: the event does not fire when
  // the exit animation is suppressed (prefers-reduced-motion) or fails to
  // restart, and a missed event would leave the overlay eating every click.
  useEffect(() => {
    if (state !== "closing") return;
    const t = setTimeout(() => setState("closed"), 160);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized static asset, no optimizer in this build */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={className}
        style={{ cursor: "zoom-in" }}
        onClick={(e) => {
          // The trigger may sit inside a <Link> (course contents thumbnails):
          // expanding must not navigate.
          e.preventDefault();
          e.stopPropagation();
          setState("open");
        }}
      />
      {state !== "closed" && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className={`lightbox-overlay${state === "closing" ? " is-closing" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setState("closing");
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="lightbox-full" />
        </div>
      )}
    </>
  );
}
