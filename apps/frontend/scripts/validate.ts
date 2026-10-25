#!/usr/bin/env tsx
/**
 * Content validator: `npm run validate [-- <course> [<lesson>]] [--no-labs]`
 *
 * Schema-validates and pedagogy-lints everything under content/courses/, and
 * builds every drafted lab in check mode — a lab whose reference solution is
 * not green is invalid content, exactly like unparsable MDX. `--no-labs` is
 * for the image build alone: `make deploy` runs the labs on the host before
 * it, so the gate holds without a second execution inside the image. Exit code 1 on
 * any error-level diagnostic. Every authoring skill must run this after
 * generating content and fix failures before reporting done.
 *
 * The npm script runs this via `tsx --conditions=import`: lint.ts imports
 * the ESM-only @mdx-js/mdx (whose dep estree-walker exports no `require`
 * condition), and the extra condition lets tsx's CJS transform resolve it.
 */
import { basename, join } from "node:path";
import { listCourseDirs, listLessonDirs, loadCourse } from "../lib/content/load";
import { lintCourse, type Diagnostic } from "../lib/content/lint";
import { runCourseLabs } from "../lib/labs/build";
import { reportCourses, selectCourseDirs } from "./content-cli";
import { appRoot, contentRoot, repoRoot } from "./paths";

const args = process.argv.slice(2);
const skipLabs = args.includes("--no-labs");
const [courseArg, lessonArg] = args.filter((arg) => !arg.startsWith("--"));

const courseDirs = selectCourseDirs(courseArg);

if (courseDirs.length === 0) {
  console.log("No courses under content/courses/ — nothing to validate.");
  process.exit(0);
}

const totalErrors = reportCourses(courseDirs, (dir) => {
  const loaded = loadCourse(dir);
  const diags: Diagnostic[] = lintCourse(loaded, {
    appRoot,
    lessonDirsOnDisk: listLessonDirs(dir),
    allCourseSlugs: listCourseDirs(contentRoot).map((d) => basename(d)),
  });
  if (!skipLabs) diags.push(...runCourseLabs(loaded, { repoRoot, mode: "check", lesson: lessonArg }));
  if (lessonArg === undefined) return diags;
  const lessonPrefix = join(dir, "lessons", lessonArg);
  return diags.filter((d) => d.file.startsWith(lessonPrefix) || d.file.endsWith("course.yaml"));
});

process.exit(totalErrors > 0 ? 1 : 0);
