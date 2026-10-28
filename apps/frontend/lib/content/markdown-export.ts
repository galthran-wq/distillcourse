import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkStringify from "remark-stringify";
import { visit } from "unist-util-visit";
import type { Element } from "hast";
import type { Blockquote, Link, Paragraph, Parent, PhrasingContent, Root, RootContent } from "mdast";
import { colabUrl } from "../labs/mirror";
import { assetUrl, slugsFromLessonDir } from "./images";
import { toHast } from "./index-export";
import type { LoadedCourse, LoadedLesson } from "./load";
import { CONCLUSION_ANCHOR } from "./locator";
import { stringAttr, type MdxJsxNode } from "./mdx-jsx";
import { SITE_URL, type LessonView } from "./site";
import { isReadable } from "./visibility";

/**
 * The Markdown twin of every course and lesson page (`<page URL>.md`) and the
 * `/llms.txt` index over them: the site as an agent reads it, without React.
 *
 * Converted from the MDX source's mdast rather than from rendered HTML, with
 * every component given a plain-Markdown equivalent here. The numbers the page
 * draws with CSS counters (globals.css) are counted the same way below, so
 * "Theorem 4.1" and "Figure 3" name the same thing in both. A component this
 * file does not map throws: a new one must be given a rendering, never be
 * dropped silently.
 */

export function coursePage(course: string): string {
  return `/courses/${course}`;
}

export function lessonPage(course: string, lesson: string): string {
  return `/courses/${course}/lessons/${lesson}`;
}

/** The twin of a site page: its absolute URL plus `.md` (the llms.txt convention). */
export function markdownUrl(page: string): string {
  return `${SITE_URL}${page}.md`;
}

export function markdownResponse(text: string): Response {
  return new Response(text, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
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

/** The place on the page the current node sits under, as a bare link. */
function here(w: Walk): PhrasingContent {
  const url = `${SITE_URL}${w.page}${w.anchor !== undefined ? `#${w.anchor}` : ""}`;
  return { type: "link", url, children: [text(url)] };
}

/** A root-relative link made absolute; a link to a course or lesson page goes to its twin. */
function absolute(url: string): string {
  if (!url.startsWith("/")) return url;
  const page = /^(\/courses\/[^/#?]+(?:\/lessons\/[^/#?]+)?)(#.*)?$/.exec(url);
  return page === null ? `${SITE_URL}${url}` : `${markdownUrl(page[1])}${page[2] ?? ""}`;
}

function convertAll(nodes: RootContent[], w: Walk): RootContent[] {
  return nodes.flatMap((node) => convert(node, w));
}

function children(node: Jsx, w: Walk): RootContent[] {
  return blocks(convertAll(node.children ?? [], w));
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
      return [{ ...node, url: absolute(node.url), children: convertAll(node.children, w) as Link["children"] }];
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

function lessonLink(course: string, lesson: LoadedLesson): string {
  return `[${lesson.lesson.title}](${markdownUrl(lessonPage(course, lesson.lesson.slug))})`;
}

/** Modules as `###` headings over their readable lessons; a module with none is left out. */
function contents(course: LoadedCourse): string[] {
  const readable = course.lessons.filter(isReadable);
  return course.course.modules.flatMap((mod) => {
    const lessons = readable.filter((l) => l.moduleSlug === mod.slug);
    if (lessons.length === 0) return [];
    return [
      "",
      `### ${mod.title}`,
      "",
      ...lessons.map((l) => `- ${lessonLink(course.course.slug, l)}: ${l.lesson.goal}`),
    ];
  });
}

export function lessonMarkdown({ course, entry, moduleTitle, prev, next }: LessonView): string {
  const { slug, title, modules } = course.course;
  const lesson = entry.lesson;
  const page = lessonPage(slug, lesson.slug);
  const part = modules.findIndex((m) => m.slug === entry.moduleSlug) + 1;
  const length = lesson.lab !== undefined ? `~${lesson.lab.est_hours} h` : `~${lesson.est_minutes} min`;
  const turns = [
    ...(prev !== undefined ? [`Previous: ${lessonLink(slug, prev)}`] : []),
    ...(next !== undefined ? [`Next: ${lessonLink(slug, next)}`] : []),
  ];
  // The checklist is the lesson's own `lab` block, as LabPanel reads it.
  const lab =
    lesson.lab === undefined
      ? []
      : [
          "",
          `Notebook: ${colabUrl(`${slug}/${lesson.slug}`)}`,
          "",
          "Checkpoints:",
          ...lesson.lab.checkpoints.map(
            (c) => `- \`${c.id}\` (${c.kind}, ${c.required ? "required" : "optional"}): ${c.text}`,
          ),
        ];
  return [
    `# ${lesson.title}`,
    "",
    `> ${lesson.goal}`,
    "",
    `Course: [${title}](${markdownUrl(coursePage(slug))}) · Part ${part}: ${moduleTitle} · ${length}`,
    `HTML: ${SITE_URL}${page}`,
    ...(turns.length > 0 ? [turns.join(" · ")] : []),
    ...lab,
    "",
    mdxToMarkdown(entry.mdx as string, { course, dir: entry.dir, page }),
    "",
  ].join("\n");
}

export function courseMarkdown(course: LoadedCourse): string {
  const page = coursePage(course.course.slug);
  const intro = course.introMdx ?? course.course.intro;
  return [
    `# ${course.course.title}`,
    "",
    `> ${course.course.tagline}`,
    ...(intro !== undefined ? ["", mdxToMarkdown(intro, { course, dir: course.dir, page })] : []),
    "",
    "## Contents",
    ...contents(course),
    "",
  ].join("\n");
}

/** The llmstxt.org index: courses in the home page's order, lessons in course order. */
export function llmsTxt(courses: LoadedCourse[]): string {
  return [
    "# distillcourse",
    "",
    "> Short interactive textbook courses on fundamentals: definitions, theorems, worked " +
      "examples, exercises with full solutions, labs. Interactive models where the subject " +
      "calls for them, labs where it needs code, and a tutor that has read every page.",
    "",
    "Each lesson is available as Markdown at its page URL plus `.md`.",
    ...courses
      .filter((c) => c.lessons.some(isReadable))
      .flatMap((c) => ["", `## ${c.course.title}`, "", c.course.tagline, ...contents(c)]),
    "",
  ].join("\n");
}
