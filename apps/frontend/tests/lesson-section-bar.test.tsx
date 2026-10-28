// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import LessonSectionBar from "@/components/LessonSectionBar";
import type { TocEntry } from "@/lib/content/toc";
import {
  articleProgress,
  clearPosition,
  sectionAt,
  setPosition,
} from "@/lib/lesson/position";
import { mounted, stubResizeObserver } from "./utils/dom";

stubResizeObserver();

const TOC: TocEntry[] = [
  { depth: 2, id: "four-bits", text: "Four bits a letter" },
  { depth: 2, id: "entropy-rate", text: "The entropy rate" },
  { depth: 3, id: "the-ladder", text: "The ladder" },
  { depth: 2, id: "guessing", text: "Shannon's guessing game" },
];

describe("the section a heading sits in", () => {
  it("is the heading itself for a ##, counted among the ##s", () => {
    expect(sectionAt(TOC, "guessing")).toEqual({ ordinal: 3, entry: TOC[3] });
  });

  it("is the ## above it for a ###", () => {
    expect(sectionAt(TOC, "the-ladder")).toEqual({ ordinal: 2, entry: TOC[1] });
  });

  it("is none before the first ##, or for no heading at all", () => {
    const opening: TocEntry[] = [{ depth: 3, id: "aside", text: "Aside" }, ...TOC];

    expect(sectionAt(opening, "aside")).toBeNull();
    expect(sectionAt(TOC, null)).toBeNull();
    expect(sectionAt(TOC, "not-a-heading")).toBeNull();
  });
});

describe("how far through the article the reader is", () => {
  it("is nothing at its top and all of it once its end is on screen", () => {
    expect(articleProgress(120, 3000, 800)).toBe(0);
    expect(articleProgress(0, 3000, 800)).toBe(0);
    expect(articleProgress(-1100, 3000, 800)).toBe(0.5);
    expect(articleProgress(-2200, 3000, 800)).toBe(1);
    expect(articleProgress(-2600, 3000, 800)).toBe(1);
  });

  it("is a number even for an article shorter than the screen", () => {
    expect(articleProgress(0, 500, 800)).toBe(0);
    expect(articleProgress(-40, 500, 800)).toBe(1);
  });
});

// The bar is told the header is gone by an IntersectionObserver jsdom does not
// have; this one reports what a test says, to whichever bar is listening.
let report: (entry: Partial<IntersectionObserverEntry>) => void = () => {};

beforeEach(() => {
  globalThis.IntersectionObserver = class {
    constructor(callback: IntersectionObserverCallback) {
      report = (entry) =>
        callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
    observe(): void {}
    disconnect(): void {}
  } as unknown as typeof IntersectionObserver;
});

afterEach(() => clearPosition("information-theory", "entropy-of-english"));

const page = mounted("article");

function scrolledPast(above: boolean): void {
  act(() =>
    report({
      isIntersecting: false,
      boundingClientRect: { top: above ? -40 : 900 } as DOMRectReadOnly,
    }),
  );
}

function at(anchor: string): void {
  act(() =>
    setPosition({ course: "information-theory", lesson: "entropy-of-english", anchor }),
  );
}

function bar(): HTMLButtonElement | null {
  return page.host().querySelector("button[aria-expanded]");
}

describe("the section bar", () => {
  beforeEach(() => {
    act(() => page.render(<LessonSectionBar number="04" toc={TOC} />));
  });

  it("is absent while the header is on screen", () => {
    act(() => report({ isIntersecting: true, boundingClientRect: { top: 200 } as DOMRectReadOnly }));
    expect(bar()).toBeNull();
    // Below the viewport is not read past.
    scrolledPast(false);
    expect(bar()).toBeNull();
  });

  it("names the section the reader is in once the header is gone", () => {
    at("guessing");
    scrolledPast(true);

    expect(bar()?.textContent).toBe("04 · §3Shannon's guessing game");
    at("the-ladder");
    expect(bar()?.textContent).toBe("04 · §2The entropy rate");
  });

  it("opens the contents and closes on a row, a press outside and Escape", () => {
    at("four-bits");
    scrolledPast(true);
    const open = (): void => act(() => bar()?.click());
    const sheet = (): HTMLElement | null => page.host().querySelector("nav");

    open();
    expect(bar()?.getAttribute("aria-expanded")).toBe("true");
    const rows = [...(sheet()?.querySelectorAll("a") ?? [])];
    expect(rows.map((a) => a.getAttribute("href"))).toEqual(TOC.map((h) => `#${h.id}`));
    expect(sheet()?.querySelector("p")?.textContent).toBe("Contents3 sections");
    expect(rows[0].className).toContain("font-semibold");

    act(() => rows[3].click());
    expect(sheet()).toBeNull();

    open();
    act(() => {
      document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });
    expect(sheet()).toBeNull();

    open();
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(sheet()).toBeNull();
  });
});

describe("a lesson without sections", () => {
  it("has no bar", () => {
    act(() =>
      page.render(
        <LessonSectionBar number="04" toc={[{ depth: 3, id: "aside", text: "Aside" }]} />,
      ),
    );
    scrolledPast(true);

    expect(bar()).toBeNull();
  });
});
