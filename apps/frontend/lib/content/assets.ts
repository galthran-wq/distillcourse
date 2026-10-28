import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { isRasterFile } from "./images";
import { listCourseDirs, listLessonDirs } from "./load";

/**
 * Every file `scripts/sync-assets.ts` must have under `publicRoot`, as
 * destination -> source: each lesson's (and the course root's) raster
 * figures, plus the SVGs course.yaml names as a `key_image` or a `cover` —
 * an SVG figure is otherwise inlined into its lesson and never served.
 */
export function wantedAssets(contentRoot: string, publicRoot: string): Map<string, string> {
  const wanted = new Map<string, string>();
  for (const courseDir of listCourseDirs(contentRoot)) {
    const course = basename(courseDir);
    // Course-level figures (intro.mdx) land under the _course bucket.
    const courseFigures = join(courseDir, "figures");
    if (existsSync(courseFigures)) {
      for (const file of readdirSync(courseFigures)) {
        if (!isRasterFile(file)) continue;
        wanted.set(
          join(publicRoot, course, "_course", basename(file)),
          join(courseFigures, file),
        );
      }
    }
    const lessonsDir = join(courseDir, "lessons");
    for (const lesson of listLessonDirs(courseDir)) {
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
    // Read loosely rather than through CourseSchema: an invalid course.yaml is
    // validate's to report, and its images should still be served meanwhile.
    let named: { lesson?: string; image?: string }[];
    try {
      const courseYaml = parse(readFileSync(join(courseDir, "course.yaml"), "utf8")) as {
        cover?: { lesson?: string; image?: string };
        modules?: { lessons?: { slug?: string; key_image?: string }[] }[];
      };
      named = [
        courseYaml.cover ?? {},
        ...(courseYaml.modules ?? []).flatMap((mod) =>
          (mod.lessons ?? []).map((l) => ({ lesson: l.slug, image: l.key_image })),
        ),
      ];
    } catch {
      continue;
    }
    for (const { lesson, image } of named) {
      if (lesson === undefined || image === undefined) continue;
      const src = join(lessonsDir, lesson, image);
      if (existsSync(src)) {
        wanted.set(join(publicRoot, course, lesson, basename(image)), src);
      }
    }
  }
  return wanted;
}
