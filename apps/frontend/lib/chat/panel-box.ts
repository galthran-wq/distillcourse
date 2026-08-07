"use client";

import { useEffect, type CSSProperties, type PointerEvent as Press } from "react";
import { panelBox, setPanelBox, type PanelBox } from "@/lib/chat/stored";
import { createStore } from "@/lib/store";

/** What the reader has hold of: the panel itself, or an edge of it. */
export type Grip = "move" | "left" | "top" | "corner";

/** The panel never goes below the box it opens at. */
export const MIN_WIDTH = 384;
export const MIN_HEIGHT = 512;

/**
 * How close to the edge of the window the panel may be dragged, and so also how
 * far it may grow: the page keeps this much of itself either way.
 */
export const PANEL_MARGIN = 24;

/**
 * The breakpoint the docked rule in `globals.css` is keyed on, mirrored here
 * because a media query cannot be read back out of a stylesheet. Below it the
 * panel keeps the corner the stylesheet puts it in: a box dragged out on a
 * desktop is not a box a phone has room for.
 */
const DESKTOP = "(min-width: 40rem)";

export interface Viewport {
  width: number;
  height: number;
}

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function movable(): boolean {
  return window.matchMedia(DESKTOP).matches;
}

/** A whole number of pixels within bounds; a squeeze is settled by the minimum. */
function px(value: number, min: number, max: number): number {
  return Math.round(Math.max(min, Math.min(value, max)));
}

/**
 * Where the box lands when the reader drags `grip` by (dx, dy).
 *
 * The edges that can be dragged are the two facing into the page, away from the
 * corner the panel is anchored in — so a resize moves nothing, it only changes
 * the width and the height, and each is bounded by the room left between that
 * anchor and the margin. A move changes neither: it is the anchor that travels,
 * as far as the same margin on any side.
 */
export function draggedBox(
  from: PanelBox,
  grip: Grip,
  dx: number,
  dy: number,
  view: Viewport,
): PanelBox {
  if (grip === "move")
    return {
      ...from,
      right: px(from.right - dx, PANEL_MARGIN, view.width - from.width - PANEL_MARGIN),
      bottom: px(from.bottom - dy, PANEL_MARGIN, view.height - from.height - PANEL_MARGIN),
    };
  return {
    ...from,
    width:
      grip === "top"
        ? from.width
        : px(from.width - dx, MIN_WIDTH, view.width - from.right - PANEL_MARGIN),
    height:
      grip === "left"
        ? from.height
        : px(from.height - dy, MIN_HEIGHT, view.height - from.bottom - PANEL_MARGIN),
  };
}

/**
 * The same box in a window it may no longer fit — one smaller than the one it
 * was dragged out in, or one being resized under it. The size gives way first,
 * then the corner it hangs from, so that what is left is inside the margin on
 * every side.
 */
export function fittedBox(box: PanelBox, view: Viewport): PanelBox {
  const width = px(box.width, MIN_WIDTH, view.width - 2 * PANEL_MARGIN);
  const height = px(box.height, MIN_HEIGHT, view.height - 2 * PANEL_MARGIN);
  return {
    right: px(box.right, PANEL_MARGIN, view.width - width - PANEL_MARGIN),
    bottom: px(box.bottom, PANEL_MARGIN, view.height - height - PANEL_MARGIN),
    width,
    height,
  };
}

/** Brings the stored box back inside the window it is about to be drawn in. */
export function fitPanelBox(): void {
  if (movable()) setPanelBox(fittedBox(panelBox(), viewport()));
}

/** The same, for as long as the widget is mounted: a window can be resized. */
export function usePanelFit(): void {
  useEffect(() => {
    fitPanelBox();
    window.addEventListener("resize", fitPanelBox);
    return () => window.removeEventListener("resize", fitPanelBox);
  }, []);
}

// A drag is on the panel as a class as well as a box, because `globals.css`
// takes the transition off it while it runs — a drag has to land under the
// pointer rather than one motion-base behind it.
const dragging = createStore(false);

export function usePanelDragging(): boolean {
  return dragging.use();
}

/** The custom properties the docked rule in `globals.css` places the panel by. */
function vars(box: PanelBox): [string, string][] {
  return Object.entries(box).map(([edge, size]) => [`--panel-${edge}`, `${size}px`]);
}

export function panelVars(box: PanelBox): CSSProperties {
  return Object.fromEntries(vars(box)) as CSSProperties;
}

/**
 * Moves or resizes the docked panel for as long as the pointer that pressed
 * `grip` is down.
 *
 * While it runs the box goes straight to the panel's own custom properties and
 * not through the store: the store is what the transcript is rendered from, and
 * re-rendering that at pointer rate is what makes a drag stutter. React is told
 * once, at the release — which is also the only write to storage a drag costs.
 * Nothing it wrote is overwritten in the meantime, since the props React holds
 * for the panel have not changed.
 */
export function startPanelDrag(press: Press<HTMLElement>, grip: Grip): void {
  const handle = press.currentTarget;
  const panel = handle.closest<HTMLElement>(".chat-panel");
  if (panel === null || !movable()) return;
  // The press is the start of a drag, not of a selection of the header's text.
  press.preventDefault();
  handle.setPointerCapture(press.pointerId);

  const from = panelBox();
  const view = viewport();
  const startX = press.clientX;
  const startY = press.clientY;
  let box = from;

  const drag = (at: PointerEvent): void => {
    box = draggedBox(from, grip, at.clientX - startX, at.clientY - startY, view);
    for (const [name, value] of vars(box)) panel.style.setProperty(name, value);
  };
  const drop = (): void => {
    handle.removeEventListener("pointermove", drag);
    handle.removeEventListener("pointerup", drop);
    handle.removeEventListener("pointercancel", drop);
    dragging.set(false);
    setPanelBox(box);
  };
  // The pointer is captured, so the listeners belong on the handle: a drag that
  // leaves the panel, or the window, still arrives here.
  handle.addEventListener("pointermove", drag);
  handle.addEventListener("pointerup", drop);
  handle.addEventListener("pointercancel", drop);
  dragging.set(true);
}
