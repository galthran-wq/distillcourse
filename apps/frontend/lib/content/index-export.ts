import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import { visit } from "unist-util-visit";
import type { Root, RootContent, Element } from "hast";
import type { LoadedCourse, LoadedLesson } from "./load";
import { lessonKey, type Corpus } from "./locator";
import { isMdxJsxNode, stringAttr, type MdxJsxNode } from "./mdx-jsx";
import { isReadable } from "./visibility";

/**
 * Builds the search index the backend ingests: one JSON document per chunk of
 * indexable content. It runs the SAME unified pipeline and the same
 * rehype-slug as the lesson page, so the anchors recorded here are physically
 * the ids the rendered page carries — a Python-side MDX parser could only
 * approximate them.
 */

export const INDEX_SCHEMA_VERSION = 1;

// `<corpus>:<path>[#<anchor>]`. The corpora are declared with the locator
// grammar (./locator), because what the tutor may cite and what the site can
// render a citation as are the same list.
export interface IndexDocument {
  corpus: Corpus;
  course_slug: string;
  locator: string;
  title: string;
  breadcrumb: string;
  text: string;
  anchors: string[];
  position: number;
  metadata: Record<string, unknown>;
}

export interface ContentIndex {
  schema_version: number;
  documents: IndexDocument[];
}

const BREADCRUMB_SEP = " › ";

// Research briefs are plain markdown: parsing them as MDX would turn a stray
// `<` or `{` in a note into a syntax error.
function pipeline(format: "mdx" | "md") {
  const parser =
    format === "mdx"
      ? unified().use(remarkParse).use(remarkMdx)
      : unified().use(remarkParse);
  return parser
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
      // The MDX node types, listed inline because remark-rehype's overloads
      // only accept a literal here. They reach hast untouched, so the text
      // extractor is what decides each component's contribution.
      passThrough: [
        "mdxFlowExpression",
        "mdxJsxFlowElement",
        "mdxJsxTextElement",
        "mdxTextExpression",
        "mdxjsEsm",
      ],
    })
    .use(rehypeSlug);
}

function toHast(source: string, format: "mdx" | "md"): Root {
  const processor = pipeline(format);
  return processor.runSync(processor.parse(source)) as Root;
}

// Text-level tags flow inline; everything else ends a block, so prose from two
// paragraphs never gets glued into one word.
const INLINE_TAGS = new Set([
  "a",
  "abbr",
  "b",
  "code",
  "del",
  "em",
  "i",
  "ins",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
  "var",
]);

interface Segment {
  text: string;
  /** Code contributes to the indexed text but never to word_count. */
  code: boolean;
}

/** The MDX nodes remark-rehype passed through, typed against the hast tree. */
type JsxNode = MdxJsxNode<RootContent>;

/** visit() takes a tree, and a chunk is a bare node list. */
function treeOf(nodes: RootContent[]): Root {
  return { type: "root", children: nodes };
}

function extract(nodes: RootContent[], out: Segment[]): void {
  for (const node of nodes) {
    switch (node.type) {
      case "text":
        out.push({ text: node.value, code: false });
        break;
      case "element":
        extractElement(node, out);
        break;
      case "mdxJsxFlowElement":
      case "mdxJsxTextElement":
        extractJsx(node as unknown as JsxNode, out);
        break;
      default:
        // mdx expressions, ESM imports, comments and raw HTML carry no prose.
        break;
    }
  }
}

function extractElement(node: Element, out: Segment[]): void {
  if (node.tagName === "pre") {
    // Code down-weighted: only the opening line (a signature, a header
    // comment) stays searchable, so a long listing cannot outweigh the prose
    // of the chunk that explains it.
    const code: Segment[] = [];
    extract(node.children, code);
    const first = code
      .map((s) => s.text)
      .join("")
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0);
    if (first !== undefined) out.push({ text: `\n\n${first}\n\n`, code: true });
    return;
  }
  if (node.tagName === "br") {
    out.push({ text: "\n", code: false });
    return;
  }
  if (node.tagName === "img") {
    const alt = node.properties?.alt;
    if (typeof alt === "string" && alt !== "") {
      out.push({ text: alt, code: false });
    }
    return;
  }
  const inline = INLINE_TAGS.has(node.tagName);
  if (!inline) out.push({ text: "\n\n", code: false });
  extract(node.children, out);
  if (!inline) out.push({ text: "\n\n", code: false });
}

function extractJsx(node: JsxNode, out: Segment[]): void {
  const name = node.name ?? "";
  if (name === "Demo") return; // an interactive island; it has no prose
  if (name === "Figure" || name === "FigureSequence") {
    // Figure JSX stripped, caption kept: the caption is the sentence the
    // reader is meant to take away, the src/alt plumbing is not content.
    const caption = stringAttr(node, "caption") ?? stringAttr(node, "alt");
    if (caption !== undefined) out.push({ text: `\n\n${caption}\n\n`, code: false });
    return;
  }
  const inline = node.type === "mdxJsxTextElement";
  if (!inline) out.push({ text: "\n\n", code: false });
  extract(node.children ?? [], out);
  if (!inline) out.push({ text: "\n\n", code: false });
}

/**
 * `<Ref lesson="x"/>` renders as the target lesson's title, so the index has
 * to carry that title too — otherwise a sentence that reads "Prefix codes
 * established…" on the page is indexed with a hole in it.
 */
function resolveRefs(nodes: RootContent[], titles: Map<string, string>): void {
  visit(treeOf(nodes), (node: unknown) => {
    if (!isMdxJsxNode(node)) return;
    if (node.name !== "Ref" || (node.children?.length ?? 0) > 0) return;
    const target = stringAttr(node, "lesson") ?? "";
    node.children = [{ type: "text", value: titles.get(target) ?? target }];
  });
}

function render(segments: Segment[]): string {
  return segments
    .map((s) => s.text)
    .join("")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

function proseWordCount(segments: Segment[]): number {
  return countWords(render(segments.filter((s) => !s.code)));
}

function headingText(node: Element): string {
  const segments: Segment[] = [];
  extract(node.children, segments);
  return render(segments);
}

/** Every id rehype-slug put on the subtree — the chunk's usable anchors. */
function anchorsIn(nodes: RootContent[]): string[] {
  const found: string[] = [];
  visit(treeOf(nodes), "element", (node: Element) => {
    if (typeof node.properties?.id === "string") found.push(node.properties.id);
  });
  return found;
}

interface Chunk {
  /** The h2's slug; absent for the material before the first h2. */
  anchor?: string;
  title: string;
  nodes: RootContent[];
}

/**
 * A chunk is an h2 section with its h3 children — the unit a reader (and an
 * agent quoting a locator) treats as one place in the lesson. Material before
 * the first h2 becomes the lesson's own anchorless chunk.
 */
function chunk(root: Root, leadTitle: string): Chunk[] {
  const chunks: Chunk[] = [{ title: leadTitle, nodes: [] }];
  for (const node of root.children) {
    if (node.type === "element" && node.tagName === "h2") {
      const id = node.properties?.id;
      chunks.push({
        anchor: typeof id === "string" ? id : undefined,
        title: headingText(node),
        nodes: [node],
      });
      continue;
    }
    chunks[chunks.length - 1].nodes.push(node);
  }
  // A lesson that opens straight on an h2 has no lead material; every other
  // chunk keeps its anchor even when the section is empty prose, or the
  // anchor would exist on the page and not in the index.
  return chunks.filter(
    (c) => c.anchor !== undefined || render(segmentsOf(c.nodes)) !== "",
  );
}

function segmentsOf(nodes: RootContent[]): Segment[] {
  const segments: Segment[] = [];
  extract(nodes, segments);
  return segments;
}

function countJsx(nodes: RootContent[], name: string): number {
  let total = 0;
  visit(treeOf(nodes), (node: unknown) => {
    if (isMdxJsxNode(node) && node.name === name) total++;
  });
  return total;
}

function lessonDocuments(course: LoadedCourse, entry: LoadedLesson): IndexDocument[] {
  const root = toHast(entry.mdx as string, "mdx");
  resolveRefs(
    root.children,
    new Map(course.lessons.map((l) => [l.lesson.slug, l.lesson.title])),
  );
  const chunks = chunk(root, entry.lesson.title);
  const moduleTitle =
    course.course.modules.find((m) => m.slug === entry.moduleSlug)?.title ?? "";
  const key = lessonKey(course.course.slug, entry.lesson.slug);

  const perChunk = chunks.map((c) => {
    const segments = segmentsOf(c.nodes);
    return { chunk: c, text: render(segments), words: proseWordCount(segments) };
  });
  // Document-level metadata is mirrored onto every chunk so each row answers
  // "how long is this lesson" (#8's completion threshold) on its own.
  const documentWords = perChunk.reduce((sum, c) => sum + c.words, 0);
  const solutions = countJsx(root.children, "Solution");
  const concepts = [
    ...entry.lesson.concepts.introduces,
    ...entry.lesson.concepts.reinforces,
  ];

  return perChunk.map(({ chunk: c, text, words }, position) => ({
    corpus: "lesson" as const,
    course_slug: course.course.slug,
    locator: `${key}${c.anchor !== undefined ? `#${c.anchor}` : ""}`,
    title: c.title,
    breadcrumb: [
      course.course.title,
      moduleTitle,
      entry.lesson.title,
      ...(c.anchor !== undefined ? [c.title] : []),
    ].join(BREADCRUMB_SEP),
    text,
    anchors: anchorsIn(c.nodes),
    position,
    metadata: {
      word_count: words,
      document_word_count: documentWords,
      solutions_total: solutions,
      concepts,
    },
  }));
}

/**
 * Research briefs are indexed per file and regardless of lesson status: they
 * are the harness's working notes, never rendered on the site.
 */
function researchDocuments(course: LoadedCourse): IndexDocument[] {
  const dir = join(course.dir, "research");
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .sort();

  return files.map((file, position) => {
    const stem = basename(file, ".md");
    const root = toHast(readFileSync(join(dir, file), "utf8"), "md");
    const heading = root.children.find(
      (n): n is Element => n.type === "element" && n.tagName === "h1",
    );
    const title = heading !== undefined ? headingText(heading) : stem;
    const text = render(segmentsOf(root.children));
    return {
      corpus: "research" as const,
      course_slug: course.course.slug,
      locator: `research:${course.course.slug}/${stem}`,
      title,
      breadcrumb: [course.course.title, "Research", title].join(BREADCRUMB_SEP),
      text,
      anchors: anchorsIn(root.children),
      position,
      metadata: { word_count: countWords(text) },
    };
  });
}

function conceptDocuments(course: LoadedCourse): IndexDocument[] {
  return course.concepts.concepts.map((concept, position) => ({
    corpus: "concept" as const,
    course_slug: course.course.slug,
    locator: `concept:${course.course.slug}/${concept.id}`,
    title: concept.name,
    breadcrumb: [course.course.title, "Concepts", concept.name].join(BREADCRUMB_SEP),
    text: concept.definition,
    anchors: [],
    position,
    metadata: {
      word_count: countWords(concept.definition),
      introduced_in: concept.introduced_in,
    },
  }));
}

/**
 * The course spine as one document: the modules and lessons in reading order,
 * each lesson with what it needs and what it teaches. The backend knows the
 * courses only through this index, so a structure it cannot read here is a
 * structure the tutor does not have.
 *
 * Only readable lessons are listed, for the same reason they are the only ones
 * indexed: the tutor must not point a learner at a lesson the site will not
 * render.
 */
function courseDocument(course: LoadedCourse): IndexDocument {
  const readable = course.lessons.filter(isReadable);
  const modules = course.course.modules
    .map((mod) => ({
      slug: mod.slug,
      title: mod.title,
      lessons: readable
        .filter((entry) => entry.moduleSlug === mod.slug)
        .map(({ lesson }) => ({
          slug: lesson.slug,
          locator: `lesson:${course.course.slug}/${lesson.slug}`,
          title: lesson.title,
          type: lesson.type,
          est_minutes: lesson.est_minutes,
          prerequisites: lesson.prerequisites,
          introduces: lesson.concepts.introduces,
          reinforces: lesson.concepts.reinforces,
        })),
    }))
    .filter((mod) => mod.lessons.length > 0);

  // Searchable as well as readable: "which course covers channel capacity" is
  // a question the titles answer and the lesson chunks do not.
  const text = [
    course.course.tagline,
    ...modules.map((m) => [m.title, ...m.lessons.map((l) => l.title)].join(BREADCRUMB_SEP)),
  ].join("\n\n");

  return {
    corpus: "course",
    course_slug: course.course.slug,
    locator: `course:${course.course.slug}`,
    title: course.course.title,
    breadcrumb: course.course.title,
    text,
    anchors: [],
    position: 0,
    metadata: { tagline: course.course.tagline, modules },
  };
}

export function courseDocuments(course: LoadedCourse): IndexDocument[] {
  return [
    courseDocument(course),
    ...course.lessons.filter(isReadable).flatMap((l) => lessonDocuments(course, l)),
    ...researchDocuments(course),
    ...conceptDocuments(course),
  ];
}

export function buildIndex(courses: LoadedCourse[]): ContentIndex {
  return {
    schema_version: INDEX_SCHEMA_VERSION,
    documents: courses.flatMap(courseDocuments),
  };
}
