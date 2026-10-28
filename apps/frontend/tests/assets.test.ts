import { afterEach, describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { wantedAssets } from "@/lib/content/assets";
import { courseCover } from "@/lib/content/images";
import { loadCourse, type LoadedCourse } from "@/lib/content/load";

const FIXTURE = join(__dirname, "fixtures", "lint-course");

function withoutKeyImages(loaded: LoadedCourse, slugs: string[]): LoadedCourse {
  return {
    ...loaded,
    lessons: loaded.lessons.map((entry) =>
      slugs.includes(entry.lesson.slug)
        ? { ...entry, lesson: { ...entry.lesson, key_image: undefined } }
        : entry,
    ),
  };
}

describe("courseCover", () => {
  const loaded = loadCourse(FIXTURE);

  it("takes the course's own cover first", () => {
    const covered = {
      ...loaded,
      course: {
        ...loaded.course,
        cover: { lesson: "surprisal-lab", image: "figures/scan.jpg" },
      },
    };
    expect(courseCover(covered)).toEqual({
      src: "/course-assets/lint-course/surprisal-lab/scan.jpg",
      drawn: false,
    });
  });

  it("falls back to the first lesson in course order with a key_image", () => {
    expect(courseCover(loaded)).toEqual({
      src: "/course-assets/lint-course/intro-surprise/rarity.svg",
      drawn: true,
    });
    expect(courseCover(withoutKeyImages(loaded, ["intro-surprise"]))?.src).toBe(
      "/course-assets/lint-course/surprisal-lab/lab.svg",
    );
  });

  it("is nothing for a course with neither", () => {
    expect(
      courseCover(withoutKeyImages(loaded, ["intro-surprise", "surprisal-lab"])),
    ).toBeUndefined();
  });
});

describe("wantedAssets", () => {
  let root: string | undefined;
  afterEach(() => {
    if (root !== undefined) rmSync(root, { recursive: true, force: true });
  });

  it("publishes a cover SVG that is no lesson's key_image", () => {
    root = mkdtempSync(join(tmpdir(), "assets-"));
    const course = join(root, "courses", "lint-course");
    cpSync(FIXTURE, course, { recursive: true });
    const figure = join(course, "lessons", "intro-surprise", "figures", "cover.svg");
    writeFileSync(figure, "<svg xmlns='http://www.w3.org/2000/svg'/>");
    const yaml = join(course, "course.yaml");
    writeFileSync(
      yaml,
      readFileSync(yaml, "utf8").replace(
        "intro: Fixture course intro.",
        "intro: Fixture course intro.\ncover:\n  lesson: intro-surprise\n  image: figures/cover.svg",
      ),
    );

    const wanted = wantedAssets(root, "/public");

    expect(wanted.get("/public/lint-course/intro-surprise/cover.svg")).toBe(figure);
    // The key_image SVGs are still published beside it.
    expect(wanted.has("/public/lint-course/intro-surprise/rarity.svg")).toBe(true);
  });
});
