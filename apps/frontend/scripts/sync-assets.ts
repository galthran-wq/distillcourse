#!/usr/bin/env tsx
/**
 * Copies sourced raster figures out of the content tree into `public/`:
 *
 *   content/courses/<c>/lessons/<l>/figures/x.jpg
 *     -> public/course-assets/<c>/<l>/x.jpg
 *
 * Next only serves static files from `public`, but lesson assets belong next
 * to the lesson they illustrate — so the copy is a build step (`predev`,
 * `prebuild`, `prevalidate`) rather than a place authors put files. Stale
 * copies are pruned, so deleting an image from a lesson deletes it from the
 * site. The destination is generated and git-ignored.
 *
 * Run it by hand (`npm run sync-assets`) after adding an image while a dev
 * server is already up.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import { basename, join, relative } from "node:path";
import { parse } from "yaml";
import { isRasterFile } from "../lib/content/images";
import { appRoot, contentRoot, repoRoot } from "./paths";

const coursesRoot = join(contentRoot, "courses");
const publicRoot = join(appRoot, "public", "course-assets");

function dirs(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((d) => statSync(join(path, d)).isDirectory());
}

/** Every raster file that should exist under public/course-assets. */
const wanted = new Map<string, string>(); // destination -> source

for (const course of dirs(coursesRoot)) {
  // Course-level figures (intro.mdx) land under the _course bucket.
  const courseFigures = join(coursesRoot, course, "figures");
  if (existsSync(courseFigures)) {
    for (const file of readdirSync(courseFigures)) {
      if (!isRasterFile(file)) continue;
      wanted.set(
        join(publicRoot, course, "_course", basename(file)),
        join(courseFigures, file),
      );
    }
  }
  const lessonsDir = join(coursesRoot, course, "lessons");
  for (const lesson of dirs(lessonsDir)) {
    const figuresDir = join(lessonsDir, lesson, "figures");
    if (!existsSync(figuresDir)) continue;
    for (const file of readdirSync(figuresDir)) {
      if (!isRasterFile(file)) continue;
      wanted.set(
        join(publicRoot, course, lesson, basename(file)),
        join(figuresDir, file),
      );
    }
  }
  // key_image may be an SVG — those are not rasters, copy them explicitly.
  try {
    const courseYaml = parse(
      readFileSync(join(coursesRoot, course, "course.yaml"), "utf8"),
    ) as { modules?: { lessons?: { slug?: string; key_image?: string }[] }[] };
    for (const mod of courseYaml.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        if (lesson.slug === undefined || lesson.key_image === undefined) continue;
        const src = join(lessonsDir, lesson.slug, lesson.key_image);
        if (existsSync(src)) {
          wanted.set(
            join(publicRoot, course, lesson.slug, basename(lesson.key_image)),
            src,
          );
        }
      }
    }
  } catch {
    /* an unparsable course.yaml is validate's problem, not the asset sync's */
  }
}

let copied = 0;
for (const [dest, src] of wanted) {
  mkdirSync(join(dest, ".."), { recursive: true });
  const fresh =
    existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs;
  if (!fresh) {
    copyFileSync(src, dest);
    copied++;
  }
}

let pruned = 0;
function prune(dir: string): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      prune(path);
      if (readdirSync(path).length === 0) rmSync(path, { recursive: true });
    } else if (!wanted.has(path)) {
      rmSync(path);
      pruned++;
    }
  }
}
prune(publicRoot);

console.log(
  `sync-assets: ${wanted.size} image(s) in ${relative(repoRoot, publicRoot)} ` +
    `(${copied} copied, ${pruned} stale removed)`,
);
