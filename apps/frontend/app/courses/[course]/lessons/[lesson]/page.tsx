import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import type { MDXComponents } from "mdx/types";
import DemoHost from "@/components/mdx/DemoHost";
import LessonTelemetry from "@/components/LessonTelemetry";
import LessonToc from "@/components/LessonToc";
import Figure, { type FigureProps } from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import { ImageCredits } from "@/components/mdx/SourcedImage";
import { loadCredits } from "@/lib/content/credits";
import {
  Aside,
  Definition,
  Example,
  Exercise,
  KeyFact,
  Proof,
  References,
  Remark,
  Solution,
  Task,
  Theorem,
} from "@/components/mdx/Blocks";
import { getCourses, getLessonView } from "@/lib/content/site";
import { isReadable } from "@/lib/content/visibility";
import { rehypeCollectToc, type TocEntry } from "@/lib/content/toc";

interface Params {
  course: string;
  lesson: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getCourses().flatMap((c) =>
    c.lessons.filter(isReadable).map((l) => ({
      course: c.course.slug,
      lesson: l.lesson.slug,
    })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const p = await params;
  const view = getLessonView(p.course, p.lesson);
  return { title: view?.entry.lesson.title, description: view?.entry.lesson.goal };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const p = await params;
  const view = getLessonView(p.course, p.lesson);
  if (view === undefined) notFound();
  const { course, entry, moduleTitle, prev, next } = view;
  const lesson = entry.lesson;
  const number = String(entry.index + 1).padStart(2, "0");

  const imageCredits = loadCredits(entry.dir).entries;

  const components: MDXComponents = {
    // Cross-reference to another lesson of the same course: renders the
    // target's title (or custom children) as a link; plain text if the
    // target is not yet readable.
    Ref: ({
      lesson: target,
      id,
      children,
    }: {
      lesson: string;
      id?: string;
      children?: React.ReactNode;
    }) => {
      const t = course.lessons.find((l) => l.lesson.slug === target);
      if (t === undefined) return <span>{children ?? target}</span>;
      const label = children ?? t.lesson.title;
      if (!isReadable(t)) {
        return <span className="text-faint">{label}</span>;
      }
      return (
        <Link
          href={`/courses/${course.course.slug}/lessons/${target}${id !== undefined ? `#${id}` : ""}`}
          className="text-accent underline decoration-line underline-offset-2 hover:decoration-accent"
        >
          {label}
        </Link>
      );
    },
    Demo: DemoHost,
    Figure: (props: FigureProps) => <Figure {...props} lessonDir={entry.dir} />,
    FigureSequence: (props: { name: string; alt: string; caption?: string }) => (
      <FigureSequence {...props} lessonDir={entry.dir} />
    ),
    Definition,
    Theorem,
    Proof,
    Example,
    Remark,
    KeyFact,
    Task,
    Exercise,
    Solution,
    // Sourced images cite themselves at the end of References, not under the
    // figure (docs/figures.md §Sourced images).
    References: (props: { children: React.ReactNode }) => (
      <References
        {...props}
        credits={<ImageCredits credits={imageCredits} />}
      />
    ),
    Aside,
  };

  // The ToC is collected during the same render pass that assigns heading
  // ids (rehype-slug), so ToC anchors can never desync from the page.
  const toc: TocEntry[] = [];
  const { default: MDXContent } = await evaluate(entry.mdx as string, {
    ...runtime,
    remarkPlugins: [remarkGfm, remarkMath],
    rehypePlugins: [
      rehypeSlug,
      [rehypeCollectToc, { out: toc }],
      rehypeKatex,
      [rehypePrettyCode, { theme: "github-dark-default" }],
    ],
  } as Parameters<typeof evaluate>[1]);

  return (
    <div className="lesson-grid mx-auto w-full max-w-7xl px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_230px] lg:gap-14">
      {/* The locator is the index's, so an event names the same place a
          search hit or a tutor citation does. */}
      <LessonTelemetry lesson={`lesson:${course.course.slug}/${lesson.slug}`} />
      <article className="min-w-0">
        <header className="border-b border-line py-10">
          <p className="font-mono text-[11px] uppercase tracking-wider text-faint">
            <Link href={`/courses/${course.course.slug}`} className="hover:text-accent">
              {course.course.title}
            </Link>{" "}
            · {moduleTitle}
          </p>
          <h1 className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-sm text-faint">{number}</span>
            <span className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {lesson.title}
            </span>
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[12px] text-faint">
            <span className="text-soft">{lesson.goal}</span>
            <span>~{lesson.est_minutes} min</span>
          </p>
        </header>

        <div className="prose-lesson py-10">
          <MDXContent components={components} />
        </div>

        <nav className="mb-16 flex items-stretch justify-between gap-4 border-t border-line pt-6">
          {prev !== undefined ? (
            <Link
              href={`/courses/${course.course.slug}/lessons/${prev.lesson.slug}`}
              className="group max-w-[45%]"
            >
              <span className="font-mono text-[11px] tracking-wide text-faint">← previous</span>
              <span className="block font-medium leading-snug group-hover:text-accent">
                {prev.lesson.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next !== undefined ? (
            <Link
              href={`/courses/${course.course.slug}/lessons/${next.lesson.slug}`}
              className="group max-w-[45%] text-right"
            >
              <span className="font-mono text-[11px] tracking-wide text-faint">next →</span>
              <span className="block font-medium leading-snug group-hover:text-accent">
                {next.lesson.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      {toc.length > 0 && (
        <aside className="hidden lg:block">
          <LessonToc toc={toc} />
        </aside>
      )}
    </div>
  );
}
