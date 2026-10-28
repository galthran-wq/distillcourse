import { createProcessor, evaluate } from "@mdx-js/mdx";
import type { MDXComponents } from "mdx/types";
import * as runtime from "react/jsx-runtime";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// One list for both: the lead is cut on the tree the page then renders, so a
// `$$` block or a `<Figure>` is never taken for a paragraph.
const REMARK = [remarkGfm, remarkMath];

/**
 * A course introduction cut into the paragraph the course page leads with and
 * the rest it folds away. Cut on the source rather than on a rendered tree so
 * that both halves compile through the options the whole would. `rest` is
 * empty when the lead is all there is.
 */
export function splitLead(source: string): { lead: string; rest: string } {
  const tree = createProcessor({ remarkPlugins: REMARK }).parse(source);
  const first = tree.children.find((node) => node.type === "paragraph");
  const start = first?.position?.start.offset;
  const end = first?.position?.end.offset;
  if (start === undefined || end === undefined) return { lead: source, rest: "" };
  return {
    lead: source.slice(start, end),
    rest: `${source.slice(0, start)}${source.slice(end)}`.trim(),
  };
}

export async function compileIntro(
  source: string,
): Promise<React.ComponentType<{ components?: MDXComponents }>> {
  const compiled = await evaluate(source, {
    ...runtime,
    remarkPlugins: REMARK,
    rehypePlugins: [rehypeKatex],
  } as Parameters<typeof evaluate>[1]);
  return compiled.default;
}
