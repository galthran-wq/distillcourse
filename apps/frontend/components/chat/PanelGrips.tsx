"use client";

import { startPanelDrag } from "@/lib/chat/panel-box";

/**
 * Wider than the border they sit on, which is not something to have to hit —
 * and over the header, which is positioned and would otherwise take the press
 * that lands on the corner. Under the menu, which is z-50 and hangs clear of
 * all three anyway.
 */
const GRIP = "absolute z-10 touch-none max-sm:hidden";

/**
 * The two edges of the docked panel that face into the page, and the corner
 * between them. The other two are the corner it hangs from, so these are the
 * ones that resize it without moving it. The header does the moving.
 */
export default function PanelGrips() {
  return (
    <>
      <div
        aria-hidden
        className={`${GRIP} inset-y-0 -left-1 w-2 cursor-ew-resize`}
        onPointerDown={(press) => startPanelDrag(press, "left")}
      />
      <div
        aria-hidden
        className={`${GRIP} inset-x-0 -top-1 h-2 cursor-ns-resize`}
        onPointerDown={(press) => startPanelDrag(press, "top")}
      />
      {/* Last, so that the corner takes the presses the two strips cross on. */}
      <div
        aria-hidden
        className={`${GRIP} -top-1 -left-1 size-4 cursor-nwse-resize`}
        onPointerDown={(press) => startPanelDrag(press, "corner")}
      />
    </>
  );
}
