import "server-only";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import type { MDXContent } from "mdx/types";
import type { PluggableList } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { rehypeCollectToc, type TocEntry } from "./toc";

/**
 * The one pipeline a lesson is rendered through. What the site itself has to
 * agree with the anchors on the page about — the table of contents beside it,
 * the section index the `@`-autocomplete offers — comes off a call in here
 * rather than off a pipeline of its own: a second pipeline is a second answer,
 * and the day the two differ the site points readers at anchors that are not
 * there.
 *
 * The content index is not one of them and cannot be: `./index-export` slugs
 * over hast it assembles itself, because what it needs from a lesson is its
 * prose in chunks rather than a component tree. Its anchors are what the
 * backend's search hits point at, so they do have to match these — the shared
 * ground is rehype-slug over the same headings, and nothing here may be
 * reordered around it without that end being read too (CLAUDE.md).
 */

const REMARK = [remarkGfm, remarkMath];

/**
 * rehype-slug assigns the heading ids and the collector reads them off the
 * tree in the same pass, so a collected id is physically the id the page
 * carries. What follows these two is presentation — formulae, highlighted
 * code — and cannot move an id, which is why `lessonToc` below stops here.
 */
function collect(toc: TocEntry[]): PluggableList {
  return [rehypeSlug, [rehypeCollectToc, { out: toc }]];
}

/** The lesson as the page shows it, and the contents collected while compiling it. */
export async function compileLesson(
  mdx: string,
): Promise<{ Content: MDXContent; toc: TocEntry[] }> {
  const toc: TocEntry[] = [];
  const { default: Content } = await evaluate(mdx, {
    ...runtime,
    remarkPlugins: REMARK,
    rehypePlugins: [
      ...collect(toc),
      rehypeKatex,
      [rehypePrettyCode, { theme: "github-dark-default" }],
    ],
  } as Parameters<typeof evaluate>[1]);
  return { Content, toc };
}

/**
 * The contents alone, for the callers that want where the sections are rather
 * than the lesson itself — the section index above all, which runs this over
 * every lesson of every course and would otherwise pay for highlighting code
 * it never renders.
 */
export async function lessonToc(mdx: string): Promise<TocEntry[]> {
  const toc: TocEntry[] = [];
  await evaluate(mdx, {
    ...runtime,
    remarkPlugins: REMARK,
    rehypePlugins: collect(toc),
  } as Parameters<typeof evaluate>[1]);
  return toc;
}
