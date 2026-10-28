import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Element } from "hast";
import type { Blockquote, Link, Paragraph, Parent, PhrasingContent, Root, RootContent } from "mdast";
import { assetUrl, slugsFromLessonDir } from "./images";
import { toHast } from "./index-export";
import type { LoadedCourse } from "./load";
import { CONCLUSION_ANCHOR, lessonPage } from "./locator";
import { stringAttr, type MdxJsxNode } from "./mdx-jsx";
import { SITE_URL } from "./site";
import { isReadable } from "./visibility";

/**
 * A lesson's (or a course introduction's) MDX as plain Markdown, for the
 * Markdown twins of the site's pages (./markdown-pages).
 *
 * Converted from the MDX source's mdast rather than from rendered HTML, with
 * every component given a plain-Markdown equivalent here. The numbers the page
 * draws with CSS counters (globals.css) are counted the same way below, so
 * "Theorem 4.1" and "Figure 3" name the same thing in both. A component this
 * file does not map throws: a new one must be given a rendering, never be
 * dropped silently.
 */

/** The twin of a site page: its absolute URL plus `.md` (the llms.txt convention). */
export function markdownUrl(page: string): string {
  return `${SITE_URL}${page}.md`;
}

type Counter = "definition" | "theorem" | "example" | "remark";

// Lemma, Proposition and Corollary count on Theorem's counter, as the page's
// stylesheet numbers them (Theorem 3.1, Lemma 3.2).
const ENVIRONMENTS: Record<string, { counter: Counter; end?: string }> = {
  Definition: { counter: "definition" },
  Theorem: { counter: "theorem" },
  Lemma: { counter: "theorem" },
  Proposition: { counter: "theorem" },
  Corollary: { counter: "theorem" },
  Example: { counter: "example", end: "◇" },
  Remark: { counter: "remark" },
};

const CALLOUTS: Record<string, string> = { KeyFact: "Key fact", Task: "Task", Aside: "Aside" };

const PHRASING = new Set([
  "text",
  "emphasis",
  "strong",
  "delete",
  "inlineCode",
  "inlineMath",
  "link",
  "linkReference",
  "image",
  "imageReference",
  "break",
  "footnoteReference",
  "html",
]);

export interface MarkdownSource {
  course: LoadedCourse;
  /** What the MDX's figures resolve against: the lesson's dir, or the course's for its intro. */
  dir: string;
  /** Site path of the page the MDX renders on, which an interactive figure is pointed at. */
  page: string;
}

interface Walk extends MarkdownSource {
  /** Heading ids by the heading's source offset — rehype-slug's, as on the page. */
  ids: Map<number, string>;
  /** The id of the nearest place above the current node the page can be scrolled to. */
  anchor?: string;
  section: number;
  counters: Record<Counter, number>;
  exercise: number;
  figure: number;
}

type Jsx = MdxJsxNode<RootContent>;

const text = (value: string): PhrasingContent => ({ type: "text", value });
const strong = (value: string): PhrasingContent => ({ type: "strong", children: [text(value)] });
const emphasis = (value: string): PhrasingContent => ({
  type: "emphasis",
  children: [text(value)],
});
const paragraph = (...children: PhrasingContent[]): Paragraph => ({ type: "paragraph", children });
const blockquote = (children: RootContent[]): RootContent => ({
  type: "blockquote",
  children: children as Blockquote["children"],
});
const heading = (value: string): RootContent => ({
  type: "heading",
  depth: 2,
  children: [text(value)],
});

/** A component's children as blocks: a one-line `<Task>Do it.</Task>` holds bare phrasing. */
function blocks(nodes: RootContent[]): RootContent[] {
  const out: RootContent[] = [];
  let run: Paragraph | undefined;
  for (const node of nodes) {
    if (!PHRASING.has(node.type)) {
      out.push(node);
      run = undefined;
      continue;
    }
    if (run === undefined) {
      run = paragraph();
      out.push(run);
    }
    run.children.push(node as PhrasingContent);
  }
  return out;
}

/** The run-in head of a block (`**Theorem 4.1.**`), set into its first paragraph. */
function headed(head: PhrasingContent, body: RootContent[]): RootContent[] {
  const [first, ...rest] = body;
  if (first?.type === "paragraph") {
    return [{ ...first, children: [head, text(" "), ...first.children] }, ...rest];
  }
  return [paragraph(head), ...body];
}

function ended(body: RootContent[], mark: string | undefined): RootContent[] {
  if (mark === undefined) return body;
  const last = body.at(-1);
  if (last?.type === "paragraph") {
    return [...body.slice(0, -1), { ...last, children: [...last.children, text(` ${mark}`)] }];
  }
  return [...body, paragraph(text(mark))];
}

function here(w: Walk): PhrasingContent {
  const url = `${SITE_URL}${w.page}${w.anchor !== undefined ? `#${w.anchor}` : ""}`;
  return { type: "link", url, children: [text(url)] };
}

/**
 * A link an agent can follow from the text alone: a fragment or a
 * root-relative path made absolute, and a course or lesson page sent to its twin.
 */
function absolute(url: string, w: Walk): string {
  if (url.startsWith("#")) return `${markdownUrl(w.page)}${url}`;
  if (!url.startsWith("/")) return url;
  const page = /^(\/courses\/[^/#?]+(?:\/lessons\/[^/#?]+)?)(#.*)?$/.exec(url);
  return page === null ? `${SITE_URL}${url}` : `${markdownUrl(page[1])}${page[2] ?? ""}`;
}

function convertAll(nodes: RootContent[], w: Walk): RootContent[] {
  return nodes.flatMap((node) => convert(node, w));
}

// These render as a closed <details>, whose content the browser hides with
// content-visibility; the style containment that implies scopes every counter
// stepped inside. What is numbered in one does not move the numbers after it
// on the page, so it does not here either.
const FOLDED = new Set(["Proof", "Solution", "Aside"]);

function children(node: Jsx, w: Walk): RootContent[] {
  const saved = FOLDED.has(node.name ?? "")
    ? { counters: { ...w.counters }, exercise: w.exercise, figure: w.figure }
    : undefined;
  const out = blocks(convertAll(node.children ?? [], w));
  if (saved !== undefined) Object.assign(w, saved);
  return out;
}

function convert(node: RootContent, w: Walk): RootContent[] {
  switch (node.type) {
    case "mdxJsxFlowElement":
    case "mdxJsxTextElement":
      return convertJsx(node, w);
    case "mdxjsEsm":
    case "mdxFlowExpression":
    case "mdxTextExpression":
      return [];
    case "heading":
      w.anchor = w.ids.get(node.position?.start.offset ?? -1) ?? w.anchor;
      // h2 is the section counter and resets the environment counters (globals.css).
      if (node.depth === 2) {
        w.section++;
        w.counters = { definition: 0, theorem: 0, example: 0, remark: 0 };
      }
      break;
    case "link":
      return [{ ...node, url: absolute(node.url, w), children: convertAll(node.children, w) as Link["children"] }];
  }
  if ("children" in node) {
    return [{ ...node, children: convertAll((node as Parent).children, w) } as RootContent];
  }
  return [node];
}

function convertJsx(node: Jsx, w: Walk): RootContent[] {
  const name = node.name ?? "";
  const env = ENVIRONMENTS[name];
  if (env !== undefined) {
    const number = `${w.section}.${++w.counters[env.counter]}`;
    const title = stringAttr(node, "title");
    const head = strong(`${name} ${number}${title !== undefined ? ` (${title})` : ""}.`);
    return ended(headed(head, children(node, w)), env.end);
  }
  const callout = CALLOUTS[name];
  if (callout !== undefined) {
    return [blockquote(headed(strong(`${callout}.`), children(node, w)))];
  }
  switch (name) {
    case "Proof":
      return ended(headed(emphasis("Proof."), children(node, w)), "∎");
    case "Exercise":
      return headed(strong(`Exercise ${++w.exercise}.`), children(node, w));
    case "Solution":
      return headed(emphasis("Solution."), children(node, w));
    case "Quote":
      return quote(node, w);
    case "Original":
      return [blockquote(headed(emphasis("Original:"), children(node, w)))];
    case "Figure":
    case "FigureSequence":
    case "Demo":
      return figure(node, w);
    case "References":
      return [heading("References"), ...children(node, w)];
    case "Conclusion":
      w.anchor = CONCLUSION_ANCHOR;
      return [heading("Conclusion"), ...children(node, w)];
    case "Ref":
      return ref(node, w);
  }
  throw new Error(`<${name}> has no Markdown mapping (lib/content/markdown-export.ts)`);
}

/** The passage, its source under it, then the original as a blockquote of its own. */
function quote(node: Jsx, w: Walk): RootContent[] {
  const parts = node.children ?? [];
  const isOriginal = (n: RootContent) =>
    (n.type === "mdxJsxFlowElement" || n.type === "mdxJsxTextElement") && n.name === "Original";
  const source = stringAttr(node, "source");
  const passage = [
    ...blocks(convertAll(parts.filter((n) => !isOriginal(n)), w)),
    ...(source !== undefined ? [paragraph(text(`— ${source}`))] : []),
  ];
  return [
    ...(passage.length > 0 ? [blockquote(passage)] : []),
    ...convertAll(parts.filter(isOriginal), w),
  ];
}

/** Numbered as the page numbers a captioned `<figure>`: a figure or a demo alike. */
function figure(node: Jsx, w: Walk): RootContent[] {
  const caption = stringAttr(node, "caption");
  const label = caption !== undefined ? `Figure ${++w.figure}. ${caption}` : undefined;
  const src = stringAttr(node, "src");
  if (node.name === "Demo") {
    const named = text(`Interactive demo: ${label ?? stringAttr(node, "name")} — `);
    return [paragraph({ type: "emphasis", children: [named, here(w)] })];
  }
  if (node.name === "Figure" && src !== undefined) {
    const slugs = slugsFromLessonDir(w.dir);
    if (slugs === undefined) throw new Error(`${w.dir} is neither a lesson nor a course directory`);
    const image: PhrasingContent = {
      type: "image",
      url: `${SITE_URL}${assetUrl(slugs.course, slugs.lesson, src)}`,
      alt: stringAttr(node, "alt") ?? "",
    };
    return [label !== undefined ? paragraph(image, text("\n"), emphasis(label)) : paragraph(image)];
  }
  return [
    paragraph(
      emphasis(label ?? stringAttr(node, "alt") ?? ""),
      text(" (interactive figure — "),
      here(w),
      text(")"),
    ),
  ];
}

/** The target's title (or the children) linked to its twin; plain text where the page has no link. */
function ref(node: Jsx, w: Walk): RootContent[] {
  const slug = stringAttr(node, "lesson") ?? "";
  const id = stringAttr(node, "id");
  const target = w.course.lessons.find((l) => l.lesson.slug === slug);
  const own = convertAll(node.children ?? [], w) as PhrasingContent[];
  const label = own.length > 0 ? own : [text(target?.lesson.title ?? slug)];
  const out: PhrasingContent[] =
    target === undefined || !isReadable(target)
      ? label
      : [
          {
            type: "link",
            url: `${markdownUrl(lessonPage(w.course.course.slug, slug))}${id !== undefined ? `#${id}` : ""}`,
            children: label as Link["children"],
          },
        ];
  return node.type === "mdxJsxFlowElement" ? [paragraph(...out)] : (out as RootContent[]);
}

function headingIds(source: string): Map<number, string> {
  const ids = new Map<number, string>();
  visit(toHast(source, "mdx"), "element", (node: Element) => {
    const offset = node.position?.start.offset;
    if (/^h[1-6]$/.test(node.tagName) && typeof node.properties.id === "string" && offset !== undefined) {
      ids.set(offset, node.properties.id);
    }
  });
  return ids;
}

const parser = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).use(remarkMath);
const printer = unified()
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkStringify, { bullet: "-", emphasis: "*", strong: "*", fences: true, rule: "-" });

export function mdxToMarkdown(source: string, at: MarkdownSource): string {
  const walk: Walk = {
    ...at,
    ids: headingIds(source),
    section: 0,
    counters: { definition: 0, theorem: 0, example: 0, remark: 0 },
    exercise: 0,
    figure: 0,
  };
  const tree = parser.parse(source);
  const root: Root = { type: "root", children: blocks(convertAll(tree.children, walk)) };
  return printer.stringify(root).trim();
}
