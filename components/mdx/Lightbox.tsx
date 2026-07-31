"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

/**
 * Click-to-expand for sourced images: the inline <img> is the trigger, the
 * modal shows the SAME file at up to full viewport size. One file serves
 * both roles, which is why the pipeline stores sourced images at high
 * resolution (docs/figures.md §Sourced images) — the browser downscales
 * the inline rendering; the lightbox is where the pixels pay off.
 */
export default function Lightbox({ src, alt, width, height, className }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

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
        onClick={() => setOpen(true)}
      />
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="lightbox-overlay"
          onClick={() => setOpen(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="lightbox-full" />
        </div>
      )}
    </>
  );
}
