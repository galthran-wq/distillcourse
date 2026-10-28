import { colabUrl } from "../labs/mirror";
import type { LoadedCourse, LoadedLesson } from "./load";
import { coursePage, lessonPage } from "./locator";
import { markdownUrl, mdxToMarkdown } from "./markdown-export";
import { SITE_URL, type LessonView } from "./site";
import { isReadable } from "./visibility";

/**
 * The Markdown twin of every course and lesson page (`<page URL>.md`) and the
 * `/llms.txt` index over them: the site as an agent reads it, without React.
 */

export function markdownResponse(text: string): Response {
  return new Response(text, {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}

function lessonLink(course: string, lesson: LoadedLesson): string {
  return `[${lesson.lesson.title}](${markdownUrl(lessonPage(course, lesson.lesson.slug))})`;
}

function contents(course: LoadedCourse): string[] {
  const readable = course.lessons.filter(isReadable);
  return course.course.modules.flatMap((mod) => {
    const lessons = readable.filter((l) => l.moduleSlug === mod.slug);
    if (lessons.length === 0) return [];
    return [
      "",
      `### ${mod.title}`,
      "",
      ...lessons.map((l) => `- ${lessonLink(course.course.slug, l)}: ${l.lesson.goal}`),
    ];
  });
}

export function lessonMarkdown({ course, entry, moduleTitle, prev, next }: LessonView): string {
  const { slug, title, modules } = course.course;
  const lesson = entry.lesson;
  const page = lessonPage(slug, lesson.slug);
  const part = modules.findIndex((m) => m.slug === entry.moduleSlug) + 1;
  const length = lesson.lab !== undefined ? `~${lesson.lab.est_hours} h` : `~${lesson.est_minutes} min`;
  const turns = [
    ...(prev !== undefined ? [`Previous: ${lessonLink(slug, prev)}`] : []),
    ...(next !== undefined ? [`Next: ${lessonLink(slug, next)}`] : []),
  ];
  // The checklist is the lesson's own `lab` block, as LabPanel reads it.
  const lab =
    lesson.lab === undefined
      ? []
      : [
          "",
          `Notebook: ${colabUrl(`${slug}/${lesson.slug}`)}`,
          "",
          "Checkpoints:",
          ...lesson.lab.checkpoints.map(
            (c) => `- \`${c.id}\` (${c.kind}, ${c.required ? "required" : "optional"}): ${c.text}`,
          ),
        ];
  return [
    `# ${lesson.title}`,
    "",
    `> ${lesson.goal}`,
    "",
    `Course: [${title}](${markdownUrl(coursePage(slug))}) · Part ${part}: ${moduleTitle} · ${length}`,
    `HTML: ${SITE_URL}${page}`,
    ...(turns.length > 0 ? [turns.join(" · ")] : []),
    ...lab,
    "",
    mdxToMarkdown(entry.mdx as string, { course, dir: entry.dir, page }),
    "",
  ].join("\n");
}

export function courseMarkdown(course: LoadedCourse): string {
  const page = coursePage(course.course.slug);
  const intro = course.introMdx ?? course.course.intro;
  return [
    `# ${course.course.title}`,
    "",
    `> ${course.course.tagline}`,
    ...(intro !== undefined ? ["", mdxToMarkdown(intro, { course, dir: course.dir, page })] : []),
    "",
    "## Contents",
    ...contents(course),
    "",
  ].join("\n");
}

export function llmsTxt(courses: LoadedCourse[]): string {
  return [
    "# distillcourse",
    "",
    "> Short interactive textbook courses on fundamentals: definitions, theorems, worked " +
      "examples, exercises with full solutions, labs. Interactive models where the subject " +
      "calls for them, labs where it needs code, and a tutor that has read every page.",
    "",
    "Each lesson is available as Markdown at its page URL plus `.md`.",
    ...courses
      .filter((c) => c.lessons.some(isReadable))
      .flatMap((c) => ["", `## ${c.course.title}`, "", c.course.tagline, ...contents(c)]),
    "",
  ].join("\n");
}
