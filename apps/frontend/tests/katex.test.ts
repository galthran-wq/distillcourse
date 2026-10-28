import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { compileLesson } from "@/lib/content/render";
import { expectCurrentKatexClasses, FORMULA } from "./utils/katex";

const require = createRequire(import.meta.url);

describe("KaTeX", () => {
  // rehype-katex declares `katex ^0.16`; the `overrides` entry in package.json
  // is all that holds it to the copy whose stylesheet the layout imports.
  it("is one copy: rehype-katex renders with the KaTeX whose stylesheet the page loads", () => {
    const fromRehype = createRequire(require.resolve("rehype-katex"));

    expect(fromRehype("katex/package.json").version).toBe(
      require("katex/package.json").version,
    );
  });

  it("renders lesson math with the class names the stylesheet styles", async () => {
    const { Content } = await compileLesson(`Inline $x^2$.\n\n$$\n${FORMULA}\n$$\n`);

    expectCurrentKatexClasses(renderToStaticMarkup(createElement(Content)));
  });
});
