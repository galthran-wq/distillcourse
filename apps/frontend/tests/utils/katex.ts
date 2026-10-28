import { expect } from "vitest";

/**
 * KaTeX 0.18 renamed its layout classes (`base` → `katex-base`, `sizing` →
 * `katex-sizing`, …) and its stylesheet styles only the new names, so HTML
 * from an older copy under the page's `katex.min.css` wraps inline math and
 * sets scripts at full size. Each formula below exercises one renamed class:
 * a superscript, a root, an accent, a bar, an equation tag.
 */
export const FORMULA = "\\sqrt[3]{x^2} + \\hat{y} + \\overline{z} \\tag{1}";

const RENAMED = ["base", "strut", "sizing", "root", "accent", "overline", "tag"];

/** Fails unless the math in `html` carries the 0.18 class names and none of the old ones. */
export function expectCurrentKatexClasses(html: string): void {
  const found = new Set(
    [...html.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)),
  );
  for (const name of RENAMED) {
    expect(found).toContain(`katex-${name}`);
    expect(found).not.toContain(name);
  }
}
