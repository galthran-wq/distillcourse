import { afterEach, describe, expect, it } from "vitest";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listLessonDirs, loadCourse } from "@/lib/content/load";
import { lintCourse, type Diagnostic } from "@/lib/content/lint";

const FIXTURE = join(__dirname, "fixtures", "lint-course");

function lintDir(dir: string): Diagnostic[] {
  return lintCourse(loadCourse(dir), { lessonDirsOnDisk: listLessonDirs(dir) });
}

function errors(diags: Diagnostic[]): Diagnostic[] {
  return diags.filter((d) => d.level === "error");
}

const tempDirs: string[] = [];

function brokenCopy(mutate: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "lint-course-"));
  tempDirs.push(dir);
  cpSync(FIXTURE, dir, { recursive: true });
  mutate(dir);
  return dir;
}

function rewrite(path: string, from: string, to: string): void {
  const content = readFileSync(path, "utf8");
  if (!content.includes(from)) throw new Error(`fixture drift: "${from}" not in ${path}`);
  writeFileSync(path, content.replace(from, to));
}

afterEach(() => {
  while (tempDirs.length > 0) rmSync(tempDirs.pop()!, { recursive: true, force: true });
});

describe("lintCourse", () => {
  it("passes the green fixture with no errors or warnings", () => {
    expect(lintDir(FIXTURE)).toEqual([]);
  });

  it("flags a forward/cyclic prerequisite (prereq-cycle)", () => {
    const dir = brokenCopy((d) =>
      rewrite(join(d, "course.yaml"), "prerequisites: []", "prerequisites: [next-steps]"),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("prereq-cycle");
  });

  it("flags a non-extra lesson requiring an extra lesson (extra-prereq)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "course.yaml"),
        "slug: intro-surprise\n        title: \"Measuring surprise\"\n        type: core",
        "slug: intro-surprise\n        title: \"Measuring surprise\"\n        type: extra",
      ),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("extra-prereq");
  });

  it("flags a concept missing from the registry (concept-unknown)", () => {
    const dir = brokenCopy((d) =>
      rewrite(join(d, "course.yaml"), "reinforces: [surprisal]", "reinforces: [entropy]"),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("concept-unknown");
  });

  it("flags a drafted lesson with a missing lesson.mdx (lesson-files)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "course.yaml"),
        "slug: next-steps\n        title: \"Where surprisal leads\"\n        type: core\n        status: planned",
        "slug: next-steps\n        title: \"Where surprisal leads\"\n        type: core\n        status: drafted",
      ),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("lesson-files");
  });

  it("flags a component outside the vocabulary (component-unknown)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "<Example>",
        "<Quiz>\n</Quiz>\n\n<Example>",
      ),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("component-unknown");
  });

  it("flags unparseable MDX (mdx-compile)", () => {
    const dir = brokenCopy((d) =>
      rewrite(join(d, "lessons/intro-surprise/lesson.mdx"), "<Example>", "<Example"),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("mdx-compile");
  });

  it("warns when the lesson lacks a References section (references-present)", () => {
    const dir = brokenCopy((d) => {
      const path = join(d, "lessons/intro-surprise/lesson.mdx");
      const content = readFileSync(path, "utf8");
      writeFileSync(path, content.replace(/<References>[\s\S]*<\/References>\s*$/, ""));
    });
    const warns = lintDir(dir).filter((d) => d.level === "warn").map((d) => d.rule);
    expect(warns).toContain("references-present");
  });

  it("warns when an Exercise has no Solution (exercise-solution)", () => {
    const dir = brokenCopy((d) => {
      const path = join(d, "lessons/intro-surprise/lesson.mdx");
      const content = readFileSync(path, "utf8");
      writeFileSync(
        path,
        content.replace(/<Solution>[\s\S]*?<\/Solution>\s*/, ""),
      );
    });
    const warns = lintDir(dir).filter((d) => d.level === "warn").map((d) => d.rule);
    expect(warns).toContain("exercise-solution");
  });

  it("warns for an Exercise without Solution nested inside another block (exercise-solution)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "## Exercises",
        "<Aside>\n<Exercise>\nState the definition of surprisal.\n</Exercise>\n</Aside>\n\n## Exercises",
      ),
    );
    const warns = lintDir(dir).filter((d) => d.level === "warn").map((d) => d.rule);
    expect(warns).toContain("exercise-solution");
  });

  it("flags MDX that compiles but throws at render (mdx-render)", () => {
    // `{p}` outside math is a JS expression over an undefined identifier —
    // compiles fine, dies with a ReferenceError only when rendered.
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "<Example>",
        "A stray expression {p} in prose.\n\n<Example>",
      ),
    );
    const render = errors(lintDir(dir)).filter((d) => d.rule === "mdx-render");
    expect(render.length).toBeGreaterThan(0);
    expect(render[0].message).toContain("p is not defined");
  });

  it("flags MDX that parses but fails full compilation (mdx-compile)", () => {
    // Two default exports parse fine (each ESM block is valid on its own)
    // but compileSync rejects the duplicate layout at compile time.
    const dir = brokenCopy((d) => {
      const path = join(d, "lessons/intro-surprise/lesson.mdx");
      writeFileSync(
        path,
        readFileSync(path, "utf8") +
          "\nexport default function A() {}\n\nexport default function B() {}\n",
      );
    });
    const compile = errors(lintDir(dir)).filter((d) => d.rule === "mdx-compile");
    expect(compile.length).toBeGreaterThan(0);
    expect(compile[0].message).toContain("MDX compile error");
  });
});
