#!/usr/bin/env tsx
/**
 * Content validator: `npm run validate [-- <course> [<lesson>]]`
 *
 * Schema-validates and pedagogy-lints everything under content/courses/, and
 * builds every drafted lab in check mode — a lab whose reference solution is
 * not green is invalid content, exactly like unparsable MDX. Exit code 1 on
 * any error-level diagnostic. Every authoring skill must run this after
 * generating content and fix failures before reporting done.
 *
 * The npm script runs this via `tsx --conditions=import`: lint.ts imports
 * the ESM-only @mdx-js/mdx (whose dep estree-walker exports no `require`
 * condition), and the extra condition lets tsx's CJS transform resolve it.
 */
import { basename, join } from "node:path";
import { ContentError, listCourseDirs, listLessonDirs, loadCourse } from "../lib/content/load";
import { lintCourse, type Diagnostic } from "../lib/content/lint";
import { runCourseLabs } from "../lib/labs/build";
import { reportDiagnostics, selectCourseDirs } from "./content-cli";
import { appRoot, contentRoot, repoRoot } from "./paths";

const [courseArg, lessonArg] = process.argv.slice(2);

const courseDirs = selectCourseDirs(courseArg);

if (courseDirs.length === 0) {
  console.log("No courses under content/courses/ — nothing to validate.");
  process.exit(0);
}

let totalErrors = 0;

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
    diags.push(...runCourseLabs(loaded, { repoRoot, mode: "check", lesson: lessonArg }));
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

  const { errors, warns } = reportDiagnostics(diags);
  totalErrors += errors;
  console.log(
    `${errors === 0 ? "✓" : "✗"} ${name}: ${errors} error(s), ${warns} warning(s)`,
  );
}

process.exit(totalErrors > 0 ? 1 : 0);
