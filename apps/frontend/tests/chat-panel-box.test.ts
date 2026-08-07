// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PointerEvent as Press } from "react";
import type { Grip } from "@/lib/chat/panel-box";
import type { PanelBox } from "@/lib/chat/stored";

/** A desktop window, and the box the panel opens in one corner of it. */
const VIEW = { width: 1280, height: 800 };
const OPENED: PanelBox = { right: 24, bottom: 80, width: 384, height: 512 };
/** What the panel keeps between itself and the edge of the window. */
const MARGIN = 24;

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
 * the previous test's panel.
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
      right: 24,
      bottom: 80,
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
      right: 24,
      bottom: 80,
      width: VIEW.width - 24 - MARGIN,
      height: VIEW.height - 80 - MARGIN,
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
    // reader's and neither push touches it.
    expect(draggedBox(OPENED, "move", 9000, 9000, VIEW)).toEqual({
      ...OPENED,
      right: MARGIN,
      bottom: MARGIN,
    });
    expect(draggedBox(OPENED, "move", -9000, -9000, VIEW)).toEqual({
      ...OPENED,
      right: VIEW.width - OPENED.width - MARGIN,
      bottom: VIEW.height - OPENED.height - MARGIN,
    });
  });

  it("is fitted to the window it is drawn in", async () => {
    const { fitPanelBox, panelBox, setPanelBox } = await load();
    setPanelBox({ right: 900, bottom: 400, width: 1000, height: 700 });

    browser({ width: 1024, height: 768 });
    fitPanelBox();

    // The size gives way first, then the corner it hangs from.
    expect(panelBox()).toEqual({ right: 24, bottom: 44, width: 976, height: 700 });
    expect(entry()).toMatchObject({ width: 976, bottom: 44 });
  });

  it("survives a window that has no room for it", async () => {
    const { fitPanelBox, panelBox, setPanelBox } = await load();
    const wide = { right: 900, bottom: 400, width: 1000, height: 700 };
    setPanelBox(wide);

    browser({ width: 390, height: 844 });
    fitPanelBox();

    // A phone draws the panel in the corner the stylesheet puts it in and has
    // no way to drag it out of there: the box is the desktop's, and a visit on
    // a phone must not spend it.
    expect(panelBox()).toEqual(wide);
  });

  it("comes back, beside the panel state, after a reload", async () => {
    const { draggedBox, setPanelBox } = await load();
    setPanelBox(draggedBox(OPENED, "corner", -216, -120, VIEW));

    // The reload: the same storage, every module built again out of it.
    vi.resetModules();
    const { panelBox } = await load();

    expect(entry()).toMatchObject({ panel: "closed", width: 600, height: 632 });
    expect(panelBox()).toEqual({ right: 24, bottom: 80, width: 600, height: 632 });
  });
});

/** A panel in the document, and the grip a drag is started from. */
function docked(): { section: HTMLElement; handle: HTMLElement } {
  const section = document.createElement("section");
  section.className = "chat-panel";
  const handle = document.createElement("div");
  // jsdom implements neither capture nor its release.
  handle.setPointerCapture = () => {};
  section.append(handle);
  document.body.append(section);
  return { section, handle };
}

function press(
  start: (press: Press<HTMLElement>, grip: Grip) => void,
  handle: HTMLElement,
  grip: Grip,
  x: number,
  y: number,
): void {
  start(
    {
      currentTarget: handle,
      clientX: x,
      clientY: y,
      pointerId: 1,
      preventDefault() {},
    } as unknown as Press<HTMLElement>,
    grip,
  );
}

describe("the drag itself", () => {
  it("paints the panel while the pointer is down and stores the box on release", async () => {
    const { panelBox, startPanelDrag } = await load();
    const { section, handle } = docked();

    press(startPanelDrag, handle, "left", 800, 400);
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: 600, clientY: 400 }));

    // Nothing is stored yet: a drag does not re-render the transcript per move.
    expect(section.style.getPropertyValue("--panel-width")).toBe("584px");
    expect(panelBox()).toEqual(OPENED);

    handle.dispatchEvent(new PointerEvent("pointerup"));

    expect(panelBox()).toEqual({ ...OPENED, width: 584 });
    expect(entry()).toMatchObject({ width: 584 });
  });

  it("ends with the pointer, and never starts under the breakpoint", async () => {
    const { panelBox, startPanelDrag } = await load();
    const { section, handle } = docked();

    press(startPanelDrag, handle, "move", 500, 500);
    handle.dispatchEvent(new PointerEvent("pointerup"));
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 100 }));

    expect(section.style.getPropertyValue("--panel-right")).toBe("");

    browser({ width: 390, height: 844 });
    press(startPanelDrag, handle, "move", 200, 200);
    handle.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 100 }));

    expect(section.style.getPropertyValue("--panel-right")).toBe("");
    expect(panelBox()).toEqual(OPENED);
  });
});
