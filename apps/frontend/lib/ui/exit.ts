"use client";

import { useEffect, useState } from "react";

/**
 * Keeps an element on screen for the length of its exit animation: an
 * unmounted element has nothing left to animate, so the caller renders while
 * this returns true and passes the same duration its CSS uses
 * (`MOTION_BASE_MS`/`MOTION_FAST_MS` — a timer cannot read a CSS variable).
 *
 * Opening is adjusted during the render rather than in an effect: the element
 * has to be in the paint that opens it, and a paint later is a frame of
 * nothing. Unmounting is a timer and never `animationend`, which does not
 * fire when the exit is suppressed (prefers-reduced-motion) or fails to
 * restart — a missed event would leave the element there, eating clicks.
 */
export function useExitDelay(open: boolean, ms: number): boolean {
  const [onScreen, setOnScreen] = useState(open);
  if (open && !onScreen) setOnScreen(true);

  useEffect(() => {
    if (open || !onScreen) return;
    const timer = setTimeout(() => setOnScreen(false), ms);
    return () => clearTimeout(timer);
  }, [open, onScreen, ms]);

  return onScreen;
}
