import { describe, expect, it } from "vitest";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { rehypeCollectToc, type TocEntry } from "@/lib/content/toc";

/**
 * Runs MDX through the same pipeline the lesson page uses (rehype-slug, then
 * the ToC collector) and returns both the collected entries and the ids that
 * actually ended up on h2/h3/h4 elements in the rendered HTML.
 */
async function run(mdx: string): Promise<{ toc: TocEntry[]; html: string }> {
  const toc: TocEntry[] = [];
  const { default: MDXContent } = await evaluate(mdx, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [rehypeCollectToc, { out: toc }],
      rehypeKatex,
      [rehypePrettyCode, { theme: "github-dark-default" }],
    ],
  } as Parameters<typeof evaluate>[1]);

  const html = renderToStaticMarkup(
    createElement(MDXContent, {
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
