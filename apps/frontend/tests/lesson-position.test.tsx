// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import LessonPosition from "@/components/LessonPosition";
import {
  anchorUnder,
  clearPosition,
  currentLocator,
  setPosition,
  useLessonPosition,
  type HeadingTop,
} from "@/lib/lesson/position";
import { mounted } from "./utils/dom";

// The store is module state on purpose; every lesson this file names is
// cleared so no test inherits another's position.
beforeEach(() => {
  clearPosition("intro", "surprise");
  clearPosition("info-theory", "entropy");
});

describe("the reader's position", () => {
  it("is nothing until a lesson reports one", () => {
    expect(currentLocator()).toBeNull();
  });

  it("names the section in the locator namespace the tools speak", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: "the-average" });

    expect(currentLocator()).toBe("lesson:info-theory/entropy#the-average");
  });

  it("names the lesson alone when it has no headings", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    expect(currentLocator()).toBe("lesson:info-theory/entropy");
  });

  it("keeps the lesson just entered when the previous one unmounts after it", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    clearPosition("intro", "surprise");

    expect(currentLocator()).toBe("lesson:info-theory/entropy");
  });

  it("forgets the lesson the reader left", () => {
    setPosition({ course: "info-theory", lesson: "entropy", anchor: null });

    clearPosition("info-theory", "entropy");

    expect(currentLocator()).toBeNull();
  });
});

const VIEWPORT = 900;
// Heading tops in document order, named s1…sN.
function page(...tops: number[]): HeadingTop[] {
  return tops.map((top, index) => ({ id: `s${index + 1}`, top }));
}

describe("the section on screen", () => {
  it("is the opening one while the reader is still above it", () => {
    expect(anchorUnder(page(600, 2400, 4100), VIEWPORT, 6000)).toBe("s1");
  });

  it("is the last heading the reader has scrolled past", () => {
    expect(anchorUnder(page(-3200, -900, 180), VIEWPORT, 3000)).toBe("s3");
  });

  it("is the one above the reader after a jump that crosses several", () => {
    // A ToC link, a tutor citation followed, a flick: the middle headings are
    // never at any particular height, they are simply gone past.
    expect(anchorUnder(page(-5100, -3300, -400, 2600), VIEWPORT, 4000)).toBe("s3");
  });

  it("moves back with a reader who scrolls up into a section already read", () => {
    expect(anchorUnder(page(-4000, -1600, 500), VIEWPORT, 2000)).toBe("s2");
  });

  it("reaches the closing section, which no scrolling can bring further up", () => {
    // The tail of a lesson — exercises, solutions — is shorter than a screen,
    // so at the foot of the page its heading is still halfway down the
    // viewport and nothing the reader does will raise it.
    expect(anchorUnder(page(-2400, -1100, 560), VIEWPORT, 0)).toBe("s3");
  });

  it("waits for the foot of the page before it does", () => {
    // 200 px of scrolling still left. The closing heading is on screen, but
    // the reader is reading the section above it, which fills the top third of
    // the viewport — and that is the section they are in.
    expect(anchorUnder(page(-2400, -1100, 550), VIEWPORT, 200)).toBe("s2");
  });

  it("is nothing at all in a lesson without headings", () => {
    expect(anchorUnder([], VIEWPORT, 0)).toBeNull();
  });
});

const { render } = mounted();

interface Watch {
  target: Element;
  callback: ResizeObserverCallback;
}

// jsdom has no ResizeObserver and the spy makes one: enough of it to mount,
// and to let a test move the page the way nothing else here can. Keyed on the
// target as well as the callback, so a registration one component leaves
// behind cannot be taken down — or fired — on another's behalf.
const observing = new Set<Watch>();
class TestResize implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element): void {
    observing.add({ target, callback: this.callback });
  }
  unobserve(target: Element): void {
    this.forget((watch) => watch.target === target);
  }
  disconnect(): void {
    this.forget(() => true);
  }
  private forget(match: (watch: Watch) => boolean): void {
    for (const watch of observing) {
      if (watch.callback === this.callback && match(watch)) observing.delete(watch);
    }
  }
}
globalThis.ResizeObserver = TestResize;

// Nothing under test is meant to leave a watch behind, but a leak that did
// would otherwise fire inside a later test's `reflow`.
beforeEach(() => observing.clear());

/**
 * The frame the spy coalesces its measuring into: it answers a scroll, a
 * resize and the observer with one measurement, so nothing it was told about
 * has reached the store until this has run.
 */
async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
}

/** The reader scrolling, and the frame that answers it. */
async function scrolled(): Promise<void> {
  window.dispatchEvent(new Event("scroll"));
  await settle();
}

/** The page changing height under a reader who has not touched it. */
async function reflow(): Promise<void> {
  for (const { callback } of observing) callback([], new TestResize(() => {}));
  await settle();
}

function find(id: string): HTMLElement {
  const heading = document.getElementById(id);
  if (heading === null) throw new Error(`no #${id} on the page`);
  return heading;
}

// A reader partway down a real page: the spy subtracts this back out of the
// document height, and a zero would leave that subtraction unexercised.
const SCROLLED = 1800;

// jsdom lays nothing out, so the headings are told where they are — and that
// they have a box at all, which jsdom denies every element.
function layout(tops: Record<string, number>, below: number): void {
  for (const [id, top] of Object.entries(tops)) {
    const box = { top } as DOMRect;
    find(id).getBoundingClientRect = () => box;
    find(id).getClientRects = () => [box] as unknown as DOMRectList;
  }
  Object.defineProperty(window, "scrollY", { value: SCROLLED, configurable: true });
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: VIEWPORT + SCROLLED + below,
    configurable: true,
  });
}

/** What a browser reports for a heading inside a closed block: no box, and a
 *  top of zero — which is above any reading line. */
function boxless(id: string): void {
  find(id).getBoundingClientRect = () => ({ top: 0 }) as DOMRect;
  find(id).getClientRects = () => [] as unknown as DOMRectList;
}

function spy(...headings: string[]): void {
  act(() =>
    render(
      <LessonPosition course="info-theory" lesson="entropy" headings={headings} />,
    ),
  );
}

describe("the spy on a lesson page", () => {
  // The headings live in a container of their own: the React host `mounted`
  // appended is in the body too, and writing the fixture to `body.innerHTML`
  // would detach it.
  const fixture = document.createElement("main");

  beforeEach(() => {
    fixture.innerHTML = `<h2 id="a"></h2><h2 id="b"></h2><h2 id="c"></h2>`;
    document.body.prepend(fixture);
    window.innerHeight = VIEWPORT;
  });

  afterEach(() => fixture.remove());

  it("leaves its readers alone while the reader stays in one section", async () => {
    let renders = 0;
    function Reader() {
      useLessonPosition();
      renders += 1;
      return null;
    }
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    act(() =>
      render(
        <>
          <LessonPosition course="info-theory" lesson="entropy" headings={["a", "b"]} />
          <Reader />
        </>,
      ),
    );
    const settled = renders;

    // A scroll within the section: measured every time, worth telling the ToC
    // and the chat widget about none of them.
    layout({ a: -3400, b: -1300, c: 1100 }, 2500);
    await scrolled();

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
    expect(renders).toBe(settled);
  });

  it("reports where the reader is now, not where a band last saw them", async () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a", "b", "c");
    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");

    // A scroll that lands mid-section: no heading is anywhere near the top of
    // the viewport, and the reader is under the second one all the same.
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    await scrolled();

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
  });

  it("reaches the closing section only once the page has no further to go", async () => {
    // The tail of a lesson is shorter than a screen, so its heading sits
    // halfway down the viewport at the foot of the page and never rises to the
    // reading line — but a screenful earlier the reader is still above it.
    layout({ a: -2400, b: -1100, c: 560 }, 200);
    spy("a", "b", "c");
    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");

    layout({ a: -2400, b: -1100, c: 560 }, 0);
    await scrolled();

    expect(currentLocator()).toBe("lesson:info-theory/entropy#c");
  });

  it("ignores a heading the page is not showing", () => {
    // The ToC collects headings nested inside blocks, and a proof, a solution
    // and an aside all render closed: an unrendered heading reports a top of
    // zero, which would otherwise outrank the section actually on screen.
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    boxless("b");
    spy("a", "b", "c");

    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");
  });

  it("follows the page moving under a reader who has not scrolled", async () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a", "b", "c");
    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");

    // A figure above the fold settles into its full height: no scroll, no
    // resize, and the reader is in a different section than a moment ago.
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    await reflow();

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
  });

  it("measures once for a gesture that scrolls and reflows together", async () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a", "b", "c");
    let reads = 0;
    find("a").getBoundingClientRect = () => {
      reads += 1;
      return { top: -2900 } as DOMRect;
    };

    // Reading layout once per source would read it three times here, and each
    // read is followed by a write that re-renders the ToC and the chat widget.
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("resize"));
    await reflow();

    expect(reads).toBe(1);
    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");
  });

  it("stops reporting once the reader leaves the lesson", async () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a");
    act(() => render(<></>));

    expect(currentLocator()).toBeNull();
    // A listener or an observer left behind would measure the page the reader
    // has left and put its position back.
    await scrolled();
    await reflow();

    expect(currentLocator()).toBeNull();
  });
});
