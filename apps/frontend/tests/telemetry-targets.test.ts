// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  DEMO,
  TOGGLES,
  readingDepth,
  sectionAnchor,
  targetOf,
} from "@/lib/telemetry/targets";

// A lesson's shape as far as targets are concerned: something collapsible
// before the first h2, two proofs in one section (the second nested, as MDX
// wraps it), and a solution in the next.
const LESSON = `
  <p>Opening paragraph.</p>
  <details id="prelude" data-toggle="proof"><summary>Proof</summary></details>
  <h2 id="surprise">Surprise</h2>
  <details id="first" data-toggle="proof"><summary>Proof</summary></details>
  <section><details id="second" data-toggle="proof"><summary>Proof</summary></details></section>
  <h2 id="entropy">Entropy</h2>
  <details id="drill" data-toggle="solution"><summary>Solution</summary></details>
  <figure data-demo="SurprisalSlider"><button id="knob">drag</button></figure>
`;

function element(id: string): Element {
  const found = document.getElementById(id);
  if (found === null) throw new Error(`no #${id} in the fixture`);
  return found;
}

describe("the target a reading event points at", () => {
  beforeEach(() => {
    document.body.innerHTML = LESSON;
  });

  it("has no anchor above the first heading", () => {
    expect(sectionAnchor(element("prelude"))).toBe("");
    expect(targetOf(element("prelude"), "proof", TOGGLES.proof)).toBe("/proof1");
  });

  it("numbers two proofs of one section from one, whatever wraps them", () => {
    expect(targetOf(element("first"), "proof", TOGGLES.proof)).toBe(
      "surprise/proof1",
    );
    expect(targetOf(element("second"), "proof", TOGGLES.proof)).toBe(
      "surprise/proof2",
    );
  });

  it("counts each kind in its own section", () => {
    expect(targetOf(element("drill"), "solution", TOGGLES.solution)).toBe(
      "entropy/solution1",
    );
  });

  it("names a demo by the section it sits in", () => {
    const demo = element("knob").closest(DEMO);
    expect(demo).not.toBeNull();
    expect(targetOf(demo!, "demo", DEMO)).toBe("entropy/demo1");
  });
});

describe("reading depth", () => {
  it("is complete on a page with nothing to scroll", () => {
    expect(readingDepth()).toBe(100);
  });

  it("is how far the bottom of the viewport has reached", () => {
    Object.defineProperty(document.documentElement, "scrollHeight", {
      configurable: true,
      value: 2000,
    });
    window.innerHeight = 500;
    window.scrollY = 500;

    expect(readingDepth()).toBe(50);
  });
});
