#!/usr/bin/env tsx
/**
 * Lab build: `npm run build-labs [-- <course> [<lesson>]] [--check]`
 *
 * Executes each drafted lab's reference solution in its own locked
 * environment and writes what it produces to `labs-dist/` — the public half
 * for the mirror, the private half for the checkpoint API. `--check` runs the
 * same work and discards the artifacts; that is the mode `npm run validate`
 * uses, because a lab whose solution is not green is invalid content.
 *
 * Needs `uv` on PATH: without it this command can write nothing and fails.
 * (`--check`, and so `npm run validate`, only warns — linting content does
 * not need the environment.)
 */
import { loadCourse } from "../lib/content/load";
import { runCourseLabs } from "../lib/labs/build";
import { reportCourses, selectCourseDirs } from "./content-cli";
import { repoRoot } from "./paths";

const args = process.argv.slice(2);
const mode = args.includes("--check") ? "check" : "build";
const [courseArg, lessonArg] = args.filter((arg) => !arg.startsWith("--"));

const totalErrors = reportCourses(selectCourseDirs(courseArg), (dir) =>
  runCourseLabs(loadCourse(dir), { repoRoot, mode, lesson: lessonArg }),
);

process.exit(totalErrors > 0 ? 1 : 0);
