import "server-only";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { loadCourse, listCourseDirs, type LoadedCourse, type LoadedLesson } from "./load";
import { lessonKey } from "./locator";
import { lessonToc } from "./render";
import type { TocEntry } from "./toc";
import { isReadable } from "./visibility";

// content/ lives at the repo ROOT (it is the human curation surface, shared
// with the content factory), while this app lives in apps/frontend — hence the
// climb out. cwd rather than the scripts' __dirname: the Next bundler moves
// this module, so cwd is the only stable anchor, and Next runs with cwd = the
// app directory in dev, build and start. CONTENT_ROOT overrides it for hosts
// that build from somewhere else.
const CONTENT_ROOT =
  process.env.CONTENT_ROOT ?? join(process.cwd(), "..", "..", "content");

/**
 * The public origin, for what has to name the site absolutely: the Markdown
 * export's links (an agent reading a `.md` has no page to resolve a relative
 * one against) and the `<link rel="alternate">` that points at it. Read at
 * build time, since both are prerendered.
 */
export const SITE_URL = (process.env.SITE_URL ?? "https://distillcourse.com").replace(/\/$/, "");

/**
 * Content is immutable within a build process, so the tree is read from disk
 * once per process (React cache() is per-request, which made every generated
 * page re-read everything). Dev skips the memo so MDX edits show on refresh.
 */
let coursesMemo: LoadedCourse[] | undefined;

function readCourses(): LoadedCourse[] {
  // Fail loudly on a wrong cwd. listCourseDirs answers "no courses/" with an
  // empty list, which would let `next build` exit 0 having shipped a site with
  // zero courses — and `npm run validate` cannot catch it, since it resolves
  // content from __dirname instead.
  if (!existsSync(join(CONTENT_ROOT, "courses"))) {
    throw new Error(
      `No courses/ directory under content root ${CONTENT_ROOT} ` +
        `(resolved from cwd ${process.cwd()}). Build with cwd = apps/frontend, ` +
        `or set CONTENT_ROOT to the content directory.`,
    );
  }
  return listCourseDirs(CONTENT_ROOT).map((dir) => loadCourse(dir));
}

export function getCourses(): LoadedCourse[] {
  if (process.env.NODE_ENV === "development") return readCourses();
  coursesMemo ??= readCourses();
  return coursesMemo;
}

export function getCourse(slug: string): LoadedCourse | undefined {
  return getCourses().find((c) => c.course.slug === slug);
}

export interface LessonLink {
  title: string;
  course: string;
  href: string;
}

/**
 * Every readable lesson under the `lesson:` locator the API stores user state
 * against, so a profile row can be named and linked without the backend
 * knowing any of it.
 */
export function getLessonLinks(): Record<string, LessonLink> {
  const links: Record<string, LessonLink> = {};
  for (const course of getCourses()) {
    for (const entry of course.lessons.filter(isReadable)) {
      links[lessonKey(course.course.slug, entry.lesson.slug)] = {
        title: entry.lesson.title,
        course: course.course.title,
        href: `/courses/${course.course.slug}/lessons/${entry.lesson.slug}`,
      };
    }
  }
  return links;
}

/** Every readable lesson's sections, keyed by its `lesson:` locator. */
export type LessonSections = Record<string, TocEntry[]>;

/**
 * Where the sections of every lesson are, for the `@`-autocomplete in the
 * tutor's composer: it offers `course → lesson → section`, and the section it
 * offers has to be a place the page actually has. That is why this is the
 * lesson's own table of contents, off the pipeline the page is compiled with
 * (`./render`) rather than off a parser of its own.
 *
 * Served as one build-time file (`app/content/sections/route.ts`) instead of
 * riding on every page: it is ten times the lesson set and only the composer
 * ever reads it.
 */
export async function getLessonSections(): Promise<LessonSections> {
  const sections: LessonSections = {};
  for (const course of getCourses()) {
    for (const entry of course.lessons.filter(isReadable)) {
      const key = lessonKey(course.course.slug, entry.lesson.slug);
      sections[key] = await lessonToc(entry.mdx as string);
    }
  }
  return sections;
}

/** Every page a lesson has — its HTML and its Markdown twin are generated over the same set. */
export function readableLessonParams(): { course: string; lesson: string }[] {
  return getCourses().flatMap((c) =>
    c.lessons.filter(isReadable).map((l) => ({ course: c.course.slug, lesson: l.lesson.slug })),
  );
}

export interface LessonView {
  course: LoadedCourse;
  entry: LoadedLesson;
  moduleTitle: string;
  prev?: LoadedLesson;
  next?: LoadedLesson;
}

export function getLessonView(
  courseSlug: string,
  lessonSlug: string,
): LessonView | undefined {
  const course = getCourse(courseSlug);
  if (course === undefined) return undefined;
  const entry = course.lessons.find((l) => l.lesson.slug === lessonSlug);
  if (entry === undefined || !isReadable(entry)) return undefined;

  const readable = course.lessons.filter(isReadable);
  const at = readable.findIndex((l) => l.lesson.slug === lessonSlug);
  const moduleTitle =
    course.course.modules.find((m) => m.slug === entry.moduleSlug)?.title ?? "";

  return {
    course,
    entry,
    moduleTitle,
    prev: at > 0 ? readable[at - 1] : undefined,
    next: at < readable.length - 1 ? readable[at + 1] : undefined,
  };
}
