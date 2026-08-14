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
 * Needs `uv` on PATH in both modes: a lab whose reference solution was never
 * executed is unvalidated content, so the diagnostic is an error either way.
 *
 * A full build is also the only thing that retires an artifact: what it does
 * not rebuild, it deletes, because the ingest reads `labs-dist/private/` as
 * the complete list of the labs that exist.
 */
import { basename } from "node:path";
import { loadCourse } from "../lib/content/load";
import { retireCourses, runCourseLabs } from "../lib/labs/build";
import { reportCourses, selectCourseDirs } from "./content-cli";
import { repoRoot } from "./paths";

const args = process.argv.slice(2);
const mode = args.includes("--check") ? "check" : "build";
const [courseArg, lessonArg] = args.filter((arg) => !arg.startsWith("--"));

const courseDirs = selectCourseDirs(courseArg);
if (mode === "build" && courseArg === undefined) {
  retireCourses(repoRoot, courseDirs.map((dir) => basename(dir)));
}

const totalErrors = reportCourses(courseDirs, (dir) =>
  runCourseLabs(loadCourse(dir), { repoRoot, mode, lesson: lessonArg }),
);

process.exit(totalErrors > 0 ? 1 : 0);
