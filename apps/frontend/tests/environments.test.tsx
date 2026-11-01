// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Blocks from "@/components/mdx/Blocks";
import { compileLesson } from "@/lib/content/render";
import { counterLabels } from "./utils/counters";

const { Theorem, Lemma, Proposition, Corollary, Proof, Verdict, Postulate, Thesis } = Blocks;

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

describe("graded environments", () => {
  it("number verdicts by section, postulates and theses through the lesson", async () => {
    document.body.innerHTML = `<div class="prose-lesson">${await lesson(`
## One

<Theorem>A.</Theorem>

<Postulate grade="argued">P.</Postulate>

<Verdict grade="strong">B.</Verdict>

<Verdict grade="open">C.</Verdict>

## Two

<Verdict grade="established">D.</Verdict>

<Postulate grade="strong">Q.</Postulate>

<Thesis from="P1, P2">T.</Thesis>
`)}</div>`;

    expect(counterLabels(document.querySelector(".prose-lesson")!)).toEqual([
      "Theorem 1.1",
      "Postulate 1",
      "Verdict 1.1",
      "Verdict 1.2",
      "Verdict 2.1",
      "Postulate 2",
      "Thesis 1",
    ]);
  });

  it("carry the grade in the head and set the tests under the claim", () => {
    document.body.innerHTML = renderToStaticMarkup(
      <Verdict grade="on balance" decidedBy="the record." overturnedBy="a new record.">
        <p>The claim.</p>
      </Verdict>,
    );
    const section = document.querySelector("section.env-verdict")!;

    expect(section.querySelector(".env-head")!.textContent).toBe(" (on balance)");
    expect(section.querySelector(".env-body")!.textContent).toBe("The claim.");
    expect([...section.querySelectorAll(".env-tests > .env-test")].map((t) => t.textContent)).toEqual([
      "Decided by: the record.",
      "Would be overturned by: a new record.",
    ]);
  });

  it("set no tests line when none is given", () => {
    document.body.innerHTML = renderToStaticMarkup(<Verdict grade="open">Unsettled.</Verdict>);

    expect(document.querySelector(".env-tests")).toBeNull();
  });

  it("set a postulate's grounds and a thesis's derivation", () => {
    document.body.innerHTML = renderToStaticMarkup(
      <>
        <Postulate grade="argued" grounds="the argument of §2." overturnedBy="a better one.">
          Order needs a sovereign.
        </Postulate>
        <Thesis grade="on balance" from="P3, P4; Verdicts 15.2, 15.4">
          So it follows.
        </Thesis>
        <Thesis from="P1">Bare.</Thesis>
      </>,
    );
    const [postulate, thesis, bare] = document.querySelectorAll("section.env");

    expect(postulate.querySelector(".env-head")!.textContent).toBe(" (argued)");
    expect(postulate.querySelector(".env-tests")!.textContent).toBe(
      "Grounds: the argument of §2.Would be overturned by: a better one.",
    );
    expect(thesis.querySelector(".env-head")!.textContent).toBe(
      " (on balance; from P3, P4; Verdicts 15.2, 15.4)",
    );
    expect(bare.querySelector(".env-head")!.textContent).toBe(" (from P1)");
    expect(thesis.querySelector(".env-tests")).toBeNull();
  });
});
