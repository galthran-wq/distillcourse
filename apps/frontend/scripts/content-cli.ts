/**
 * The three things every content CLI does: resolve the course named on the
 * command line, walk the courses collecting diagnostics, and print those in
 * the one format the authoring skills are told to read.
 */
import { existsSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { ContentError, listCourseDirs } from "../lib/content/load";
import type { Diagnostic } from "../lib/content/lint";
import { contentRoot, repoRoot } from "./paths";

export function selectCourseDirs(courseArg?: string): string[] {
  if (courseArg === undefined) return listCourseDirs(contentRoot);
  const dir = join(contentRoot, "courses", courseArg);
  if (!existsSync(dir)) {
    console.error(`No such course: ${courseArg} (${relative(repoRoot, dir)})`);
    process.exit(1);
  }
  return [dir];
}

/**
 * Runs `collect` over each course and reports what it found, one summary line
 * per course; returns the error total the CLI exits on. A course that fails to
 * load is one `course-schema` error, not a crash.
 */
export function reportCourses(
  dirs: string[],
  collect: (dir: string) => Diagnostic[],
): number {
  let totalErrors = 0;
  for (const dir of dirs) {
    let diags: Diagnostic[];
    try {
      diags = collect(dir);
    } catch (err) {
      if (!(err instanceof ContentError)) throw err;
      diags = [{ level: "error", rule: "course-schema", file: err.file, message: err.message }];
    }
    const { errors, warns } = reportDiagnostics(diags);
    totalErrors += errors;
    console.log(
      `${errors === 0 ? "✓" : "✗"} ${basename(dir)}: ${errors} error(s), ${warns} warning(s)`,
    );
  }
  return totalErrors;
}

export function reportDiagnostics(diags: Diagnostic[]): { errors: number; warns: number } {
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
