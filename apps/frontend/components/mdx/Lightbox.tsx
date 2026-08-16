"use client";

import { useEffect, useState } from "react";
import { MOTION_FAST_MS } from "@/components/ui/styles";
import { useExitDelay } from "@/lib/ui/exit";
import { lockScroll } from "@/lib/ui/scroll-lock";

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
 * Open/close is animated (backdrop fade + image zoom); the overlay stays
 * mounted for the length of its exit, the way the tutor panel does.
 */
export default function Lightbox({ src, alt, width, height, className }: Props) {
  const [open, setOpen] = useState(false);
  const onScreen = useExitDelay(open, MOTION_FAST_MS);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const unlock = lockScroll();
    return () => {
      window.removeEventListener("keydown", onKey);
      unlock();
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
        onClick={(e) => {
          // The trigger may sit inside a <Link> (course contents thumbnails):
          // expanding must not navigate.
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      />
      {onScreen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className={`lightbox-overlay${open ? "" : " is-closing"}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="lightbox-full" />
        </div>
      )}
    </>
  );
}
