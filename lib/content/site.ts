import "server-only";
import { join } from "node:path";
import {
  STATUS_RANK,
  loadCourse,
  listCourseDirs,
  type LoadedCourse,
  type LoadedLesson,
} from "./load";

const CONTENT_ROOT = join(process.cwd(), "content");

/**
 * Visibility: production renders `published` lessons only. Dev — and any
 * deployment with CONTENT_PREVIEW=1 (the personal-server staging mode) —
 * also renders `drafted` and `reviewed` so the authoring loop can review in
 * the real site. `planned` lessons are listed as upcoming but never render.
 */
export function previewMode(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.CONTENT_PREVIEW === "1"
  );
}

export function isReadable(lesson: LoadedLesson): boolean {
  const min = previewMode() ? STATUS_RANK.drafted : STATUS_RANK.published;
  return STATUS_RANK[lesson.lesson.status] >= min && lesson.mdx !== undefined;
}

/**
 * Content is immutable within a build process, so the tree is read from disk
 * once per process (React cache() is per-request, which made every generated
 * page re-read everything). Dev skips the memo so MDX edits show on refresh.
 */
let coursesMemo: LoadedCourse[] | undefined;

function readCourses(): LoadedCourse[] {
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
