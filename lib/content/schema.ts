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
  // Advanced off-path chapter (a "starred section"): skippable by
  // construction — lint forbids non-extra lessons from requiring it.
  "extra",
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
  /**
   * The course's argument as an ordered chain of moves (pedagogy L10).
   * Every lesson states its place in this chain; the human curates it.
   */
  spine: z
    .array(
      z.object({
        /** One argument step, declarative ("Selected settlers compounded"). */
        step: z.string().min(1),
        /** Lessons that carry this step, in course order. */
        lessons: z.array(slug).min(1),
      }),
    )
    .default([]),
  /** Main sources used to compile the course (course page bibliography). */
  sources: z.array(z.string().min(1)).default([]),
  outcomes: z.array(OutcomeSchema).min(1),
  modules: z.array(ModuleSchema).min(1),
});

/**
 * Provenance for ONE sourced raster figure (docs/figures.md, third tier).
 * Every .png/.jpg/.webp/.gif in a lesson's `figures/` needs an entry — an
 * image whose origin we cannot state is an image we do not ship.
 */
export const ImageCreditSchema = z.object({
  /** File name inside the lesson's figures/ directory. */
  file: z.string().min(1),
  /** What the image is, in the source's terms. */
  title: z.string().min(1),
  /** Attribution line shown under the figure ("NASA/JPL", "Bell Labs"). */
  credit: z.string().min(1),
  /** Page the image was taken from — the human-readable one, not the raw file. */
  source_url: z.string().url(),
  /** "public domain", "CC BY-SA 4.0", "© Springer — teaching use", … */
  license: z.string().min(1),
  license_url: z.string().url().optional(),
  /** ISO date the file was downloaded. */
  retrieved: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "must be YYYY-MM-DD"),
  /** Where inside the source: "arXiv:2103.00020 p.5 fig.3", "plate VII". */
  located: z.string().optional(),
  /** Everything we did to the file: "cropped to panel b, resized to 1200px". */
  modifications: z.string().optional(),
  /**
   * Render the image on a light card. Line art with a transparent or white
   * background is unreadable on the dark theme without it.
   */
  background: z.enum(["none", "light"]).default("none"),
});

export const CreditsFileSchema = z.object({
  schema_version: z.literal(1),
  images: z.array(ImageCreditSchema),
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
export type ImageCredit = z.infer<typeof ImageCreditSchema>;
export type CreditsFile = z.infer<typeof CreditsFileSchema>;
export type ConceptsFile = z.infer<typeof ConceptsFileSchema>;
export type CoursePrereq = z.infer<typeof CoursePrereqSchema>;
export type KeyResult = z.infer<typeof KeyResultSchema>;
