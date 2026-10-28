import { describe, expect, it } from "vitest";
import { figurePrefix, inlineSvg, unscopedSelectors } from "@/lib/content/figure-svg";

const FIGURE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40" aria-labelledby="title">
  <title id="title">An arrow</title>
  <style>.muted { opacity: 0.5; } @media (max-width: 480px) { .muted { opacity: 1; } }</style>
  <defs><marker id="arr"><path d="M0 0 L10 5 L0 10 z"/></marker></defs>
  <line class="muted" x1="0" y1="20" x2="90" y2="20" marker-end="url(#arr)"/>
  <use href="#arr"/>
</svg>`;

function classes(svg: string): Set<string> {
  return new Set([...svg.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(" ")));
}

function ids(svg: string): Set<string> {
  return new Set([...svg.matchAll(/\sid="([^"]*)"/g)].map((m) => m[1]));
}

describe("inlineSvg", () => {
  const a = inlineSvg(FIGURE, figurePrefix("/c/lessons/one", "figures/a.svg"));
  const b = inlineSvg(FIGURE, figurePrefix("/c/lessons/two", "figures/a.svg"));

  it("gives two figures with the same class and id names disjoint ones", () => {
    expect([...classes(a)].filter((c) => classes(b).has(c))).toEqual([]);
    expect([...ids(a)].filter((i) => ids(b).has(i))).toEqual([]);
  });

  it("points each figure's references and selectors at its own elements", () => {
    for (const [svg, prefix] of [[a, "one-a"], [b, "two-a"]]) {
      expect(ids(svg)).toEqual(new Set([`${prefix}__title`, `${prefix}__arr`]));
      expect(svg).toContain(`marker-end="url(#${prefix}__arr)"`);
      expect(svg).toContain(`href="#${prefix}__arr"`);
      expect(svg).toContain(`aria-labelledby="${prefix}__title"`);
      expect(unscopedSelectors(svg, prefix)).toEqual([]);
    }
  });

  it("starts every prefix with a letter, as a selector must", () => {
    expect(figurePrefix("/c/lessons/2d-rotations", "figures/a.svg")).toBe("f2d-rotations-a");
  });

  it("is deterministic", () => {
    expect(inlineSvg(FIGURE, "one-a")).toBe(a);
  });
});

describe("unscopedSelectors", () => {
  const scoped = (css: string) => unscopedSelectors(inlineSvg(`<svg><style>${css}</style></svg>`, "p"), "p");

  it("passes class and id selectors, compound and nested", () => {
    expect(scoped(".a .b, #c > .d:first-child, .e text.f { fill: red }")).toEqual([]);
  });

  it("flags every selector whose subject is not the figure's own", () => {
    expect(scoped("text { fill: red } .a text { fill: red }")).toEqual(["text", ".p__a text"]);
    expect(scoped("@media (max-width: 1px) { * { fill: red } }")).toEqual(["*"]);
    expect(scoped(":root, [fill] { color: red }")).toEqual([":root", "[fill]"]);
  });

  it("flags a <style> that does not parse", () => {
    expect(scoped(".a { fill: red } }")).toEqual(["<style> that does not parse"]);
  });

  it("does not take keyframe stops for selectors", () => {
    expect(scoped("@keyframes k { from { opacity: 0 } 50% { opacity: 1 } }")).toEqual([]);
  });
});
