// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MDXComponents } from "mdx/types";
import * as Blocks from "@/components/mdx/Blocks";
import DemoHost from "@/components/mdx/DemoHost";
import Figure, { type FigureProps } from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import { lessonMarkdown } from "@/lib/content/markdown-pages";
import { compileLesson } from "@/lib/content/render";
import { getLessonView } from "@/lib/content/site";
import { counterLabels } from "./utils/counters";

/** The run-in heads and figure labels of the Markdown twin, as the page writes them. */
function markdownLabels(md: string): string[] {
  return [
    ...md.matchAll(
      /\*\*((?:Definition|Theorem|Lemma|Proposition|Corollary|Example|Remark|Verdict) \d+\.\d+|(?:Postulate|Thesis|Exercise) \d+)[ .]|(Figure \d+\. )/g,
    ),
  ].map((m) => m[1] ?? m[2]);
}

describe("numbering", () => {
  // The second holds a captioned figure inside a <Proof>, which the page does
  // not count past while the proof is closed.
  it.each([
    ["information-theory", "entropy-as-average-surprise"],
    ["classical-ml", "knn-curse"],
  ])("matches the page for %s/%s", async (course, lesson) => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const view = getLessonView(course, lesson)!;
    const { Content } = await compileLesson(view.entry.mdx as string);
    const components = {
      ...Blocks,
      Demo: DemoHost,
      Figure: (props: FigureProps) => <Figure {...props} lessonDir={view.entry.dir} />,
      FigureSequence: (props: { name: string; alt: string; caption?: string }) => (
        <FigureSequence {...props} lessonDir={view.entry.dir} />
      ),
      Ref: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    } as MDXComponents;
    document.body.innerHTML = `<div class="prose-lesson">${renderToStaticMarkup(
      <Content components={components} />,
    )}</div>`;
    const page = counterLabels(document.querySelector(".prose-lesson")!);

    expect(page.filter((l) => l.startsWith("Figure")).length).toBeGreaterThan(5);
    expect(markdownLabels(lessonMarkdown(view))).toEqual(page);
    vi.unstubAllEnvs();
  }, 120_000);
});
