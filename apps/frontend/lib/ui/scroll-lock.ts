"use client";

// The one way anything covering the page stops the page under it from
// scrolling. The scroller is the root, not the body: `globals.css` keeps
// `overflow-x: clip` on `html`/`body` so the root stays the scroll container
// the sticky ToC needs, which means a lock on `body` — the old way — never
// reached the scroll that actually moves. This locks the root's vertical
// overflow instead, and pads for the scrollbar it removes so the fixed UI over
// it does not jump by a scrollbar's width when it engages.
//
// Ref-counted: a lightbox opened from inside another overlay must not unlock
// the page when only it closes. The first locker freezes, the last one thaws.

let depth = 0;
let restore: (() => void) | null = null;

/** Freeze the page scroll; the returned function thaws this hold. */
export function lockScroll(): () => void {
  if (depth === 0) {
    const root = document.documentElement;
    const previous = root.style.overflowY;
    const previousPad = root.style.paddingRight;
    // Measured before the scrollbar is taken away.
    const bar = window.innerWidth - root.clientWidth;
    root.style.overflowY = "hidden";
    if (bar > 0) root.style.paddingRight = `${bar}px`;
    restore = () => {
      root.style.overflowY = previous;
      root.style.paddingRight = previousPad;
    };
  }
  depth += 1;
  let released = false;
  return () => {
    // A cleanup that runs twice must not thaw a hold it does not own.
    if (released) return;
    released = true;
    depth -= 1;
    if (depth === 0 && restore !== null) {
      restore();
      restore = null;
    }
  };
}
