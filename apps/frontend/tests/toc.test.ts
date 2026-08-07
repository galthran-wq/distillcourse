import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import { compileLesson } from "@/lib/content/render";
import type { TocEntry } from "@/lib/content/toc";

/**
 * Compiles MDX with the pipeline the lesson page is compiled with — the real
 * one, called rather than restated, so that reordering it here is not
 * something a test can be green about — and returns both the collected entries
 * and the ids that actually ended up on h2/h3/h4 elements in the rendered HTML.
 */
async function run(mdx: string): Promise<{ toc: TocEntry[]; html: string }> {
  const { Content, toc } = await compileLesson(mdx);
  const html = renderToStaticMarkup(
    createElement(Content, {
      components: {
        Aside: ({ children }: { children?: ReactNode }) =>
          createElement("aside", null, children),
      },
    }),
  );
  return { toc, html };
}

function renderedHeadingIds(html: string): { tag: string; id: string }[] {
  return [...html.matchAll(/<h([2-4])[^>]*\bid="([^"]*)"/g)].map((m) => ({
    tag: `h${m[1]}`,
    id: m[2],
  }));
}

describe("rehypeCollectToc", () => {
  it("matches rehype-slug ids for duplicate and JSX-nested headings", async () => {
    const mdx = [
      "## Setup",
      "",
      "Some prose.",
      "",
      "## Setup",
      "",
      "<Aside>",
      "",
      "### Inside a block",
      "",
      "</Aside>",
      "",
      "## Results",
      "",
    ].join("\n");

    const { toc, html } = await run(mdx);

    // Duplicate top-level headings get deduped slugs, and the heading nested
    // inside a JSX block element is collected too — exactly as slugged.
    expect(toc).toEqual([
      { depth: 2, text: "Setup", id: "setup" },
      { depth: 2, text: "Setup", id: "setup-1" },
      { depth: 3, text: "Inside a block", id: "inside-a-block" },
      { depth: 2, text: "Results", id: "results" },
    ]);

    // The ids in the rendered output are exactly the collected ids, in order.
    const rendered = renderedHeadingIds(html).filter(
      (h) => h.tag === "h2" || h.tag === "h3",
    );
    expect(rendered.map((h) => h.id)).toEqual(toc.map((t) => t.id));
  });

  it("ignores non-h2/h3 headings even though rehype-slug slugs them", async () => {
    const mdx = "## Section\n\n#### Deep detail\n";
    const { toc, html } = await run(mdx);

    expect(toc).toEqual([{ depth: 2, text: "Section", id: "section" }]);
    // rehype-slug still assigned the h4 an id in the output...
    expect(renderedHeadingIds(html)).toContainEqual({
      tag: "h4",
      id: "deep-detail",
    });
    // ...but the ToC only tracks h2/h3.
    expect(toc.some((t) => t.id === "deep-detail")).toBe(false);
  });
});
