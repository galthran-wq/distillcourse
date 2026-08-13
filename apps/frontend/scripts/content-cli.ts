/**
 * The two things every content CLI does: resolve the course named on the
 * command line, and print diagnostics in the one format the authoring skills
 * are told to read.
 */
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import { listCourseDirs } from "../lib/content/load";
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
