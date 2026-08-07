#!/usr/bin/env tsx
/**
 * Content index export: `npm run export-index [-- <out.json>]`
 *
 * Writes the complete search index the backend ingests
 * (`python -m app.content.ingest <out.json>`). Complete is load-bearing:
 * ingest deletes every row of the exported corpora that this file does not
 * list, which is how a renamed heading or a deleted lesson stops being a
 * search result.
 *
 * CONTENT_PREVIEW must match the frontend build, or the index and the site
 * disagree about which lessons exist.
 *
 * The npm script runs this via `tsx --conditions=import`: the export pipeline
 * pulls in the ESM-only remark/rehype stack, and the extra condition lets
 * tsx's CJS transform resolve it.
 */
import { writeFileSync } from "node:fs";
import { isAbsolute, join, relative } from "node:path";
import { listCourseDirs, loadCourse } from "../lib/content/load";
import { buildIndex } from "../lib/content/index-export";
import { contentRoot, repoRoot } from "./paths";

const [outArg] = process.argv.slice(2);
const out =
  outArg === undefined
    ? join(repoRoot, "index.json")
    : isAbsolute(outArg)
      ? outArg
      : join(process.cwd(), outArg);

const courses = listCourseDirs(contentRoot).map((dir) => loadCourse(dir));
if (courses.length === 0) {
  console.error(`No courses under ${relative(repoRoot, contentRoot)}/courses`);
  process.exit(1);
}

const index = buildIndex(courses);
writeFileSync(out, JSON.stringify(index, null, 2) + "\n");

const byCorpus = new Map<string, number>();
for (const doc of index.documents) {
  byCorpus.set(doc.corpus, (byCorpus.get(doc.corpus) ?? 0) + 1);
}
const counts = [...byCorpus].map(([corpus, n]) => `${n} ${corpus}`).join(", ");
console.log(`${out}: ${index.documents.length} documents (${counts})`);

if (index.documents.every((d) => d.corpus !== "lesson")) {
  console.error(
    "No lesson documents: CONTENT_PREVIEW is unset and no lesson is published yet.",
  );
  process.exit(1);
}
