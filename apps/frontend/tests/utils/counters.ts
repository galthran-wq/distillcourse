import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The numbered labels globals.css draws before elements — "Theorem 1.1",
 * "Exercise 2", "Figure 3. " — in document order. jsdom computes no counters,
 * so this applies the stylesheet's own counter-reset/counter-increment rules
 * in document order and evaluates the `content` of each matching ::before
 * that names a counter — flat counters except across a closed `details`,
 * every matching counter rule applied
 * and the last matching `content` taken, which is all the lesson's stylesheet
 * relies on. Needs the jsdom environment.
 */
export function counterLabels(root: Element): string[] {
  const style = document.createElement("style");
  style.textContent = readFileSync(join(__dirname, "..", "..", "app", "globals.css"), "utf8");
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
  const before = rules.filter((r) => r.selectorText.endsWith("::before"));
  let counters = new Map<string, number>();
  const labels: string[] = [];
  const walk = (el: Element): void => {
    for (const rule of counting.filter((r) => el.matches(r.selectorText))) {
      const reset = rule.style.getPropertyValue("counter-reset");
      for (const name of reset.split(/\s+/).filter(Boolean)) counters.set(name, 0);
      const inc = rule.style.getPropertyValue("counter-increment");
      for (const name of inc.split(/\s+/).filter(Boolean))
        counters.set(name, (counters.get(name) ?? 0) + 1);
    }
    const content = before
      .filter((r) => el.matches(r.selectorText.replaceAll("::before", "")))
      .map((r) => r.style.getPropertyValue("content"))
      .filter(Boolean)
      .at(-1);
    // A section number alone (h2) or a glyph is not a label.
    if (content !== undefined && content.includes("counter(") && content.includes('"')) {
      labels.push(
        [...content.matchAll(/"([^"]*)"|counter\((\w+)\)/g)]
          .map(([, text, name]) => text ?? String(counters.get(name) ?? 0))
          .join(""),
      );
    }
    // A closed <details> hides its content with content-visibility, whose
    // style containment scopes the counters stepped inside it.
    const scoped = el.tagName === "DETAILS" && !el.hasAttribute("open");
    const outside = new Map(counters);
    for (const child of el.children) walk(child);
    if (scoped) counters = outside;
  };
  walk(root);
  return labels;
}
