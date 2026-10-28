// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Blocks from "@/components/mdx/Blocks";
import { compileLesson } from "@/lib/content/render";

const { Theorem, Lemma, Proposition, Corollary, Proof } = Blocks;

async function lesson(mdx: string): Promise<string> {
  const { Content } = await compileLesson(mdx);
  return renderToStaticMarkup(createElement(Content, { components: Blocks }));
}

/**
 * The labels globals.css draws in front of each environment head. jsdom
 * computes no counters, so this applies the stylesheet's own
 * counter-reset/counter-increment rules in document order and evaluates the
 * `content` of each head's ::before — flat counters, every matching counter
 * rule applied and the last matching `content` taken, which is all the
 * lesson's stylesheet relies on.
 */
function headLabels(root: Element): string[] {
  const style = document.createElement("style");
  style.textContent = readFileSync(join(__dirname, "..", "app", "globals.css"), "utf8");
  document.head.append(style);
  const rules = [...style.sheet!.cssRules].filter(
    (r): r is CSSStyleRule => r instanceof CSSStyleRule,
  );
  style.remove();

  const counting = rules.filter(
    (r) =>
      r.style.getPropertyValue("counter-reset") !== "" ||
      r.style.getPropertyValue("counter-increment") !== "",
  );
  const counters = new Map<string, number>();
  const labels: string[] = [];
  for (const el of [root, ...root.querySelectorAll("*")]) {
    for (const rule of counting.filter((r) => el.matches(r.selectorText))) {
      const reset = rule.style.getPropertyValue("counter-reset");
      for (const name of reset.split(/\s+/).filter(Boolean)) counters.set(name, 0);
      const inc = rule.style.getPropertyValue("counter-increment");
      for (const name of inc.split(/\s+/).filter(Boolean))
        counters.set(name, (counters.get(name) ?? 0) + 1);
    }
    if (!el.classList.contains("env-head")) continue;
    const content = rules
      .filter(
        (r) =>
          r.selectorText.endsWith("::before") &&
          el.matches(r.selectorText.replaceAll("::before", "")),
      )
      .map((r) => r.style.getPropertyValue("content"))
      .filter(Boolean)
      .at(-1);
    if (content === undefined) continue;
    labels.push(
      [...content.matchAll(/"([^"]*)"|counter\((\w+)\)/g)]
        .map(([, text, name]) => text ?? String(counters.get(name) ?? 0))
        .join(""),
    );
  }
  return labels;
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

    expect(headLabels(document.querySelector(".prose-lesson")!)).toEqual([
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
