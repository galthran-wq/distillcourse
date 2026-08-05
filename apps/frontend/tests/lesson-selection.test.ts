// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  BUTTON_HEIGHT,
  buttonPosition,
  selectedPassage,
  type Passage,
} from "@/lib/lesson/selection";

// A lesson as far as a selection is concerned: prose under two headings, and
// the surrounding page, which is not the material.
const PAGE = `
  <header><p id="goal">What entropy measures</p></header>
  <div class="prose-lesson">
    <p id="lead">Opening paragraph.</p>
    <h2 id="surprise">Surprise</h2>
    <p id="first">A rare outcome carries more information.</p>
    <h2 id="the-average">The average</h2>
    <p id="second">The entropy is the
       average surprisal.</p>
  </div>
`;

function select(id: string): void {
  const node = document.getElementById(id);
  if (node === null) throw new Error(`no #${id} in the fixture`);
  const range = document.createRange();
  range.selectNodeContents(node);
  const selection = window.getSelection();
  selection?.removeAllRanges();
  selection?.addRange(range);
}

beforeEach(() => {
  document.body.innerHTML = PAGE;
  window.getSelection()?.removeAllRanges();
  // jsdom does no layout, so a range cannot measure itself; the button's
  // position is the only thing that reads these.
  Range.prototype.getBoundingClientRect = () =>
    ({ top: 120, bottom: 140, left: 40, width: 60 }) as DOMRect;
});

describe("the passage a reader selects", () => {
  it("is located by the section it sits in", () => {
    select("first");

    expect(selectedPassage("info-theory", "entropy")?.locator).toBe(
      "lesson:info-theory/entropy#surprise",
    );
  });

  it("names the lesson alone above the first heading", () => {
    select("lead");

    expect(selectedPassage("info-theory", "entropy")?.locator).toBe(
      "lesson:info-theory/entropy",
    );
  });

  it("is one line, so the quote around it cannot end early", () => {
    select("second");

    expect(selectedPassage("info-theory", "entropy")?.text).toBe(
      "The entropy is the average surprisal.",
    );
  });

  it("is nothing when the selection is outside the material", () => {
    select("goal");

    expect(selectedPassage("info-theory", "entropy")).toBeNull();
  });

  it("is nothing when nothing is selected", () => {
    expect(selectedPassage("info-theory", "entropy")).toBeNull();
  });
});

function at(top: number, bottom: number): Passage {
  return { text: "quoted", locator: "lesson:info-theory/entropy", top, bottom, left: 70 };
}

describe("the button that offers the passage", () => {
  const height = window.innerHeight;

  it("sits above the selection when there is room", () => {
    expect(buttonPosition(at(120, 140)).top).toBe(120 - 8 - BUTTON_HEIGHT);
  });

  it("flips below a selection that starts off the top of the viewport", () => {
    // What a downward drag past the fold leaves: the browser scrolled the
    // start of the selection out of sight while the pointer was held.
    expect(buttonPosition(at(-260, 300)).top).toBe(308);
  });

  it("stays in the viewport when the selection covers the whole of it", () => {
    const top = buttonPosition(at(-100, height + 200)).top;

    expect(top).toBeLessThanOrEqual(height - BUTTON_HEIGHT);
    expect(top).toBeGreaterThanOrEqual(0);
  });

  it("stays in the viewport when the selection is entirely above it", () => {
    expect(buttonPosition(at(-400, -300)).top).toBe(8);
  });
});
