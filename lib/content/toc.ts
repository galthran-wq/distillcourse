import { visit } from "unist-util-visit";
import { toString as hastToString } from "hast-util-to-string";
import type { Root, Element } from "hast";

export interface TocEntry {
  depth: 2 | 3;
  text: string;
  id: string;
}

/**
 * Rehype plugin that collects h2/h3 headings — with the ids rehype-slug
 * already assigned — into the array passed as `out`. Because it runs in the
 * same pipeline as (and after) rehype-slug, the collected ids can never
 * desync from the anchors in the rendered page, including headings nested
 * inside JSX block elements and duplicate-title slugs (`intro`, `intro-1`).
 *
 * rehype-slug MUST run before this plugin.
 */
export function rehypeCollectToc({ out }: { out: TocEntry[] }) {
  return (tree: Root): void => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "h2" && node.tagName !== "h3") return;
      const id = node.properties?.id;
      if (typeof id !== "string") return;
      out.push({
        depth: node.tagName === "h2" ? 2 : 3,
        text: hastToString(node),
        id,
      });
    });
  };
}
