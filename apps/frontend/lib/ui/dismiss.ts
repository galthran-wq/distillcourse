"use client";

import { useEffect, type RefObject } from "react";

/**
 * The one way a menu on this site goes away without being chosen from: a press
 * anywhere outside it, or Escape. `pointerdown` rather than `click` — the menu
 * has to be out of the way of what the press was aimed at, and waiting for the
 * release leaves it there for the whole press.
 *
 * `close` is the menu's own state setter, so that the listeners are attached
 * once per open rather than once per render of whatever holds the menu.
 */
export function useDismiss(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  close: (open: false) => void,
): void {
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) close(false);
    };
    const escape = (event: KeyboardEvent): void => {
      if (event.key !== "Escape") return;
      // An open menu is the top layer, so the Escape is spent on it: what it
      // hangs off — the expanded tutor panel, which listens on window, after
      // document — keeps its own Escape for when nothing is over it.
      event.stopPropagation();
      close(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open, root, close]);
}
