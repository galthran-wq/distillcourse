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
 * Needs `uv` on PATH; labs are skipped with a warning where it is missing.
 */
import { basename } from "node:path";
import { ContentError, loadCourse } from "../lib/content/load";
import type { Diagnostic } from "../lib/content/lint";
import { runCourseLabs } from "../lib/labs/build";
import { reportDiagnostics, selectCourseDirs } from "./content-cli";
import { repoRoot } from "./paths";

const args = process.argv.slice(2);
const mode = args.includes("--check") ? "check" : "build";
const [courseArg, lessonArg] = args.filter((arg) => !arg.startsWith("--"));

let totalErrors = 0;
for (const dir of selectCourseDirs(courseArg)) {
  let diags: Diagnostic[];
  try {
    diags = runCourseLabs(loadCourse(dir), { repoRoot, mode, lesson: lessonArg });
  } catch (err) {
    if (!(err instanceof ContentError)) throw err;
    diags = [{ level: "error", rule: "course-schema", file: err.file, message: err.message }];
  }
  if (diags.length === 0) continue;
  const { errors } = reportDiagnostics(diags);
  totalErrors += errors;
  console.log(`${errors === 0 ? "✓" : "✗"} ${basename(dir)}: ${errors} error(s)`);
}

process.exit(totalErrors > 0 ? 1 : 0);
