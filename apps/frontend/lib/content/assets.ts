import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";
import { assetUrl, isRasterFile } from "./images";
import type { LoadedCourse } from "./load";

/**
 * The figure the home page shows for a course: its `cover`, else the first
 * lesson in course order with a `key_image` (planned ones too — the file
 * exists either way). `drawn` is an SVG, which the theme may invert; anything
 * else is a photograph or a scan, which it only dims.
 */
export function courseCover(
  loaded: LoadedCourse,
): { src: string; drawn: boolean } | undefined {
  const slug = loaded.course.slug;
  const { cover } = loaded.course;
  const pick =
    cover ??
    loaded.lessons
      .map(({ lesson }) => ({ lesson: lesson.slug, image: lesson.key_image }))
      .find((candidate) => candidate.image !== undefined);
  if (pick?.image === undefined) return undefined;
  return {
    src: assetUrl(slug, pick.lesson, pick.image),
    drawn: pick.image.toLowerCase().endsWith(".svg"),
  };
}

function dirs(path: string): string[] {
  if (!existsSync(path)) return [];
  return readdirSync(path).filter((d) => statSync(join(path, d)).isDirectory());
}

/**
 * Every file `scripts/sync-assets.ts` must have under `publicRoot`, as
 * destination -> source: each lesson's (and the course root's) raster
 * figures, plus the SVGs course.yaml names as a `key_image` or a `cover` —
 * an SVG figure is otherwise inlined into its lesson and never served.
 */
export function wantedAssets(coursesRoot: string, publicRoot: string): Map<string, string> {
  const wanted = new Map<string, string>();
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
    let named: { lesson?: string; image?: string }[];
    try {
      const courseYaml = parse(
        readFileSync(join(coursesRoot, course, "course.yaml"), "utf8"),
      ) as {
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
      continue; // an unparsable course.yaml is validate's problem, not the asset sync's
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
