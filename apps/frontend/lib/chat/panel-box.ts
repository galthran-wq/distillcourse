"use client";

import { useEffect, useState, type CSSProperties, type PointerEvent as Press } from "react";
import {
  LAUNCHER_CLEARANCE,
  MIN_HEIGHT,
  MIN_WIDTH,
  PANEL_MARGIN,
  panelBox,
  setPanelBox,
  type PanelBox,
} from "@/lib/chat/stored";
import { createStore } from "@/lib/store";

/** What the reader has hold of: the panel itself, or an edge of it. */
export type Grip = "move" | "left" | "top" | "corner";

// The lengths the box is held to are the store's, which is where the defaults
// are built out of them; they are passed on here because this is the module
// that enforces them, and the tests read them from here.
export { LAUNCHER_CLEARANCE, MIN_HEIGHT, MIN_WIDTH, PANEL_MARGIN };

/**
 * The breakpoint the docked rule in `globals.css` is keyed on, mirrored here
 * because a media query cannot be read back out of a stylesheet. Below it the
 * panel keeps the corner the stylesheet puts it in: a box dragged out on a
 * desktop is not a box a phone has room for.
 */
const DESKTOP = "(min-width: 40rem)";

interface Viewport {
  width: number;
  height: number;
}

function viewport(): Viewport {
  return { width: window.innerWidth, height: window.innerHeight };
}

function movable(): boolean {
  return window.matchMedia(DESKTOP).matches;
}

/**
 * A whole number of pixels between a floor and a ceiling. A window with no room
 * for the floor is settled by the ceiling rather than the other way about: a
 * minimum honoured past the edge of the window is a panel whose own header —
 * the handle it is dragged by, the button that closes it — is off screen.
 */
function px(value: number, floor: number, ceiling: number): number {
  return Math.round(Math.max(Math.min(floor, ceiling), Math.min(value, ceiling)));
}

/**
 * Where the box lands when the reader drags `grip` by (dx, dy).
 *
 * The edges that can be dragged are the two facing into the page, away from the
 * corner the panel is anchored in — so a resize moves nothing, it only changes
 * the width and the height, and each is bounded by the room left between that
 * anchor and the margin. A move changes neither: it is the anchor that travels,
 * as far as the same margin on any side, except downwards, where it is the
 * launcher's clearance that stops it.
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
      bottom: px(
        from.bottom - dy,
        LAUNCHER_CLEARANCE,
        view.height - from.height - PANEL_MARGIN,
      ),
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
 * every side and clear of the launcher below.
 */
export function fittedBox(box: PanelBox, view: Viewport): PanelBox {
  const width = px(box.width, MIN_WIDTH, view.width - 2 * PANEL_MARGIN);
  const height = px(box.height, MIN_HEIGHT, view.height - PANEL_MARGIN - LAUNCHER_CLEARANCE);
  return {
    right: px(box.right, PANEL_MARGIN, view.width - width - PANEL_MARGIN),
    bottom: px(box.bottom, LAUNCHER_CLEARANCE, view.height - height - PANEL_MARGIN),
    width,
    height,
  };
}

/**
 * The stored box as this window can draw it, refitted as that window changes.
 *
 * The fit is never written back. It is this window's answer rather than a
 * decision the reader made, and storing it would spend the box they dragged out
 * on a wide screen the first time the page is opened on a small one — and spend
 * it for good, since nothing puts it back. The window is state rather than
 * something measured during a render: the server has no window, and the first
 * client render has to reproduce what the server wrote. `null` is that render,
 * and also every window under the breakpoint, where the stylesheet keeps the
 * panel in its own corner and there is nothing to fit.
 */
export function usePanelFit(box: PanelBox): PanelBox {
  const [view, setView] = useState<Viewport | null>(null);

  useEffect(() => {
    const measure = (): void => setView(movable() ? viewport() : null);
    // Dragging a window edge fires resize faster than the screen is drawn, and
    // every one of them would re-render the transcript under the panel.
    let frame = 0;
    const onResize = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return view === null ? box : fittedBox(box, view);
}

// A drag is on the panel as a class as well as a box, because `globals.css`
// takes the transition off it while it runs — a drag has to land under the
// pointer rather than one motion-base behind it.
const dragging = createStore(false);

export function usePanelDragging(): boolean {
  return dragging.use();
}

/**
 * The custom properties the docked rule in `globals.css` places the panel by,
 * spelled out: a field added to `PanelBox` is not a property any stylesheet
 * reads. React takes custom properties off the style object all the same, which
 * is what the cast says.
 */
export function panelVars(box: PanelBox): CSSProperties {
  return {
    "--panel-right": `${box.right}px`,
    "--panel-bottom": `${box.bottom}px`,
    "--panel-width": `${box.width}px`,
    "--panel-height": `${box.height}px`,
  } as CSSProperties;
}

/**
 * Moves or resizes the docked `panel` for as long as the pointer that pressed
 * `grip` is down.
 *
 * While it runs the box goes straight to the panel's own custom properties and
 * not through the store: the store is what the transcript is rendered from, and
 * re-rendering that at pointer rate is what makes a drag stutter. React is told
 * once, at the release — which is also the only write to storage a drag costs.
 * Nothing it wrote is overwritten in the meantime, since the props React holds
 * for the panel have not changed.
 */
export function startPanelDrag(
  press: Press<HTMLElement>,
  panel: HTMLElement | null,
  grip: Grip,
): void {
  // Only the main button drags. A right-click opens the context menu over a
  // captured pointer that is then never released, which would leave the panel
  // held down with nothing to let go of it.
  if (press.button !== 0 || !press.isPrimary) return;
  if (panel === null || !movable()) return;
  const handle = press.currentTarget;
  // The press is the start of a drag, not of a selection of the header's text.
  press.preventDefault();
  handle.setPointerCapture(press.pointerId);

  const view = viewport();
  // What is on screen, which is not what is stored if this window is smaller
  // than the one the box was dragged out in.
  const from = fittedBox(panelBox(), view);
  const startX = press.clientX;
  const startY = press.clientY;
  let box = from;
  let moved = false;

  const drag = (at: PointerEvent): void => {
    moved = true;
    box = draggedBox(from, grip, at.clientX - startX, at.clientY - startY, view);
    for (const [name, value] of Object.entries(panelVars(box)))
      panel.style.setProperty(name, String(value));
  };
  const drop = (): void => {
    handle.removeEventListener("pointermove", drag);
    handle.removeEventListener("pointerup", drop);
    handle.removeEventListener("pointercancel", drop);
    dragging.set(false);
    // A press that never moved is a click on the header, and the box it would
    // write is `from` — this window's fit rather than a decision the reader
    // made. Storing that is exactly what `usePanelFit` refuses to do: it would
    // spend the box dragged out on a wide screen the first time the panel is
    // touched on a small one, and nothing puts it back.
    if (moved) setPanelBox(box);
  };
  // The pointer is captured, so the listeners belong on the handle: a drag that
  // leaves the panel, or the window, still arrives here.
  handle.addEventListener("pointermove", drag);
  handle.addEventListener("pointerup", drop);
  handle.addEventListener("pointercancel", drop);
  dragging.set(true);
}
