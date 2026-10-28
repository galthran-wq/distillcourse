// @vitest-environment jsdom
import { act, createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as Press } from "react";
import {
  LAUNCHER_CLEARANCE,
  MIN_HEIGHT,
  MIN_WIDTH,
  PANEL_MARGIN,
  type Grip,
} from "@/lib/chat/panel-box";
import type { PanelBox } from "@/lib/chat/stored";
import { mounted } from "./utils/dom";

/** A desktop window, and the box the panel opens in one corner of it. */
const VIEW = { width: 1280, height: 800 };
const OPENED: PanelBox = {
  right: PANEL_MARGIN,
  bottom: LAUNCHER_CLEARANCE,
  width: MIN_WIDTH,
  height: MIN_HEIGHT,
};

/** The entry itself — what the next load is built out of. */
function entry(): Record<string, unknown> {
  return JSON.parse(window.localStorage.getItem("distillcourse.chat") ?? "null");
}

/** jsdom has neither, and both are what tells the panel it may be dragged. */
function browser(view = VIEW): void {
  window.innerWidth = view.width;
  window.innerHeight = view.height;
  window.matchMedia = ((query: string) => ({
    matches: query === "(min-width: 40rem)" && window.innerWidth >= 640,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia;
}

/**
 * The two modules as this load has them. Imported here rather than at the top
 * of the file because the store behind them is built once per load, out of
 * storage: a test that cleared storage and kept the module would be reading
 * the previous test's panel. The lengths above are the exception — a number is
 * the same number in every load.
 */
async function load() {
  return { ...(await import("@/lib/chat/panel-box")), ...(await import("@/lib/chat/stored")) };
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.replaceChildren();
  vi.resetModules();
  browser();
});

// Registered after the hook above on purpose: it puts a host element of its own
// in the body, and the body is emptied there.
const { render } = mounted();

/**
 * A panel mounted on `usePanelFit`, and what it is being drawn as now — which
 * changes without a second render of the test's own, since a resize is the
 * hook's to notice.
 */
function probe(
  usePanelFit: (box: PanelBox) => PanelBox,
  box: () => PanelBox,
): () => PanelBox {
  let fit = box();
  const Probe = (): null => {
    fit = usePanelFit(box());
    return null;
  };
  act(() => render(createElement(Probe)));
  return () => fit;
}

describe("the box the reader drags the docked panel to", () => {
  it("widens from the left edge, heightens from the top, does both at the corner", async () => {
    const { draggedBox } = await load();

    expect(draggedBox(OPENED, "left", -200, 0, VIEW)).toEqual({
      ...OPENED,
      width: 584,
    });
    expect(draggedBox(OPENED, "top", 0, -100, VIEW)).toEqual({
      ...OPENED,
      height: 612,
    });
    // Neither offset moves: the panel grows out of the corner it hangs from.
    expect(draggedBox(OPENED, "corner", -200, -100, VIEW)).toEqual({
      ...OPENED,
      width: 584,
      height: 612,
    });
  });

  it("stops at the smallest box and at the margin", async () => {
    const { draggedBox } = await load();

    expect(draggedBox(OPENED, "corner", 500, 500, VIEW)).toEqual(OPENED);
    // Dragged past the far edge: what there is between the anchor and the
    // margin, which for the height is measured from where the panel sits.
    expect(draggedBox(OPENED, "corner", -9000, -9000, VIEW)).toEqual({
      ...OPENED,
      width: VIEW.width - OPENED.right - PANEL_MARGIN,
      height: VIEW.height - OPENED.bottom - PANEL_MARGIN,
    });
  });

  it("moves by the header, and stays inside the window", async () => {
    const { draggedBox } = await load();

    expect(draggedBox(OPENED, "move", -300, -100, VIEW)).toEqual({
      ...OPENED,
      right: 324,
      bottom: 180,
    });
    // Pushed off the bottom right, then off the top left. The size is the
    // reader's and neither push touches it. Downwards it is the launcher's
    // clearance that stops it rather than the margin: that corner is taken.
    expect(draggedBox(OPENED, "move", 9000, 9000, VIEW)).toEqual({
      ...OPENED,
      right: PANEL_MARGIN,
      bottom: LAUNCHER_CLEARANCE,
    });
    expect(draggedBox(OPENED, "move", -9000, -9000, VIEW)).toEqual({
      ...OPENED,
      right: VIEW.width - OPENED.width - PANEL_MARGIN,
      bottom: VIEW.height - OPENED.height - PANEL_MARGIN,
    });
  });

  it("is fitted to the window it is drawn in", async () => {
    const { fittedBox } = await load();

    // The size gives way first, then the corner it hangs from.
    expect(
      fittedBox({ right: 900, bottom: 400, width: 1000, height: 700 }, { width: 1024, height: 768 }),
    ).toEqual({ right: 24, bottom: 80, width: 976, height: 664 });
  });

  it("keeps its own header on screen in a window with no room for it", async () => {
    const { fittedBox } = await load();
    // Shorter than the smallest box the panel can be dragged to: the minimum
    // gives way, or the header — the drag handle, expand and close — is off
    // the top of the window.
    const short = { width: 1280, height: 480 };
    const fit = fittedBox(OPENED, short);

    expect(fit.height).toBe(short.height - LAUNCHER_CLEARANCE - PANEL_MARGIN);
    expect(fit.bottom + fit.height).toBeLessThanOrEqual(short.height - PANEL_MARGIN);
  });

  it("is drawn to fit without the fit being stored", async () => {
    const { panelBox, setPanelBox, usePanelFit } = await load();
    const wide = { right: 900, bottom: 400, width: 1000, height: 700 };
    setPanelBox(wide);

    browser({ width: 1024, height: 768 });

    expect(probe(usePanelFit, panelBox)()).toEqual({
      right: 24,
      bottom: 80,
      width: 976,
      height: 664,
    });
    // A window this one happens to be opened in is not a decision the reader
    // made: the box they dragged out is still theirs on the next visit.
    expect(panelBox()).toEqual(wide);
    expect(entry()).toMatchObject(wide);
  });

  it("is refitted when the window is resized under it", async () => {
    const { panelBox, setPanelBox, usePanelFit } = await load();
    setPanelBox({ ...OPENED, right: 800 });

    const fit = probe(usePanelFit, panelBox);
    expect(fit().right).toBe(800);

    browser({ width: 900, height: 800 });
    await act(async () => {
      window.dispatchEvent(new Event("resize"));
      // The listener is coalesced onto a frame: a window edge being dragged
      // fires faster than the screen is drawn.
      await new Promise((settled) => requestAnimationFrame(settled));
    });

    expect(fit().right).toBe(900 - OPENED.width - PANEL_MARGIN);
  });

  it("survives a window that has no room for it", async () => {
    const { panelBox, setPanelBox, usePanelFit } = await load();
    const wide = { right: 900, bottom: 400, width: 1000, height: 700 };
    setPanelBox(wide);

    browser({ width: 390, height: 844 });

    // A phone draws the panel in the corner the stylesheet puts it in and has
    // no way to drag it out of there: the box is the desktop's, and a visit on
    // a phone must not spend it.
    expect(probe(usePanelFit, panelBox)()).toEqual(wide);
    expect(panelBox()).toEqual(wide);
  });

  it("comes back, beside the panel state, after a reload", async () => {
    const { draggedBox, setPanelBox } = await load();
    setPanelBox(draggedBox(OPENED, "corner", -216, -120, VIEW));

    // The reload: the same storage, every module built again out of it.
    vi.resetModules();
    const { panelBox } = await load();

    expect(entry()).toMatchObject({ panel: "closed", width: 600, height: 632 });
    expect(panelBox()).toEqual({ ...OPENED, width: 600, height: 632 });
  });
});

/** A panel in the document, and the grip a drag is started from. */
interface Docked {
  section: HTMLElement;
  handle: HTMLElement;
}

function docked(): Docked {
  const section = document.createElement("section");
  const handle = document.createElement("div");
  // jsdom implements neither capture nor its release.
  handle.setPointerCapture = () => {};
  section.append(handle);
  document.body.append(section);
  return { section, handle };
}

type Start = (press: Press<HTMLElement>, panel: HTMLElement | null, grip: Grip) => void;

function press(
  start: Start,
  panel: Docked,
  grip: Grip,
  x: number,
  y: number,
  button = 0,
): void {
  start(
    {
      currentTarget: panel.handle,
      clientX: x,
      clientY: y,
      pointerId: 1,
      button,
      isPrimary: true,
      preventDefault() {},
    } as unknown as Press<HTMLElement>,
    panel.section,
    grip,
  );
}

describe("the drag itself", () => {
  it("paints the panel while the pointer is down and stores the box on release", async () => {
    const { panelBox, startPanelDrag } = await load();
    const panel = docked();

    press(startPanelDrag, panel, "left", 800, 400);
    panel.handle.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 600, clientY: 400 }),
    );

    // Nothing is stored yet: a drag does not re-render the transcript per move.
    expect(panel.section.style.getPropertyValue("--panel-width")).toBe("584px");
    expect(panelBox()).toEqual(OPENED);

    panel.handle.dispatchEvent(new PointerEvent("pointerup"));

    expect(panelBox()).toEqual({ ...OPENED, width: 584 });
    expect(entry()).toMatchObject({ width: 584 });
  });

  it("starts from the box on screen, not from one this window cannot draw", async () => {
    const { panelBox, setPanelBox, startPanelDrag } = await load();
    setPanelBox({ right: 900, bottom: 400, width: 1000, height: 700 });
    browser({ width: 1024, height: 768 });
    const panel = docked();

    press(startPanelDrag, panel, "left", 500, 400);
    panel.handle.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 700, clientY: 400 }),
    );
    panel.handle.dispatchEvent(new PointerEvent("pointerup"));

    // Narrowed from the box on screen — not from the stored one, which is
    // wider than this window and would leave the panel 24px off it.
    expect(panelBox()).toEqual({ right: 24, bottom: 80, width: 776, height: 664 });
  });

  it("leaves the stored box alone when the press never moved", async () => {
    const { panelBox, setPanelBox, startPanelDrag } = await load();
    const wide = { right: 900, bottom: 400, width: 1000, height: 700 };
    setPanelBox(wide);
    browser({ width: 1024, height: 768 });
    const panel = docked();

    press(startPanelDrag, panel, "move", 500, 500);
    panel.handle.dispatchEvent(new PointerEvent("pointerup"));

    // A click on the header is not a drag: what it would otherwise store is
    // this window's fit, spending the box dragged out on a wider screen.
    expect(panelBox()).toEqual(wide);
    expect(entry()).toMatchObject(wide);
  });

  it("ignores every button but the first", async () => {
    const { panelBox, startPanelDrag } = await load();
    const panel = docked();

    // A right-click opens the context menu over a pointer that is then never
    // released: a drag started by one would have nothing to end it.
    press(startPanelDrag, panel, "move", 500, 500, 2);
    panel.handle.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100 }),
    );

    expect(panel.section.style.getPropertyValue("--panel-right")).toBe("");
    expect(panelBox()).toEqual(OPENED);
  });

  it("ends with the pointer, and never starts under the breakpoint", async () => {
    const { panelBox, startPanelDrag } = await load();
    const panel = docked();

    press(startPanelDrag, panel, "move", 500, 500);
    panel.handle.dispatchEvent(new PointerEvent("pointerup"));
    panel.handle.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100 }),
    );

    expect(panel.section.style.getPropertyValue("--panel-right")).toBe("");

    browser({ width: 390, height: 844 });
    press(startPanelDrag, panel, "move", 200, 200);
    panel.handle.dispatchEvent(
      new PointerEvent("pointermove", { clientX: 100, clientY: 100 }),
    );

    expect(panel.section.style.getPropertyValue("--panel-right")).toBe("");
    expect(panelBox()).toEqual(OPENED);
  });
});

describe("the expanded panel's reading column", () => {
  const REM = 16;

  it("widens by both edges at once, between 32rem and the pane less a rem a side", async () => {
    const { draggedColumn } = await load();

    // Centred: the edge under the pointer and the one across both move.
    expect(draggedColumn(896, 50, 1400, REM)).toBe(996);
    expect(draggedColumn(896, -9000, 1400, REM)).toBe(32 * REM);
    expect(draggedColumn(896, 9000, 1400, REM)).toBe(1400 - 2 * REM);
  });

  it("is the width it was dragged to after a reload", async () => {
    const { setColumnWidth } = await load();
    setColumnWidth(1000);

    vi.resetModules();
    const { useColumnWidth } = await load();
    let width = 0;
    const Probe = (): null => {
      width = useColumnWidth();
      return null;
    };
    act(() => render(createElement(Probe)));

    expect(width).toBe(1000);
  });
});
