// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Blocks from "@/components/mdx/Blocks";
import { compileLesson } from "@/lib/content/render";
import { counterLabels } from "./utils/counters";

const { Theorem, Lemma, Proposition, Corollary, Proof } = Blocks;

async function lesson(mdx: string): Promise<string> {
  const { Content } = await compileLesson(mdx);
  return renderToStaticMarkup(createElement(Content, { components: Blocks }));
}

describe("results", () => {
  it("number Lemma, Proposition and Corollary on Theorem's counter", async () => {
    document.body.innerHTML = `<div class="prose-lesson">${await lesson(`
## One

<Theorem>A.</Theorem>

<Lemma>B.</Lemma>

<Corollary>C.</Corollary>

## Two

<Proposition>D.</Proposition>
`)}</div>`;

    expect(counterLabels(document.querySelector(".prose-lesson")!)).toEqual([
      "Theorem 1.1",
      "Lemma 1.2",
      "Corollary 1.3",
      "Proposition 2.1",
    ]);
  });

  it.each([Theorem, Lemma, Proposition, Corollary])(
    "set a nested proof after the statement, not inside it (%o)",
    (Result) => {
      document.body.innerHTML = renderToStaticMarkup(
        <Result title="t">
          <p>Statement.</p>
          <Proof>
            <p>Argument.</p>
          </Proof>
        </Result>,
      );
      const section = document.querySelector("section.env")!;

      expect(section.querySelector("details")).toBeNull();
      expect(section.nextElementSibling?.matches("details.env-proof")).toBe(true);
      expect(section.querySelector(".env-body")!.textContent).toBe("Statement.");
    },
  );

  it("lift the proof out of MDX as authors nest it", async () => {
    document.body.innerHTML = await lesson(`
<Theorem title="range">
Let $X$ be a random variable.

<Proof>
Termwise.
</Proof>
</Theorem>
`);
    const section = document.querySelector("section.env-theorem")!;

    expect(section.querySelector(".env-proof")).toBeNull();
    expect(section.nextElementSibling?.getAttribute("data-toggle")).toBe("proof");
  });

  it("render unchanged without a proof", () => {
    expect(renderToStaticMarkup(<Theorem>Statement.</Theorem>)).toBe(
      '<section class="env env-theorem"><p class="env-head"></p>' +
        '<div class="env-body">Statement.</div></section>',
    );
  });
});
