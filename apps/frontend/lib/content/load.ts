import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import type { z } from "zod";
import {
  ConceptsFileSchema,
  CourseSchema,
  type ConceptsFile,
  type Course,
  type Lesson,
} from "./schema";

export const STATUS_RANK = {
  planned: 0,
  drafted: 1,
  reviewed: 2,
  published: 3,
} as const;

export interface LoadedLesson {
  lesson: Lesson;
  moduleSlug: string;
  /** Position in overall course order (module order, then lesson order). */
  index: number;
  dir: string;
  mdxPath: string;
  /** Raw lesson text; undefined when the file does not exist. */
  mdx?: string;
}

export interface LoadedCourse {
  dir: string;
  course: Course;
  /** Raw content of intro.mdx when present — the rich course introduction. */
  introMdx?: string;
  concepts: ConceptsFile;
  /** All lessons in course order. */
  lessons: LoadedLesson[];
}

export class ContentError extends Error {
  constructor(
    public file: string,
    message: string,
  ) {
    super(`${file}: ${message}`);
    this.name = "ContentError";
  }
}

export interface LoadedYamlFile<T> {
  /** Parsed and valid; absent when the file is missing or `error` is set. */
  data?: T;
  /** Present but unparsable/invalid; the message the linter reports. */
  error?: string;
  exists: boolean;
}

/**
 * The one read-and-validate for content YAML: missing, unparsable and invalid
 * are three states the caller reports on, never a crash.
 */
export function loadYamlFile<S extends z.ZodType>(
  path: string,
  schema: S,
): LoadedYamlFile<z.infer<S>> {
  if (!existsSync(path)) return { exists: false };
  let raw: unknown;
  try {
    raw = parse(readFileSync(path, "utf8"));
  } catch (err) {
    return {
      exists: true,
      error: `YAML parse error: ${(err as Error).message}`,
    };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { exists: true, error: parsed.error.message };
  return { data: parsed.data, exists: true };
}

/** The course's own YAML, where any of those three states aborts the load. */
function requireYamlFile<S extends z.ZodType>(
  path: string,
  schema: S,
): z.infer<S> {
  const { data, error } = loadYamlFile(path, schema);
  if (data === undefined) {
    throw new ContentError(path, error ?? "file not found");
  }
  return data;
}

/**
 * Loads and schema-validates course.yaml + concepts.yaml, and reads (without
 * validating) each lesson's MDX. MDX validation is lint's job so that one bad
 * lesson file yields a diagnostic instead of aborting the whole load.
 */
export function loadCourse(dir: string): LoadedCourse {
  const coursePath = join(dir, "course.yaml");
  const conceptsPath = join(dir, "concepts.yaml");

  const course = requireYamlFile(coursePath, CourseSchema);
  const concepts = requireYamlFile(conceptsPath, ConceptsFileSchema);

  const introPath = join(dir, "intro.mdx");
  const introMdx = existsSync(introPath)
    ? readFileSync(introPath, "utf8")
    : undefined;
  const lessons: LoadedLesson[] = [];
  let index = 0;
  for (const mod of course.modules) {
    for (const lesson of mod.lessons) {
      const lessonDir = join(dir, "lessons", lesson.slug);
      const mdxPath = join(lessonDir, "lesson.mdx");
      lessons.push({
        lesson,
        moduleSlug: mod.slug,
        index: index++,
        dir: lessonDir,
        mdxPath,
        mdx: existsSync(mdxPath) ? readFileSync(mdxPath, "utf8") : undefined,
      });
    }
  }

  return { dir, course, introMdx, concepts, lessons };
}

/** Lists lesson directories on disk (for orphan detection). */
export function listLessonDirs(courseDir: string): string[] {
  const lessonsDir = join(courseDir, "lessons");
  if (!existsSync(lessonsDir)) return [];
  return readdirSync(lessonsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** Lists course directories under a content root. */
export function listCourseDirs(contentRoot: string): string[] {
  const coursesDir = join(contentRoot, "courses");
  if (!existsSync(coursesDir)) return [];
  return readdirSync(coursesDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(coursesDir, e.name));
}
