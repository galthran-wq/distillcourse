import { createProcessor } from "@mdx-js/mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * A course introduction cut into the paragraph the course page leads with and
 * the rest it folds away. Cut on the source rather than on a rendered tree so
 * that both halves compile through the very options the whole would; the
 * parser is the one `evaluate` runs, so a `$$` block or a `<Figure>` is never
 * taken for a paragraph. `rest` is empty when the lead is all there is.
 */
export function splitLead(source: string): { lead: string; rest: string } {
  const tree = createProcessor({ remarkPlugins: [remarkGfm, remarkMath] }).parse(source);
  const first = tree.children.find((node) => node.type === "paragraph");
  const start = first?.position?.start.offset;
  const end = first?.position?.end.offset;
  if (start === undefined || end === undefined) return { lead: source, rest: "" };
  return {
    lead: source.slice(start, end),
    rest: `${source.slice(0, start)}${source.slice(end)}`.trim(),
  };
}
