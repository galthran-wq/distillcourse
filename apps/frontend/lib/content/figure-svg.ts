import { readFileSync } from "node:fs";
import { basename, join, normalize } from "node:path";
// The self-contained bundles, not the package entries: those load css-tree's
// data through a JSON require that tsx hands its own ESM transform of the
// JSON under `--conditions=import` (validate, export-index, preview).
import * as csstree from "css-tree/dist/csstree.esm";
import { optimize } from "svgo/browser";

// A raw figure is inlined into the page, so its <style> is a page-wide
// stylesheet and its ids share the page's namespace. Prefixing every class
// and id (with the selectors and references that name them) keeps one
// figure's rules off the rest of the page — KaTeX's spans included.
const DELIM = "__";

const XML_ENTITIES: Record<string, string> = {
  quot: '"',
  apos: "'",
  lt: "<",
  gt: ">",
  amp: "&",
};

/** Deterministic, so server and client renders of a frame agree. */
export function figurePrefix(lessonDir: string, file: string): string {
  return `${basename(lessonDir)}-${basename(file, ".svg")}`
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
}

export function inlineSvg(markup: string, prefix: string): string {
  return optimize(markup, {
    plugins: [
      { name: "prefixIds", params: { prefix, delim: DELIM } },
      {
        // prefixIds renames the <title>/<desc> ids but not the ARIA
        // attributes that point at them.
        name: "prefixAriaRefs",
        fn: () => ({
          element: {
            enter: (node) => {
              for (const attr of ["aria-labelledby", "aria-describedby"]) {
                const ids = node.attributes[attr];
                if (ids === undefined) continue;
                node.attributes[attr] = ids
                  .split(/\s+/)
                  .filter(Boolean)
                  .map((id) => `${prefix}${DELIM}${id}`)
                  .join(" ");
              }
            },
          },
        }),
      },
    ],
  }).data;
}

/** The lesson's raw figure at `rel`, scoped for inlining; null if unreadable. */
export function loadFigureSvg(lessonDir: string, rel: string): string | null {
  const path = normalize(rel.replace(/^\.\//, ""));
  if (path.startsWith("..")) return null;
  let markup: string;
  try {
    markup = readFileSync(join(lessonDir, path), "utf8");
  } catch {
    return null;
  }
  return inlineSvg(markup, figurePrefix(lessonDir, path));
}

/**
 * Selectors in the inlined markup's <style> blocks whose subject is not one
 * of the figure's own (prefixed) classes or ids — the ones that still reach
 * past the figure into the page.
 */
export function unscopedSelectors(markup: string, prefix: string): string[] {
  const own = `${prefix}${DELIM}`;
  const leaks: string[] = [];
  for (const [, body] of markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/g)) {
    // svgo escapes text as XML; inside <svg> the HTML parser decodes it.
    const css = body
      .replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, "")
      .replace(/&(quot|apos|lt|gt|amp);/g, (_m, name: string) => XML_ENTITIES[name]);
    let broken = false;
    const ast = csstree.parse(css, {
      onParseError: () => {
        broken = true;
      },
    });
    if (broken) {
      leaks.push("<style> that does not parse");
      continue;
    }
    csstree.walk(ast, {
      visit: "Rule",
      enter(rule) {
        // Keyframe stops (`from`, `50%`) are not selectors.
        if (this.atrule !== null && /keyframes$/i.test(this.atrule.name)) return;
        if (rule.prelude.type !== "SelectorList") {
          leaks.push(csstree.generate(rule.prelude));
          return;
        }
        rule.prelude.children.forEach((selector) => {
          if (selector.type !== "Selector") return;
          const parts = selector.children.toArray();
          const lastCombinator = parts.findLastIndex((p) => p.type === "Combinator");
          const scoped = parts
            .slice(lastCombinator + 1)
            .some(
              (p) =>
                (p.type === "ClassSelector" || p.type === "IdSelector") &&
                p.name.startsWith(own),
            );
          if (!scoped) leaks.push(csstree.generate(selector));
        });
      },
    });
  }
  return leaks;
}
