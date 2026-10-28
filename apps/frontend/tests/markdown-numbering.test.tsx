// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { MDXComponents } from "mdx/types";
import * as Blocks from "@/components/mdx/Blocks";
import DemoHost from "@/components/mdx/DemoHost";
import Figure, { type FigureProps } from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import { lessonMarkdown } from "@/lib/content/markdown-export";
import { compileLesson } from "@/lib/content/render";
import { getLessonView } from "@/lib/content/site";

/**
 * The numbers the page shows come from CSS counters (globals.css), which no
 * DOM in a test evaluates. So the rendered lesson is counted the way those
 * rules count it — an h2 opens a section and resets the environments, each
 * environment class and every captioned lesson figure steps its counter —
 * and the Markdown twin must carry the same labels in the same order.
 */
const ENV_CLASSES: Record<string, string> = {
  "env-definition": "Definition",
  "env-theorem": "Theorem",
  "env-example": "Example",
  "env-remark": "Remark",
};

function pageLabels(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const labels: string[] = [];
  let section = 0;
  let counters: Record<string, number> = {};
  let exercise = 0;
  let figure = 0;
  for (const el of doc.body.querySelectorAll("*")) {
    if (el.tagName === "H2") {
      section++;
      counters = {};
    }
    const env = Object.keys(ENV_CLASSES).find((c) => el.classList.contains(c));
    if (env !== undefined) {
      counters[env] = (counters[env] ?? 0) + 1;
      labels.push(`${ENV_CLASSES[env]} ${section}.${counters[env]}`);
    }
    if (el.classList.contains("env-exercise")) labels.push(`Exercise ${++exercise}`);
    if (
      el.tagName === "FIGURE" &&
      el.matches("figure:not(.quote, .figure-scroll *, .figure-svg *)") &&
      [...el.children].some((c) => c.tagName === "FIGCAPTION")
    ) {
      labels.push(`Figure ${++figure}`);
    }
  }
  return labels;
}

function markdownLabels(md: string): string[] {
  return [
    ...md.matchAll(/\*\*(Definition|Theorem|Example|Remark) (\d+\.\d+)|\*\*Exercise (\d+)\.|Figure (\d+)\. /g),
  ].map((m) =>
    m[1] !== undefined ? `${m[1]} ${m[2]}` : m[3] !== undefined ? `Exercise ${m[3]}` : `Figure ${m[4]}`,
  );
}

describe("numbering", () => {
  it("matches the page for a lesson with many figures and environments", async () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    const view = getLessonView("information-theory", "entropy-as-average-surprise")!;
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
    const page = pageLabels(renderToStaticMarkup(<Content components={components} />));

    expect(page.filter((l) => l.startsWith("Figure")).length).toBeGreaterThan(5);
    expect(markdownLabels(lessonMarkdown(view))).toEqual(page);
    vi.unstubAllEnvs();
  });
});
