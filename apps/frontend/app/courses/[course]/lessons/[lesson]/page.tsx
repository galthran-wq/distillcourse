import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import type { MDXComponents } from "mdx/types";
import LabPanel from "@/components/labs/LabPanel";
import DemoHost from "@/components/mdx/DemoHost";
import LessonTelemetry from "@/components/LessonTelemetry";
import LessonPosition from "@/components/LessonPosition";
import LessonSectionBar from "@/components/LessonSectionBar";
import LessonToc from "@/components/LessonToc";
import {
  BookmarkToggle,
  LessonRating,
  LessonStateProvider,
} from "@/components/lessons/LessonState";
import SelectionReference from "@/components/lessons/SelectionReference";
import Figure, { type FigureProps } from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import { ImageCredits } from "@/components/mdx/SourcedImage";
import { LABEL_CLASS } from "@/components/ui/styles";
import { loadCredits } from "@/lib/content/credits";
import {
  Aside,
  Conclusion,
  Definition,
  Example,
  Exercise,
  KeyFact,
  Original,
  Quote,
  Proof,
  References,
  Remark,
  Solution,
  Task,
  Theorem,
} from "@/components/mdx/Blocks";
import { lessonKey } from "@/lib/content/locator";
import { compileLesson } from "@/lib/content/render";
import { getCourses, getLessonView, lessonNumber } from "@/lib/content/site";
import { isReadable } from "@/lib/content/visibility";

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
  const { course, entry, moduleTitle, prev, next, total } = view;
  const lesson = entry.lesson;
  const number = lessonNumber(entry);
  // The one name this lesson has on the API — telemetry, rating and bookmark
  // all send it, and the profile looks a row up by it.
  const key = lessonKey(course.course.slug, lesson.slug);

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
    Conclusion,
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
    Quote,
    Original,
  };

  // The ToC is collected during the same render pass that assigns heading
  // ids (rehype-slug), so ToC anchors can never desync from the page.
  const { Content: MDXContent, toc } = await compileLesson(entry.mdx as string);

  return (
    <div className="lesson-grid mx-auto w-full max-w-[calc(42rem+230px+3.5rem+3rem)] px-6 lg:grid lg:grid-cols-[minmax(0,42rem)_230px] lg:justify-center lg:gap-14">
      {/* The locator is the index's, so an event names the same place a
          search hit or a tutor citation does. */}
      <LessonTelemetry lesson={key} />
      {/* Mounted whether or not the lesson has headings: the tutor is told
          which lesson is on screen even when there is no section to name. */}
      <LessonPosition
        course={course.course.slug}
        lesson={lesson.slug}
        headings={toc.map((h) => h.id)}
      />
      <SelectionReference course={course.course.slug} lesson={lesson.slug} />
      <article className="mx-auto min-w-0 max-w-[42rem] lg:mx-0">
        {/* Keyed by the lesson: moving to the next one must not show the
            previous one's bookmark while the new state loads. */}
        <LessonStateProvider key={key} lesson={key}>
          {/* The turn from one lesson to the next is drawn in the stylesheet,
              off the transition type the previous/next link sets. This
              boundary is what asks for a view transition at all: React starts
              one only where a <ViewTransition> is in the committed tree, in a
              development and a production build alike, so a navigation between
              two pages that hold none — /settings to /profile — simply cuts.
              It goes around the title because that is the line naming the
              lesson: the title takes a snapshot of its own and holds still
              (stylesheet: `::view-transition-group(lesson-title)`) while the
              page turns under it.

              Only the lesson-to-lesson pair is worth that snapshot, which is
              what `share` names; entering or leaving the lessons there is no
              other title for it to hold still against, and a box pinned to 0s
              against the page's own cross-fade is a header that pops. */}
          <ViewTransition
            name="lesson-title"
            share="auto"
            enter="none"
            exit="none"
            default="none"
          >
            <header className="border-b border-line pt-[3.25rem] pb-[1.6rem]">
              <p className={LABEL_CLASS}>
                <Link href={`/courses/${course.course.slug}`} className="hover:text-accent">
                  {course.course.title}
                </Link>{" "}
                · {moduleTitle}
              </p>
              <h1 className="mt-3 flex items-baseline gap-3">
                <span className="text-[1.6rem] font-semibold tabular-nums text-accent sm:text-[1.85rem]">
                  {number}
                </span>
                <span className="text-[1.6rem] font-semibold leading-[1.2] tracking-[-0.005em] sm:text-[1.85rem]">
                  {lesson.title}
                </span>
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-base text-faint">
                <span className="italic text-soft">{lesson.goal}</span>
                <span>
                  {lesson.lab !== undefined
                    ? `~${lesson.lab.est_hours} h`
                    : `~${lesson.est_minutes} min`}
                </span>
                <BookmarkToggle />
              </div>
            </header>
          </ViewTransition>
          <LessonSectionBar number={number} toc={toc} />

          <div className="prose-lesson pt-7 pb-10">
            <MDXContent components={components} />
          </div>

          {/* A lab lesson's MDX is the brief; the work it briefs is here. The
              lab is named by the pair the mirror names it by, which is also
              what the checkpoint API takes as its path. */}
          {lesson.lab !== undefined && (
            <LabPanel lab={`${course.course.slug}/${lesson.slug}`} spec={lesson.lab} />
          )}

          <LessonRating />

          {/* Below 640px the next lesson takes the first line to itself: it is
              where a reader at the end is going. */}
          <nav className="mt-12 mb-16 flex items-baseline gap-6 border-t border-ink pt-3 text-[0.93rem] max-sm:flex-wrap max-sm:gap-x-4 max-sm:gap-y-2.5">
            {prev !== undefined && (
              <Link
                href={`/courses/${course.course.slug}/lessons/${prev.lesson.slug}`}
                transitionTypes={["nav-back"]}
                className="group flex min-w-0 items-baseline gap-2 text-soft max-sm:order-2 max-sm:basis-full max-sm:text-[0.85rem]"
              >
                <span className="text-faint">←</span>
                <span className="text-[12px] tabular-nums text-faint">{lessonNumber(prev)}</span>
                <span className="truncate group-hover:text-accent">{prev.lesson.title}</span>
              </Link>
            )}
            <span className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-faint max-sm:hidden">
              {number} of {total}
            </span>
            {next !== undefined && (
              <Link
                href={`/courses/${course.course.slug}/lessons/${next.lesson.slug}`}
                transitionTypes={["nav-forward"]}
                className="group ml-auto flex min-w-0 items-baseline gap-2 font-medium text-ink max-sm:ml-0 max-sm:basis-full"
              >
                <span className="text-[12px] tabular-nums text-faint">{lessonNumber(next)}</span>
                <span className="truncate group-hover:text-accent max-sm:flex-1 max-sm:whitespace-normal">
                  {next.lesson.title}
                </span>
                <span className="text-faint">→</span>
              </Link>
            )}
          </nav>
        </LessonStateProvider>
      </article>

      {toc.length > 0 && (
        <aside className="hidden lg:block">
          <LessonToc toc={toc} />
        </aside>
      )}
    </div>
  );
}
