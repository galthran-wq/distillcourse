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

  it("is nothing at all in a lesson without headings", () => {
    expect(anchorUnder([], VIEWPORT, 0)).toBeNull();
  });
});

const { render } = mounted();

// jsdom has no ResizeObserver and the spy makes one: enough of it to mount,
// and to let a test move the page the way nothing else here can.
const observing = new Set<ResizeObserverCallback>();
class TestResize implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(): void {
    observing.add(this.callback);
  }
  unobserve(): void {
    observing.delete(this.callback);
  }
  disconnect(): void {
    observing.delete(this.callback);
  }
}
globalThis.ResizeObserver = TestResize;

/** The page changing height under a reader who has not touched it. */
function reflow(): void {
  act(() => {
    for (const callback of observing) callback([], new TestResize(() => {}));
  });
}

// jsdom lays nothing out, so the headings are told where they are.
function layout(tops: Record<string, number>, below: number): void {
  for (const [id, top] of Object.entries(tops)) {
    const heading = document.getElementById(id);
    if (heading === null) throw new Error(`no #${id} on the page`);
    heading.getBoundingClientRect = () => ({ top }) as DOMRect;
  }
  Object.defineProperty(document.documentElement, "scrollHeight", {
    value: VIEWPORT + window.scrollY + below,
    configurable: true,
  });
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
  const page = document.createElement("main");

  beforeEach(() => {
    page.innerHTML = `<h2 id="a"></h2><h2 id="b"></h2><h2 id="c"></h2>`;
    document.body.prepend(page);
    window.innerHeight = VIEWPORT;
  });

  afterEach(() => page.remove());

  it("leaves its readers alone while the reader stays in one section", () => {
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
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
    expect(renders).toBe(settled);
  });

  it("reports where the reader is now, not where a band last saw them", () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a", "b", "c");
    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");

    // A scroll that lands mid-section: no heading is anywhere near the top of
    // the viewport, and the reader is under the second one all the same.
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    act(() => window.dispatchEvent(new Event("scroll")));

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
  });

  it("follows the page moving under a reader who has not scrolled", () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a", "b", "c");
    expect(currentLocator()).toBe("lesson:info-theory/entropy#a");

    // A figure above the fold settles into its full height: no scroll, no
    // resize, and the reader is in a different section than a moment ago.
    layout({ a: -2900, b: -800, c: 1600 }, 3000);
    reflow();

    expect(currentLocator()).toBe("lesson:info-theory/entropy#b");
  });

  it("stops reporting once the reader leaves the lesson", () => {
    layout({ a: 500, b: 2600, c: 5000 }, 6000);
    spy("a");
    act(() => render(<></>));

    expect(currentLocator()).toBeNull();
    // A listener or an observer left behind would measure the page the reader
    // has left and put its position back.
    act(() => window.dispatchEvent(new Event("scroll")));
    reflow();

    expect(currentLocator()).toBeNull();
  });
});
