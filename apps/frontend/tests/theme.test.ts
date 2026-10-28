import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);

const darkPicks = [...css.matchAll(/([^{}]+)\{[^{}]*var\(--shiki-dark\)[^{}]*\}/g)].flatMap(
  (m) => m[1].split(",").map((s) => s.trim()),
);

// The site has one theme model — light unless data-theme="dark" — and a
// second one, however small, is how a code block came to differ from its page.
describe("theme model", () => {
  it("never follows the system scheme", () => {
    expect(css).not.toContain("prefers-color-scheme");
  });

  it("picks Shiki's dark palette only under an explicit dark theme", () => {
    expect(darkPicks.length).toBeGreaterThan(0);
    for (const selector of darkPicks) expect(selector).toMatch(/^:root\[data-theme="dark"\]\s/);
  });
});
