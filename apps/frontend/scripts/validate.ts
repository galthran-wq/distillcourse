#!/usr/bin/env tsx
/**
 * Content validator: `npm run validate [-- <course> [<lesson>]]`
 *
 * Schema-validates and pedagogy-lints everything under content/courses/.
 * Exit code 1 on any error-level diagnostic. Every authoring skill must run
 * this after generating content and fix failures before reporting done.
 *
 * The npm script runs this via `tsx --conditions=import`: lint.ts imports
 * the ESM-only @mdx-js/mdx (whose dep estree-walker exports no `require`
 * condition), and the extra condition lets tsx's CJS transform resolve it.
 */
import { basename, join, relative } from "node:path";
import { existsSync } from "node:fs";
import {
  ContentError,
  listCourseDirs,
  listLessonDirs,
  loadCourse,
} from "../lib/content/load";
import { lintCourse, type Diagnostic } from "../lib/content/lint";
import { appRoot, contentRoot, repoRoot } from "./paths";

const [courseArg, lessonArg] = process.argv.slice(2);

function report(diags: Diagnostic[]): { errors: number; warns: number } {
  let errors = 0;
  let warns = 0;
  for (const d of diags) {
    if (d.level === "error") errors++;
    else warns++;
    const path = relative(repoRoot, d.file);
    console.log(`  ${d.level === "error" ? "✗" : "⚠"} [${d.rule}] ${path}: ${d.message}`);
  }
  return { errors, warns };
}

let courseDirs = listCourseDirs(contentRoot);
if (courseArg !== undefined) {
  const dir = join(contentRoot, "courses", courseArg);
  if (!existsSync(dir)) {
    console.error(`No such course: ${courseArg} (${relative(repoRoot, dir)})`);
    process.exit(1);
  }
  courseDirs = [dir];
}

if (courseDirs.length === 0) {
  console.log("No courses under content/courses/ — nothing to validate.");
  process.exit(0);
}

let totalErrors = 0;
let totalWarns = 0;

for (const dir of courseDirs) {
  const name = basename(dir);
  let diags: Diagnostic[];
  try {
    const loaded = loadCourse(dir);
    diags = lintCourse(loaded, {
      appRoot,
      lessonDirsOnDisk: listLessonDirs(dir),
      allCourseSlugs: listCourseDirs(contentRoot).map((d) => basename(d)),
    });
    if (lessonArg !== undefined) {
      const lessonPrefix = join(dir, "lessons", lessonArg);
      diags = diags.filter(
        (d) => d.file.startsWith(lessonPrefix) || d.file.endsWith("course.yaml"),
      );
    }
  } catch (err) {
    if (err instanceof ContentError) {
      diags = [
        {
          level: "error",
          rule: "course-schema",
          file: err.file,
          message: err.message,
        },
      ];
    } else {
      throw err;
    }
  }

  const { errors, warns } = report(diags);
  totalErrors += errors;
  totalWarns += warns;
  console.log(
    `${errors === 0 ? "✓" : "✗"} ${name}: ${errors} error(s), ${warns} warning(s)`,
  );
}

process.exit(totalErrors > 0 ? 1 : 0);
