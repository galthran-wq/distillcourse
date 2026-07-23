import { z } from "zod";

/**
 * Normative content schemas. `docs/content-model.md` is the human-readable
 * guide — keep the two in sync. Cross-file rules (prerequisite graph, concept
 * resolution) live in `lib/content/lint.ts`; this file only validates the
 * shape of individual files.
 */

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const slug = z.string().regex(SLUG_RE, "must be kebab-case");

export const BLOOM_LEVELS = [
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
] as const;

export const LESSON_TYPES = [
  "core",
  "worked-practice",
  "synthesis",
  "review",
] as const;

export const LESSON_STATUSES = [
  "planned",
  "drafted",
  "reviewed",
  "published",
] as const;

export const COURSE_STATUSES = [
  "planned",
  "in_progress",
  "published",
  "archived",
] as const;

export const OutcomeSchema = z.object({
  id: slug,
  text: z.string().min(1),
  bloom: z.enum(BLOOM_LEVELS),
});

export const DemoSpecSchema = z.object({
  component: z
    .string()
    .regex(/^[A-Z][A-Za-z0-9]*$/, "must be a PascalCase component name"),
  spec: z.string().min(1),
});

export const LessonSchema = z.object({
  slug,
  title: z.string().min(1),
  type: z.enum(LESSON_TYPES),
  status: z.enum(LESSON_STATUSES),
  goal: z.string().min(1),
  /** First line of the lesson: a precise statement of the problem it solves. */
  opening: z.string().min(1),
  est_minutes: z.number().int().positive().max(60),
  prerequisites: z.array(slug).default([]),
  concepts: z.object({
    introduces: z.array(slug).default([]),
    reinforces: z.array(slug).default([]),
  }),
  key_ideas: z.array(z.string().min(1)).min(1).max(5),
  demo: DemoSpecSchema.nullable().default(null),
  notes: z.string().optional(),
});

export const ModuleSchema = z.object({
  slug,
  title: z.string().min(1),
  outcomes: z.array(slug).default([]),
  lessons: z.array(LessonSchema).min(1),
});

/** A course-level prerequisite; `course` optionally links another course. */
export const CoursePrereqSchema = z.object({
  text: z.string().min(1),
  course: slug.optional(),
});

/** A headline result of the course, pointing at the lesson establishing it. */
export const KeyResultSchema = z.object({
  text: z.string().min(1),
  lesson: slug,
});

export const CourseSchema = z.object({
  schema_version: z.literal(1),
  slug,
  title: z.string().min(1),
  tagline: z.string().min(1),
  status: z.enum(COURSE_STATUSES),
  audience: z.string().min(1),
  tone: z.string().min(1),
  /** Short introduction (markdown) shown at the top of the course page. */
  intro: z.string().min(1).optional(),
  prerequisites: z.array(CoursePrereqSchema).default([]),
  key_results: z.array(KeyResultSchema).default([]),
  /** Main sources used to compile the course (course page bibliography). */
  sources: z.array(z.string().min(1)).default([]),
  outcomes: z.array(OutcomeSchema).min(1),
  modules: z.array(ModuleSchema).min(1),
});

export const ConceptSchema = z.object({
  id: slug,
  name: z.string().min(1),
  definition: z.string().min(1),
  introduced_in: slug,
});

export const ConceptsFileSchema = z.object({
  concepts: z.array(ConceptSchema),
});

export type Outcome = z.infer<typeof OutcomeSchema>;
export type DemoSpec = z.infer<typeof DemoSpecSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Module = z.infer<typeof ModuleSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type Concept = z.infer<typeof ConceptSchema>;
export type ConceptsFile = z.infer<typeof ConceptsFileSchema>;
export type CoursePrereq = z.infer<typeof CoursePrereqSchema>;
export type KeyResult = z.infer<typeof KeyResultSchema>;
