import { afterEach, describe, expect, it, vi } from "vitest";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import { fileURLToPath } from "node:url";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import { courseDocuments, type IndexDocument } from "@/lib/content/index-export";
import type { LoadedCourse, LoadedLesson } from "@/lib/content/load";

const FIXTURE_DIR = fileURLToPath(new URL("./fixtures/index-course", import.meta.url));

const LESSON_MDX = [
  "The lead paragraph, before any heading.",
  "",
  "## Setup",
  "",
  "Prose in the first section.",
  "",
  "### Nested detail",
  "",
  "A detail with $\\alpha$ inline math.",
  "",
  "## Setup",
  "",
  "<Aside>",
  "",
  "### Inside a block",
  "",
  "Text inside the aside.",
  "",
  "</Aside>",
  "",
  "## Code and figures",
  "",
  "```python",
  "def entropy(p):",
  "    return -sum(x * log2(x) for x in p)",
  "```",
  "",
  '<Figure src="./figures/a.svg" alt="alt text" caption="The caption sentence." />',
  "",
  '<Demo name="Thing" />',
  "",
  '<Ref lesson="other" />' + " opened the question.",
  "",
  "<Exercise>",
  "  <Task>Do it.</Task>",
  "  <Solution>Answer one.</Solution>",
  "</Exercise>",
  "",
  "<Exercise>",
  "  <Task>Do it again.</Task>",
  "  <Solution>Answer two.</Solution>",
  "</Exercise>",
  "",
  "#### Deep heading",
  "",
].join("\n");

function loadedLesson(
  slug: string,
  title: string,
  status: LoadedLesson["lesson"]["status"],
  mdx: string | undefined,
  index: number,
): LoadedLesson {
  return {
    lesson: {
      slug,
      title,
      status,
      type: "core",
      est_minutes: 12,
      prerequisites: index === 0 ? [] : ["main"],
      concepts: { introduces: ["entropy"], reinforces: ["surprisal"] },
    } as LoadedLesson["lesson"],
    moduleSlug: "basics",
    index,
    dir: `${FIXTURE_DIR}/lessons/${slug}`,
    mdxPath: `${FIXTURE_DIR}/lessons/${slug}/lesson.mdx`,
    mdx,
  };
}

function course(lessons: LoadedLesson[]): LoadedCourse {
  return {
    dir: FIXTURE_DIR,
    course: {
      slug: "demo-course",
      title: "Demo Course",
      tagline: "What a demo course is for",
      modules: [
        { slug: "basics", title: "Basics" },
        { slug: "empty", title: "Nothing readable yet" },
      ],
    } as LoadedCourse["course"],
    concepts: {
      concepts: [
        {
          id: "entropy",
          name: "Entropy",
          definition: "Average surprisal of a source, in bits",
          introduced_in: "main",
        },
      ],
    },
    lessons,
  };
}

function exportDocuments(): IndexDocument[] {
  return courseDocuments(
    course([
      loadedLesson("main", "The main lesson", "drafted", LESSON_MDX, 0),
      loadedLesson("other", "The other lesson", "drafted", "Other body.\n", 1),
      loadedLesson("later", "A planned lesson", "planned", undefined, 2),
    ]),
  );
}

function lessonChunks(docs: IndexDocument[], slug: string): IndexDocument[] {
  return docs.filter((d) => d.locator.startsWith(`lesson:demo-course/${slug}`));
}

/** The lesson page's pipeline, verbatim — the reference for the slug gate. */
async function renderedHeadingIds(mdx: string): Promise<string[]> {
  const { default: MDXContent } = await evaluate(mdx, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      rehypeKatex,
      [rehypePrettyCode, { theme: "github-dark-default" }],
    ],
  } as Parameters<typeof evaluate>[1]);

  const passthrough = ({ children }: { children?: ReactNode }) =>
    createElement("div", null, children);
  const html = renderToStaticMarkup(
    createElement(MDXContent, {
      components: {
        Aside: passthrough,
        Exercise: passthrough,
        Task: passthrough,
        Solution: passthrough,
        Ref: passthrough,
        Figure: () => null,
        Demo: () => null,
      },
    }),
  );
  return [...html.matchAll(/<h[1-6][^>]*\bid="([^"]*)"/g)].map((m) => m[1]);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("courseDocuments", () => {
  it("indexes every anchor the rendered page carries, and no other", async () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const anchors = lessonChunks(exportDocuments(), "main").flatMap((d) => d.anchors);

    expect(anchors).toEqual(await renderedHeadingIds(LESSON_MDX));
    // Not vacuous: the adversarial cases are all in there.
    expect(anchors).toContain("setup");
    expect(anchors).toContain("setup-1");
    expect(anchors).toContain("inside-a-block");
    expect(anchors).toContain("deep-heading");
  });

  it("chunks a lesson into its h2 sections, h3s folded into their parent", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const chunks = lessonChunks(exportDocuments(), "main");

    expect(chunks.map((c) => c.locator)).toEqual([
      "lesson:demo-course/main",
      "lesson:demo-course/main#setup",
      "lesson:demo-course/main#setup-1",
      "lesson:demo-course/main#code-and-figures",
    ]);
    expect(chunks.map((c) => c.position)).toEqual([0, 1, 2, 3]);
    // An h3 anchor resolves to the chunk of the h2 containing it.
    expect(chunks[1].anchors).toEqual(["setup", "nested-detail"]);
    expect(chunks[0].text).toBe("The lead paragraph, before any heading.");
    expect(chunks[3].breadcrumb).toBe(
      "Demo Course › Basics › The main lesson › Code and figures",
    );
  });

  it("normalizes figures, demos, code, math and cross-references", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const chunk = lessonChunks(exportDocuments(), "main")[3];

    expect(chunk.text).toContain("The caption sentence."); // caption kept
    expect(chunk.text).not.toContain("figures/a.svg"); // figure JSX stripped
    expect(chunk.text).not.toContain("Thing"); // the demo island has no prose
    expect(chunk.text).toContain("def entropy(p):"); // code down-weighted…
    expect(chunk.text).not.toContain("log2(x)"); // …to its opening line
    expect(chunk.text).toContain("The other lesson opened the question."); // <Ref>
    expect(chunk.text).toContain("Answer one."); // solutions are indexed
    expect(lessonChunks(exportDocuments(), "main")[1].text).toContain("\\alpha");
  });

  it("counts prose words per chunk and per lesson, excluding code", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const chunks = lessonChunks(exportDocuments(), "main");
    const total = chunks.reduce(
      (sum, c) => sum + (c.metadata.word_count as number),
      0,
    );

    expect(chunks[0].metadata.word_count).toBe(6);
    expect(chunks.every((c) => c.metadata.document_word_count === total)).toBe(true);
    expect(chunks[0].metadata.solutions_total).toBe(2);
    expect(chunks[0].metadata.concepts).toEqual(["entropy", "surprisal"]);
    // The code block's second line is not prose and must not inflate the count.
    expect(chunks[3].text.split(/\s+/).length).toBeGreaterThan(
      chunks[3].metadata.word_count as number,
    );
  });

  it("indexes exactly the lessons the site renders", () => {
    const published = courseDocuments(
      course([loadedLesson("main", "The main lesson", "drafted", LESSON_MDX, 0)]),
    );
    expect(published.filter((d) => d.corpus === "lesson")).toEqual([]);

    vi.stubEnv("CONTENT_PREVIEW", "1");
    const preview = exportDocuments();
    expect(lessonChunks(preview, "later")).toEqual([]);
    expect(lessonChunks(preview, "other")).toHaveLength(1);
  });

  it("exports the course spine, listing only the lessons it indexes", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const spine = exportDocuments().find((d) => d.corpus === "course");

    expect(spine?.locator).toBe("course:demo-course");
    expect(spine?.metadata).toEqual({
      tagline: "What a demo course is for",
      modules: [
        {
          slug: "basics",
          title: "Basics",
          lessons: [
            {
              slug: "main",
              locator: "lesson:demo-course/main",
              title: "The main lesson",
              type: "core",
              est_minutes: 12,
              prerequisites: [],
              introduces: ["entropy"],
              reinforces: ["surprisal"],
            },
            {
              slug: "other",
              locator: "lesson:demo-course/other",
              title: "The other lesson",
              type: "core",
              est_minutes: 12,
              prerequisites: ["main"],
              introduces: ["entropy"],
              reinforces: ["surprisal"],
            },
          ],
        },
      ],
    });
    // The planned lesson is not in the spine, and a module with nothing
    // readable in it is not a module the learner can be sent to.
    expect(spine?.text).not.toContain("A planned lesson");
    expect(spine?.text).toContain("What a demo course is for");
  });

  it("mirrors a lab's checkpoints onto its chunks, and only its own", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const lab = loadedLesson("lab", "The lab", "drafted", "A lab brief.\n", 1);
    lab.lesson = {
      ...lab.lesson,
      type: "lab",
      lab: {
        est_hours: 4,
        checkpoints: [
          { id: "one", kind: "exact", text: "Implement one", required: true },
          { id: "two", kind: "metric", text: "Beat the baseline", required: false },
        ],
      },
    };
    const docs = courseDocuments(
      course([loadedLesson("main", "The main lesson", "drafted", LESSON_MDX, 0), lab]),
    );

    expect(lessonChunks(docs, "lab")[0].metadata.lab).toEqual({
      est_hours: 4,
      checkpoints: [
        { id: "one", kind: "exact", text: "Implement one", required: true, order: 0 },
        { id: "two", kind: "metric", text: "Beat the baseline", required: false, order: 1 },
      ],
    });
    for (const chunk of lessonChunks(docs, "main")) {
      expect(chunk.metadata).not.toHaveProperty("lab");
    }
  });

  it("indexes research per file and concepts per entry, whatever the statuses", () => {
    const docs = courseDocuments(course([]));

    expect(docs.filter((d) => d.corpus === "research")).toEqual([
      {
        corpus: "research",
        course_slug: "demo-course",
        locator: "research:demo-course/note",
        title: "A research note",
        breadcrumb: "Demo Course › Research › A research note",
        text: "A research note\n\nOne sentence of background.",
        anchors: ["a-research-note"],
        position: 0,
        metadata: { word_count: 7 },
      },
    ]);
    expect(docs.filter((d) => d.corpus === "concept")).toEqual([
      {
        corpus: "concept",
        course_slug: "demo-course",
        locator: "concept:demo-course/entropy",
        title: "Entropy",
        breadcrumb: "Demo Course › Concepts › Entropy",
        text: "Average surprisal of a source, in bits",
        anchors: [],
        position: 0,
        metadata: { word_count: 7, introduced_in: "main" },
      },
    ]);
  });
});
