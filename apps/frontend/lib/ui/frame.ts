"use client";

/**
 * `work`, run once per frame however many sources ask for it, with the cancel
 * an effect's cleanup owes the frame it may have left pending.
 *
 * What it is for is work that reads layout and then writes a store: a gesture
 * that scrolls and reflows at once fires several listeners against the same
 * paint, and reading layout straight from a ResizeObserver is also what earns
 * the "ResizeObserver loop completed with undelivered notifications" error.
 */
export function oncePerFrame(work: () => void): {
  schedule: () => void;
  cancel: () => void;
} {
  let frame = 0;
  return {
    schedule: () => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        work();
      });
    },
    cancel: () => {
      cancelAnimationFrame(frame);
      frame = 0;
    },
  };
}
