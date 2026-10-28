import { afterEach, describe, expect, it } from "vitest";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listLessonDirs, loadCourse } from "@/lib/content/load";
import { lintCourse, type Diagnostic } from "@/lib/content/lint";

const FIXTURE = join(__dirname, "fixtures", "lint-course");

/** Smallest valid PNG — stands in for a sourced image in the raster tests. */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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

  it("warns when the body names a canon source outside References (source-in-prose)", () => {
    const dir = brokenCopy((d) => {
      mkdirSync(join(d, "research"));
      writeFileSync(
        join(d, "research/sources.yaml"),
        'sources:\n  - title: "A Mathematical Theory of Communication"\n    authors: "C. E. Shannon"\n',
      );
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "## Information and probability\n",
        "## Information and probability\n\nShannon and Weaver et al. give the measure.\n",
      );
    });
    const warn = lintDir(dir).find((d) => d.rule === "source-in-prose");
    expect(warn?.message).toContain("Shannon");
    expect(warn?.message).toContain("et al.");
  });

  it("fails a $…$ span that swallowed prose between two dollar amounts (stray-math)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "## Information and probability\n",
        "## Information and probability\n\nA pays B $100 of illicit funds, B pays $50 to C, and $p = 1/2$.\n",
      ),
    );
    const errors = lintDir(dir).filter((d) => d.rule === "stray-math");
    expect(errors).toHaveLength(1);
    expect(errors[0].level).toBe("error");
    expect(errors[0].message).toContain("$100 of illicit funds");
  });

  it("passes escaped dollar amounts and a dollar inside a formula (stray-math)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        "## Information and probability\n",
        "## Information and probability\n\nA pays B \\$100, B pays \\$50, worth $2 \\times \\text{\\textdollar}25$.\n",
      ),
    );
    expect(lintDir(dir).filter((d) => d.rule === "stray-math")).toEqual([]);
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

  it("flags a <Figure src> with no file behind it (figure-src)", () => {
    const dir = brokenCopy((d) =>
      rmSync(join(d, "lessons/intro-surprise/figures/rarity.svg")),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("figure-src");
  });

  describe("figure-style-scope", () => {
    const withStyle = (css: string) =>
      brokenCopy((d) =>
        rewrite(
          join(d, "lessons/intro-surprise/figures/rarity.svg"),
          'font-family="system-ui, sans-serif">',
          `font-family="system-ui, sans-serif"><style>${css}</style>`,
        ),
      );
    const scopeErrors = (dir: string) =>
      errors(lintDir(dir)).filter((d) => d.rule === "figure-style-scope");

    it("flags a raw figure whose <style> has a type selector", () => {
      const found = scopeErrors(withStyle(".muted { opacity: .5 } text { fill: currentColor }"));
      expect(found).toHaveLength(1);
      expect(found[0].message).toContain('"text"');
    });

    it("passes a raw figure whose <style> uses only class and id selectors", () => {
      expect(scopeErrors(withStyle(".muted { opacity: .5 } #arr .head { fill: red }"))).toEqual([]);
    });

    it("flags a raw figure that is not well-formed XML", () => {
      const dir = brokenCopy((d) =>
        rewrite(join(d, "lessons/intro-surprise/figures/rarity.svg"), "green-fixture", "x < 1"),
      );
      expect(scopeErrors(dir)[0].message).toContain("not well-formed XML");
    });
  });

  it("flags a sourced image with no credits entry (image-credit)", () => {
    const dir = brokenCopy((d) => {
      writeFileSync(join(d, "lessons/intro-surprise/figures/photo.png"), PNG_1PX);
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        '<Figure src="./figures/rarity.svg"',
        '<Figure src="./figures/photo.png" alt="A photograph" />\n\n<Figure src="./figures/rarity.svg"',
      );
    });
    const diags = errors(lintDir(dir));
    expect(diags.map((d) => d.rule)).toContain("image-credit");
    expect(diags.find((d) => d.rule === "image-credit")?.message).toContain("photo.png");
  });

  it("flags a truncated sourced image (image-broken)", () => {
    const dir = brokenCopy((d) => {
      writeFileSync(
        join(d, "lessons/intro-surprise/figures/photo.png"),
        PNG_1PX.subarray(0, 40),
      );
      writeFileSync(
        join(d, "lessons/intro-surprise/figures/credits.yaml"),
        [
          "schema_version: 1",
          "images:",
          "  - file: photo.png",
          "    title: A photograph",
          "    credit: Someone",
          "    source_url: https://example.org/photo",
          "    license: public domain",
          "    retrieved: 2026-07-30",
          "",
        ].join("\n"),
      );
      rewrite(
        join(d, "lessons/intro-surprise/lesson.mdx"),
        '<Figure src="./figures/rarity.svg"',
        '<Figure src="./figures/photo.png" alt="A photograph" />\n\n<Figure src="./figures/rarity.svg"',
      );
    });
    const diags = errors(lintDir(dir));
    expect(diags.map((d) => d.rule)).toContain("image-broken");
    expect(diags.find((d) => d.rule === "image-broken")?.message).toContain("truncated");
  });

  it("flags a credits entry whose file is gone (image-credit)", () => {
    const dir = brokenCopy((d) =>
      writeFileSync(
        join(d, "lessons/intro-surprise/figures/credits.yaml"),
        [
          "schema_version: 1",
          "images:",
          "  - file: vanished.jpg",
          "    title: A photograph",
          "    credit: Someone",
          "    source_url: https://example.org/photo",
          "    license: public domain",
          "    retrieved: 2026-07-30",
          "",
        ].join("\n"),
      ),
    );
    const diags = errors(lintDir(dir));
    expect(diags.map((d) => d.rule)).toContain("image-credit");
    expect(diags.find((d) => d.rule === "image-credit")?.message).toContain("vanished.jpg");
  });

  it("flags a drafted lab missing one of its sources (lab-files)", () => {
    for (const name of ["solution.py", "challenges.yaml", "pyproject.toml", "uv.lock"]) {
      const dir = brokenCopy((d) => rmSync(join(d, "lessons/surprisal-lab", name)));
      const diags = errors(lintDir(dir)).filter((d) => d.rule === "lab-files");
      expect(diags.map((d) => d.message).join()).toContain(name);
    }
  });

  it("flags a lab whose python floor is below the build driver's (lab-files)", () => {
    // The driver parses pyproject.toml with tomllib; a lower floor dies inside
    // the run with an ImportError instead of here with a diagnostic.
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/surprisal-lab/pyproject.toml"),
        'requires-python = ">=3.11"',
        'requires-python = ">=3.10"',
      ),
    );
    const diags = errors(lintDir(dir)).filter((d) => d.rule === "lab-files");
    expect(diags.map((d) => d.message).join()).toContain("requires-python");
  });

  it("flags challenges.yaml without a checkpoints mapping (lab-files)", () => {
    const dir = brokenCopy((d) =>
      writeFileSync(join(d, "lessons/surprisal-lab/challenges.yaml"), "kind: exact\n"),
    );
    expect(errors(lintDir(dir)).map((d) => d.rule)).toContain("lab-files");
  });

  it("flags checkpoint ids that disagree with challenges.yaml (lab-checkpoints)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/surprisal-lab/challenges.yaml"),
        "  why-uniform:",
        "  why-uniform-really:",
      ),
    );
    const diags = errors(lintDir(dir)).filter((d) => d.rule === "lab-checkpoints");
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain("why-uniform");
  });

  it("flags a checkpoint kind that disagrees with challenges.yaml (lab-checkpoints)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "lessons/surprisal-lab/challenges.yaml"),
        "  surprisal:\n    kind: exact",
        "  surprisal:\n    kind: metric",
      ),
    );
    const diags = errors(lintDir(dir)).filter((d) => d.rule === "lab-checkpoints");
    expect(diags).toHaveLength(1);
    expect(diags[0].message).toContain('"exact" in course.yaml but "metric"');
  });

  it("flags an unparsable challenges.yaml (lab-files)", () => {
    const dir = brokenCopy((d) =>
      writeFileSync(join(d, "lessons/surprisal-lab/challenges.yaml"), "checkpoints: [a: 1\n"),
    );
    const diags = errors(lintDir(dir)).filter((d) => d.rule === "lab-files");
    expect(diags.map((d) => d.message).join()).toContain("YAML parse error");
  });

  it("flags a duplicate checkpoint id (lab-checkpoints)", () => {
    const dir = brokenCopy((d) =>
      rewrite(join(d, "course.yaml"), "id: why-uniform", "id: surprisal"),
    );
    const messages = errors(lintDir(dir))
      .filter((d) => d.rule === "lab-checkpoints")
      .map((d) => d.message);
    expect(messages.join()).toContain('duplicate checkpoint id "surprisal"');
  });

  it("flags a lab whose every checkpoint is optional (lab-checkpoints)", () => {
    const dir = brokenCopy((d) =>
      rewrite(
        join(d, "course.yaml"),
        'text: "Implement surprisal(p) in bits"',
        'text: "Implement surprisal(p) in bits"\n              required: false',
      ),
    );
    const messages = errors(lintDir(dir))
      .filter((d) => d.rule === "lab-checkpoints")
      .map((d) => d.message);
    expect(messages.join()).toContain("at least one must be required");
  });

  it("leaves a planned lab alone until it is drafted (lab-files)", () => {
    const dir = brokenCopy((d) => {
      rewrite(
        join(d, "course.yaml"),
        "        type: lab\n        status: drafted",
        "        type: lab\n        status: planned",
      );
      rmSync(join(d, "lessons/surprisal-lab/solution.py"));
    });
    expect(errors(lintDir(dir)).map((d) => d.rule)).not.toContain("lab-files");
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
