import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, normalize } from "node:path";
import { unified } from "unified";
import { compileSync, evaluateSync } from "@mdx-js/mdx";
import * as jsxRuntime from "react/jsx-runtime";
import { createElement, Fragment, type ComponentType } from "react";
import { renderToString } from "react-dom/server";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import { toString as mdastToString } from "mdast-util-to-string";
import type { Root } from "mdast";
import { STATUS_RANK, type LoadedCourse, type LoadedLesson } from "./load";
import {
  CHALLENGES_FILE,
  challengesPath,
  loadChallenges,
} from "./challenges";
import {
  CREDITS_FILE,
  creditFor,
  creditMatches,
  creditsPath,
  loadCredits,
} from "./credits";
import {
  MAX_FIGURE_BYTES,
  MIN_FIGURE_WIDTH,
  RASTER_EXTENSIONS,
  isProbeError,
  isRasterFile,
  probeImageFile,
} from "./images";
import { collectJsx, stringAttr } from "./mdx-jsx";

export interface Diagnostic {
  level: "error" | "warn";
  rule: string;
  file: string;
  message: string;
}

/**
 * Lesson prose is free-form (textbook chapters). The linter validates the
 * SHELL — references between files, exercises' structure, known components —
 * as errors, and flags pedagogy guidance (opening line, exercises present,
 * references present) as warnings only. It never dictates prose shape.
 */

const ALLOWED_COMPONENTS = new Set([
  "Figure",
  "FigureSequence",
  "Demo",
  "Aside",
  "Ref",
  "Definition",
  "Theorem",
  "Proof",
  "Example",
  "Remark",
  "KeyFact",
  "Task",
  "Exercise",
  "Solution",
  "References",
]);

// Verbs accepted at the start of a lesson goal (pedagogy rule L1). Warning
// only — the list is indicative, not exhaustive.
const BLOOM_VERBS = new Set(
  (
    "define describe identify list name recall recognize state " +
    "classify compare discuss explain interpret paraphrase predict summarize distinguish " +
    "apply compute calculate construct build demonstrate estimate implement solve use derive " +
    "analyze contrast decompose diagram differentiate examine test " +
    "argue assess critique defend evaluate judge justify select " +
    "assemble create design develop formulate invent produce compose"
  ).split(" "),
);

// remark-math is included so $...$ spans parse as math exactly like the real
// @next/mdx pipeline — otherwise TeX braces get misread as JSX expressions.
const mdxParser = unified().use(remarkParse).use(remarkMdx).use(remarkMath);

/** Normalizes prose for opening-line comparison: quotes, dashes, whitespace. */
function normalizeProse(text: string): string {
  return text
    .replace(/[‘’“”"']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function lintLessonMdx(
  entry: LoadedLesson,
  lessonSlugs: Set<string>,
  diags: Diagnostic[],
  options: LintOptions,
): void {
  const { lesson } = entry;
  const file = entry.mdxPath;
  if (entry.mdx === undefined) return; // reported by lesson-files

  let root: Root;
  try {
    root = mdxParser.parse(entry.mdx) as Root;
  } catch (err) {
    diags.push({
      level: "error",
      rule: "mdx-compile",
      file,
      message: `MDX parse error: ${(err as Error).message}`,
    });
    return;
  }

  // The parse above only covers syntax the parser sees; compileSync runs the
  // full MDX compile (ESM handling, expression building, layout rules) so
  // documents that would blow up at build time fail validation too.
  try {
    compileSync(entry.mdx, { remarkPlugins: [remarkMath] });
  } catch (err) {
    diags.push({
      level: "error",
      rule: "mdx-compile",
      file,
      message: `MDX compile error: ${(err as Error).message}`,
    });
    return;
  }

  // mdx-render: a document can compile yet still throw when rendered — a
  // stray `{p}` in prose compiles to the JS expression `p` and only dies as
  // a ReferenceError at prerender time (multi-line inline math that fails to
  // parse as math is the classic source). Render with stub components so
  // validation, not the production build, is the gate that catches it.
  try {
    const mod = evaluateSync(entry.mdx, {
      ...jsxRuntime,
      remarkPlugins: [remarkGfm, remarkMath],
    } as never);
    const Stub = (props: { children?: unknown }) =>
      createElement(Fragment, null, props.children as never);
    const components = Object.fromEntries(
      [...ALLOWED_COMPONENTS].map((name) => [name, Stub]),
    ) as Record<string, ComponentType>;
    renderToString(
      createElement(mod.default as ComponentType<{ components: unknown }>, {
        components,
      }),
    );
  } catch (err) {
    diags.push({
      level: "error",
      rule: "mdx-render",
      file,
      message: `MDX renders with an error: ${(err as Error).message}`,
    });
  }

  const jsx = collectJsx(root.children);

  // component-unknown: only the documented vocabulary (capitalized names).
  for (const node of jsx) {
    const name = node.name ?? "";
    if (/^[A-Z]/.test(name) && !ALLOWED_COMPONENTS.has(name)) {
      diags.push({
        level: "error",
        rule: "component-unknown",
        file,
        message: `unknown component <${name}>; allowed: ${[...ALLOWED_COMPONENTS].join(", ")}`,
      });
    }
  }

  // Demo usage must match course.yaml's demo.component.
  for (const node of jsx.filter((n) => n.name === "Demo")) {
    const name = stringAttr(node, "name");
    if (name !== undefined && lesson.demo?.component !== name) {
      diags.push({
        level: "error",
        rule: "demo-mismatch",
        file,
        message: `<Demo name="${name}"> but course.yaml declares ${lesson.demo ? `"${lesson.demo.component}"` : "no demo"}`,
      });
    }
    // demo-embedded-unregistered: an embedded demo renders a hole at any
    // status, so the registry check cannot wait for reviewed (which only
    // gates course.yaml-declared demos of planned lessons).
    if (name !== undefined && options.appRoot !== undefined) {
      const registry = join(options.appRoot, "components", "demos", "index.ts");
      const registered =
        existsSync(registry) && readFileSync(registry, "utf8").includes(name);
      if (!registered) {
        diags.push({
          level: "error",
          rule: "demo-embedded-unregistered",
          file,
          message: `<Demo name="${name}"> is embedded in lesson.mdx but not registered in components/demos/index.ts`,
        });
      }
    }
  }

  // ref-target: <Ref lesson="..."> must point at a lesson in this course.
  for (const node of jsx.filter((n) => n.name === "Ref")) {
    const target = stringAttr(node, "lesson");
    if (target === undefined || !lessonSlugs.has(target)) {
      diags.push({
        level: "error",
        rule: "ref-target",
        file,
        message: `<Ref lesson="${target ?? "?"}"> does not resolve to a lesson in this course`,
      });
    }
  }

  // Figure files: every <Figure src="…"> resolves to a file in the lesson
  // dir, and every sourced raster image is a complete, credited, usable file
  // (docs/figures.md, third tier). A broken or uncredited image is an error:
  // it would ship as a broken box or as content we cannot attribute.
  const credits = loadCredits(entry.dir);
  const usedCredits = new Set<string>();
  const checkImageFile = (rel: string, where: string): void => {
    const path = join(entry.dir, rel);
    if (!existsSync(path)) {
      diags.push({
        level: "error",
        rule: "figure-src",
        file,
        message: `${where} points at ${rel}, which does not exist in the lesson directory`,
      });
      return;
    }
    if (!isRasterFile(rel)) return;

    const name = basename(rel);
    usedCredits.add(name);
    const probe = probeImageFile(path);
    if (isProbeError(probe)) {
      diags.push({
        level: "error",
        rule: "image-broken",
        file: path,
        message: `${where}: ${probe.error}`,
      });
    } else {
      if (probe.truncated) {
        diags.push({
          level: "error",
          rule: "image-broken",
          file: path,
          message: `${where}: file is truncated — the download did not finish`,
        });
      }
      if (probe.width < MIN_FIGURE_WIDTH) {
        diags.push({
          level: "warn",
          rule: "image-quality",
          file: path,
          message: `${where}: only ${probe.width}px wide (floor is ${MIN_FIGURE_WIDTH}px) — likely a thumbnail`,
        });
      }
      if (probe.bytes > MAX_FIGURE_BYTES) {
        diags.push({
          level: "warn",
          rule: "image-quality",
          file: path,
          message: `${where}: ${(probe.bytes / 1e6).toFixed(1)} MB — run \`npm run image -- fit\` to bring it under ${(MAX_FIGURE_BYTES / 1e6).toFixed(1)} MB`,
        });
      }
    }
    if (creditFor(credits, name) === undefined) {
      diags.push({
        level: "error",
        rule: "image-credit",
        file: creditsPath(entry.dir),
        message: `${where}: no entry for "${name}" in figures/${CREDITS_FILE} — a sourced image ships with its provenance or not at all`,
      });
    }
  };

  for (const node of jsx.filter((n) => n.name === "Figure")) {
    const src = stringAttr(node, "src");
    if (src === undefined) continue; // component tier, checked by the registry
    checkImageFile(normalize(src.replace(/^\.\//, "")), `<Figure src="${src}">`);
  }

  // figure-sequence: each <FigureSequence> must resolve in one of the two
  // tiers — PascalCase = component figure registered with a frames count,
  // kebab-case = >=2 frame files on disk in the lesson dir.
  for (const node of jsx.filter((n) => n.name === "FigureSequence")) {
    const name = stringAttr(node, "name");

    if (name !== undefined && /^[A-Z][A-Za-z0-9]*$/.test(name)) {
      let registered = false;
      if (options.appRoot !== undefined) {
        const registry = join(options.appRoot, "components", "figures", "index.ts");
        if (existsSync(registry)) {
          const source = readFileSync(registry, "utf8");
          // Cheap textual check, mirroring demo-registered: the name appears
          // and its entry declares a frames field.
          registered =
            source.includes(name) &&
            new RegExp(`\\b${name}\\b\\s*:\\s*\\{[^}]*\\bframes\\b`).test(source);
        }
      }
      if (!registered) {
        diags.push({
          level: "warn",
          rule: "figure-sequence",
          file,
          message: `<FigureSequence name="${name}"> is not registered with a frames count in components/figures/index.ts (component tier needs { component, frames: N>=2 })`,
        });
      }
      continue;
    }

    let frameCount = 0;
    if (name !== undefined && /^[a-z0-9-]+$/.test(name)) {
      const figuresDir = join(entry.dir, "figures");
      if (existsSync(figuresDir)) {
        const exts = ["svg", ...RASTER_EXTENSIONS.map((e) => e.slice(1))].join("|");
        const re = new RegExp(`^${name}-\\d+\\.(${exts})$`);
        const frames = readdirSync(figuresDir).filter((f) => re.test(f));
        frameCount = frames.length;
        for (const frame of frames) {
          checkImageFile(join("figures", frame), `<FigureSequence name="${name}"> frame ${frame}`);
        }
      }
    }
    if (frameCount < 2) {
      diags.push({
        level: "warn",
        rule: "figure-sequence",
        file,
        message: `<FigureSequence name="${name ?? "?"}"> has ${frameCount} frame(s) in figures/ — needs >=2 (<name>-1.svg|.png, <name>-2…)`,
      });
    }
  }

  // The credits file itself: parsable, and no entries that no longer match a
  // file (a stale credit is a claim about an image we no longer ship).
  if (credits.error !== undefined) {
    diags.push({
      level: "error",
      rule: "image-credit",
      file: creditsPath(entry.dir),
      message: `figures/${CREDITS_FILE} is invalid: ${credits.error}`,
    });
  }
  const used = [...usedCredits];
  for (const credit of credits.entries) {
    const covered = used.filter((name) => creditMatches(credit, name));
    if (covered.length > 0) continue;
    const onDisk =
      credit.file.includes("*") ||
      existsSync(join(entry.dir, "figures", credit.file));
    diags.push({
      level: onDisk ? "warn" : "error",
      rule: "image-credit",
      file: creditsPath(entry.dir),
      message: onDisk
        ? `credits entry "${credit.file}" is not used by any <Figure>/<FigureSequence> in the lesson`
        : `credits entry "${credit.file}" has no file in figures/`,
    });
  }

  // exercise-solution: every Exercise should contain a Solution (warn).
  for (const node of jsx.filter((n) => n.name === "Exercise")) {
    const inner = collectJsx(node.children ?? []);
    if (!inner.some((n) => n.name === "Solution")) {
      diags.push({
        level: "warn",
        rule: "exercise-solution",
        file,
        message: "an <Exercise> has no <Solution>",
      });
    }
  }

  // Guidance-level warnings — never errors; prose is free-form.
  const firstParagraph = root.children.find((n) => n.type === "paragraph");
  if (
    firstParagraph === undefined ||
    !normalizeProse(mdastToString(firstParagraph)).startsWith(
      normalizeProse(lesson.opening),
    )
  ) {
    diags.push({
      level: "warn",
      rule: "opening-first",
      file,
      message: `lesson does not start with the opening statement from course.yaml`,
    });
  }
  if (!jsx.some((n) => n.name === "Exercise")) {
    diags.push({
      level: "warn",
      rule: "exercises-present",
      file,
      message: "lesson has no <Exercise> blocks",
    });
  }
  if (!jsx.some((n) => n.name === "References")) {
    diags.push({
      level: "warn",
      rule: "references-present",
      file,
      message: "lesson has no <References> section",
    });
  }
}

/** What a lab lesson directory must hold once the lesson is drafted. */
const LAB_FILES = [
  "solution.py",
  CHALLENGES_FILE,
  "pyproject.toml",
  "uv.lock",
  // The interpreter pin: without it uv resolves to the newest Python and
  // wheel-less scientific deps fall back to sdist builds (deploy killer).
  ".python-version",
];

/**
 * The build driver parses `pyproject.toml` and `uv.lock` with `tomllib`, so a
 * lab whose environment resolves below this dies inside the run with an
 * ImportError rather than here with a diagnostic. The client's own floor is
 * 3.10 (Colab's) and unrelated: the lab's environment is the build's.
 */
const LAB_PYTHON_MINOR = 11;
const REQUIRES_PYTHON = /^\s*requires-python\s*=\s*"[^"]*>=\s*3\.(\d+)/m;

function lintLabPython(entry: LoadedLesson, diags: Diagnostic[]): void {
  const file = join(entry.dir, "pyproject.toml");
  const declared = REQUIRES_PYTHON.exec(readFileSync(file, "utf8"));
  if (declared !== null && Number(declared[1]) >= LAB_PYTHON_MINOR) return;
  diags.push({
    level: "error",
    rule: "lab-files",
    file,
    message: `lab "${entry.lesson.slug}": requires-python must be ">=3.${LAB_PYTHON_MINOR}" or higher — the build driver reads pyproject.toml with tomllib`,
  });
}

/** Holds the two contracts documented on `LabSpecSchema` to each other. */
function lintLab(
  entry: LoadedLesson,
  coursePath: string,
  diags: Diagnostic[],
): void {
  const { lesson } = entry;
  if (lesson.lab === undefined) return;

  const ids = lesson.lab.checkpoints.map((c) => c.id);
  for (const id of ids.filter((id, i) => ids.indexOf(id) !== i)) {
    diags.push({
      level: "error",
      rule: "lab-checkpoints",
      file: coursePath,
      message: `lab "${lesson.slug}": duplicate checkpoint id "${id}"`,
    });
  }
  if (!lesson.lab.checkpoints.some((c) => c.required)) {
    diags.push({
      level: "error",
      rule: "lab-checkpoints",
      file: coursePath,
      message: `lab "${lesson.slug}": every checkpoint is optional — at least one must be required, or the lab can never be completed`,
    });
  }

  // The lab's sources land with the draft, like lesson.mdx: a planned lab is
  // still just a line in course.yaml.
  if (STATUS_RANK[lesson.status] < STATUS_RANK.drafted) return;

  for (const name of LAB_FILES) {
    if (existsSync(join(entry.dir, name))) continue;
    diags.push({
      level: "error",
      rule: "lab-files",
      file: join(entry.dir, name),
      message: `lab "${lesson.slug}" is ${lesson.status} but ${name} is missing`,
    });
  }
  if (existsSync(join(entry.dir, "pyproject.toml"))) lintLabPython(entry, diags);

  const challenges = loadChallenges(entry.dir);
  if (!challenges.exists) return; // already reported by lab-files
  if (challenges.error !== undefined) {
    diags.push({
      level: "error",
      rule: "lab-files",
      file: challengesPath(entry.dir),
      message: `lab "${lesson.slug}": ${CHALLENGES_FILE} is invalid: ${challenges.error}`,
    });
    return;
  }

  const missing = ids.filter((id) => !challenges.ids.includes(id));
  const extra = challenges.ids.filter((id) => !ids.includes(id));
  if (missing.length > 0 || extra.length > 0) {
    diags.push({
      level: "error",
      rule: "lab-checkpoints",
      file: challengesPath(entry.dir),
      message: `lab "${lesson.slug}": checkpoint ids differ from course.yaml${
        missing.length > 0 ? ` — only in course.yaml: ${missing.join(", ")}` : ""
      }${extra.length > 0 ? ` — only in ${CHALLENGES_FILE}: ${extra.join(", ")}` : ""}`,
    });
  }

  for (const checkpoint of lesson.lab.checkpoints) {
    const kind = challenges.kinds.get(checkpoint.id);
    if (kind === undefined || kind === checkpoint.kind) continue;
    diags.push({
      level: "error",
      rule: "lab-checkpoints",
      file: challengesPath(entry.dir),
      message: `lab "${lesson.slug}": checkpoint "${checkpoint.id}" is kind "${checkpoint.kind}" in course.yaml but "${kind}" in ${CHALLENGES_FILE}`,
    });
  }
}

export interface LintOptions {
  /** Frontend app root (apps/frontend); enables the registry checks. */
  appRoot?: string;
  /** Extra lesson directories found on disk (orphan check). */
  lessonDirsOnDisk?: string[];
  /** All course slugs in the content tree (cross-course prereq check). */
  allCourseSlugs?: string[];
}

export function lintCourse(
  loaded: LoadedCourse,
  options: LintOptions = {},
): Diagnostic[] {
  const diags: Diagnostic[] = [];
  const coursePath = join(loaded.dir, "course.yaml");
  const { course } = loaded;

  // dup-slug: lessons unique across modules; modules unique.
  const seenLessons = new Set<string>();
  for (const entry of loaded.lessons) {
    if (seenLessons.has(entry.lesson.slug)) {
      diags.push({
        level: "error",
        rule: "dup-slug",
        file: coursePath,
        message: `duplicate lesson slug "${entry.lesson.slug}"`,
      });
    }
    seenLessons.add(entry.lesson.slug);
  }
  const moduleSlugs = course.modules.map((m) => m.slug);
  for (const slug of moduleSlugs.filter((s, i) => moduleSlugs.indexOf(s) !== i)) {
    diags.push({
      level: "error",
      rule: "dup-slug",
      file: coursePath,
      message: `duplicate module slug "${slug}"`,
    });
  }

  // outcomes: modules reference existing outcomes; every outcome claimed.
  const outcomeIds = new Set(course.outcomes.map((o) => o.id));
  const claimed = new Set<string>();
  for (const mod of course.modules) {
    for (const id of mod.outcomes) {
      if (!outcomeIds.has(id)) {
        diags.push({
          level: "error",
          rule: "outcome-unknown",
          file: coursePath,
          message: `module "${mod.slug}" claims unknown outcome "${id}"`,
        });
      }
      claimed.add(id);
    }
  }
  for (const id of outcomeIds) {
    if (!claimed.has(id)) {
      diags.push({
        level: "error",
        rule: "outcome-unclaimed",
        file: coursePath,
        message: `outcome "${id}" is not claimed by any module (C1)`,
      });
    }
  }

  // Course-page fields: key results resolve; cross-course prereqs resolve;
  // intro/sources presence is guidance.
  const bySlug = new Map(loaded.lessons.map((l) => [l.lesson.slug, l]));
  // Spine (L10): steps reference real lessons; core lessons belong to a step.
  const spineLessons = new Set<string>();
  for (const [i, step] of course.spine.entries()) {
    for (const lessonSlug of step.lessons) {
      if (!bySlug.has(lessonSlug)) {
        diags.push({
          level: "error",
          rule: "spine-lesson",
          file: coursePath,
          message: `spine step ${i + 1} ("${step.step.slice(0, 40)}…") names unknown lesson "${lessonSlug}"`,
        });
      }
      spineLessons.add(lessonSlug);
    }
  }
  if (course.spine.length > 0) {
    for (const entry of loaded.lessons) {
      if (entry.lesson.type !== "extra" && !spineLessons.has(entry.lesson.slug)) {
        diags.push({
          level: "warn",
          rule: "spine-coverage",
          file: coursePath,
          message: `core lesson "${entry.lesson.slug}" belongs to no spine step — every core lesson is a move in the argument (L10)`,
        });
      }
    }
  }

  for (const kr of course.key_results) {
    if (!bySlug.has(kr.lesson)) {
      diags.push({
        level: "error",
        rule: "key-result-lesson",
        file: coursePath,
        message: `key result "${kr.text.slice(0, 50)}…" points at unknown lesson "${kr.lesson}"`,
      });
    }
  }
  if (options.allCourseSlugs !== undefined) {
    const courseSlugs = new Set(options.allCourseSlugs);
    for (const prereq of course.prerequisites) {
      if (prereq.course !== undefined && !courseSlugs.has(prereq.course)) {
        diags.push({
          level: "warn",
          rule: "prereq-course",
          file: coursePath,
          message: `course prerequisite links unknown course "${prereq.course}"`,
        });
      }
    }
  }
  if (course.intro === undefined) {
    diags.push({
      level: "warn",
      rule: "course-intro",
      file: coursePath,
      message: "course has no intro for the course page",
    });
  }
  if (course.sources.length === 0) {
    diags.push({
      level: "warn",
      rule: "course-sources",
      file: coursePath,
      message: "course lists no compilation sources",
    });
  }

  // Prerequisite graph: references exist, edges only point backwards.
  for (const entry of loaded.lessons) {
    for (const prereq of entry.lesson.prerequisites) {
      const target = bySlug.get(prereq);
      if (target === undefined) {
        diags.push({
          level: "error",
          rule: "prereq-missing",
          file: coursePath,
          message: `lesson "${entry.lesson.slug}" requires unknown lesson "${prereq}"`,
        });
      } else if (target.index >= entry.index) {
        diags.push({
          level: "error",
          rule: "prereq-cycle",
          file: coursePath,
          message: `lesson "${entry.lesson.slug}" requires "${prereq}", which does not come earlier in the course`,
        });
      } else if (
        target.lesson.type === "extra" &&
        entry.lesson.type !== "extra"
      ) {
        diags.push({
          level: "error",
          rule: "extra-prereq",
          file: coursePath,
          message: `lesson "${entry.lesson.slug}" requires extra lesson "${prereq}" — extra chapters must be skippable, no non-extra lesson may depend on one`,
        });
      }
    }
  }

  // Concepts: resolve + introduced_in cross-check.
  const conceptIds = new Set(loaded.concepts.concepts.map((c) => c.id));
  const introducedBy = new Map<string, string>();
  for (const entry of loaded.lessons) {
    for (const id of [
      ...entry.lesson.concepts.introduces,
      ...entry.lesson.concepts.reinforces,
    ]) {
      if (!conceptIds.has(id)) {
        diags.push({
          level: "error",
          rule: "concept-unknown",
          file: coursePath,
          message: `lesson "${entry.lesson.slug}" references concept "${id}" missing from concepts.yaml`,
        });
      }
    }
    for (const id of entry.lesson.concepts.introduces) {
      introducedBy.set(id, entry.lesson.slug);
    }
  }
  for (const concept of loaded.concepts.concepts) {
    if (introducedBy.get(concept.id) !== concept.introduced_in) {
      diags.push({
        level: "error",
        rule: "concept-introduced-in",
        file: join(loaded.dir, "concepts.yaml"),
        message: `concept "${concept.id}": introduced_in="${concept.introduced_in}" but ${
          introducedBy.has(concept.id)
            ? `lesson "${introducedBy.get(concept.id)}" declares it in introduces`
            : "no lesson introduces it"
        }`,
      });
    }
  }

  // Per-lesson metadata guidance (warnings) + file/registry checks (errors).
  for (const entry of loaded.lessons) {
    const { lesson } = entry;
    if (lesson.est_minutes < 5 || lesson.est_minutes > 45) {
      diags.push({
        level: "warn",
        rule: "est-minutes",
        file: coursePath,
        message: `lesson "${lesson.slug}": est_minutes=${lesson.est_minutes} is outside the 5-45 guidance`,
      });
    }
    const goalVerb = lesson.goal.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (!BLOOM_VERBS.has(goalVerb)) {
      diags.push({
        level: "warn",
        rule: "goal-bloom",
        file: coursePath,
        message: `lesson "${lesson.slug}": goal should start with a Bloom verb, got "${goalVerb}" (L1)`,
      });
    }

    // key-image: the contents thumbnail must exist; rasters must be credited.
    if (lesson.key_image !== undefined) {
      const kiPath = join(entry.dir, lesson.key_image);
      if (!existsSync(kiPath)) {
        diags.push({
          level: "error",
          rule: "key-image",
          file: coursePath,
          message: `lesson "${lesson.slug}": key_image "${lesson.key_image}" does not exist in the lesson directory`,
        });
      } else if (isRasterFile(lesson.key_image)) {
        const probe = probeImageFile(kiPath);
        if (isProbeError(probe)) {
          diags.push({
            level: "error",
            rule: "key-image",
            file: kiPath,
            message: `lesson "${lesson.slug}": key_image is not a usable image: ${probe.error}`,
          });
        }
        if (creditFor(loadCredits(entry.dir), basename(lesson.key_image)) === undefined) {
          diags.push({
            level: "error",
            rule: "key-image",
            file: creditsPath(entry.dir),
            message: `lesson "${lesson.slug}": key_image "${basename(lesson.key_image)}" has no credits.yaml entry`,
          });
        }
      }
    } else if (STATUS_RANK[lesson.status] >= STATUS_RANK.drafted) {
      diags.push({
        level: "warn",
        rule: "key-image",
        file: coursePath,
        message: `lesson "${lesson.slug}" is ${lesson.status} but has no key_image — pick the lesson's signature visual for the course contents`,
      });
    }

    if (STATUS_RANK[lesson.status] >= STATUS_RANK.drafted && entry.mdx === undefined) {
      diags.push({
        level: "error",
        rule: "lesson-files",
        file: entry.mdxPath,
        message: `lesson "${lesson.slug}" is ${lesson.status} but lesson.mdx is missing`,
      });
    }

    // exercise-reference: "exercise 4" in prose is a trap. <Exercise> blocks
    // share one lesson-wide counter, so a lesson with in-body exercises renders
    // its closing set from 2 or 3 — and a numeric reference written against a
    // set that "starts at 1" then names a real but different exercise, which
    // reads as correct. Refer to an exercise by what it does instead.
    // Decimal numbers (MacKay's "exercise 39.2") point outside this course.
    if (entry.mdx !== undefined) {
      const refs = [...entry.mdx.matchAll(/\bexercises?\s+(\d+)(?!\.\d)\b/gi)];
      if (refs.length > 0) {
        const shown = refs.slice(0, 3).map((m) => `"${m[0]}"`).join(", ");
        diags.push({
          level: "warn",
          rule: "exercise-reference",
          file: entry.mdxPath,
          message: `lesson "${lesson.slug}": ${refs.length} numeric exercise reference(s) (${shown}) — name the exercise by what it does; numbers shift when an exercise is added, and in-body exercises already offset the closing set`,
        });
      }
    }

    // demo-registered: reviewed+ lessons with a demo need a registry entry.
    if (
      lesson.demo !== null &&
      STATUS_RANK[lesson.status] >= STATUS_RANK.reviewed &&
      options.appRoot !== undefined
    ) {
      const registry = join(options.appRoot, "components", "demos", "index.ts");
      const registered =
        existsSync(registry) &&
        readFileSync(registry, "utf8").includes(lesson.demo.component);
      if (!registered) {
        diags.push({
          level: "error",
          rule: "demo-registered",
          file: coursePath,
          message: `lesson "${lesson.slug}" is ${lesson.status} but demo "${lesson.demo.component}" is not registered in components/demos/index.ts`,
        });
      }
    }

    lintLab(entry, coursePath, diags);
    lintLessonMdx(entry, new Set(bySlug.keys()), diags, options);
  }

  // intro.mdx: must compile and render like any lesson document.
  if (loaded.introMdx !== undefined) {
    const introPath = join(loaded.dir, "intro.mdx");
    try {
      compileSync(loaded.introMdx, { remarkPlugins: [remarkMath] });
      const mod = evaluateSync(loaded.introMdx, {
        ...jsxRuntime,
        remarkPlugins: [remarkGfm, remarkMath],
      } as never);
      const Stub = (props: { children?: unknown }) =>
        createElement(Fragment, null, props.children as never);
      const components = Object.fromEntries(
        [...ALLOWED_COMPONENTS].map((name) => [name, Stub]),
      ) as Record<string, ComponentType>;
      renderToString(
        createElement(mod.default as ComponentType<{ components: unknown }>, {
          components,
        }),
      );
    } catch (err) {
      diags.push({
        level: "error",
        rule: "intro-mdx",
        file: introPath,
        message: `intro.mdx fails to compile or render: ${(err as Error).message}`,
      });
    }
  }

  // unknown-lesson-dir: directories on disk not declared in course.yaml.
  for (const dirName of options.lessonDirsOnDisk ?? []) {
    if (!bySlug.has(dirName)) {
      diags.push({
        level: "error",
        rule: "unknown-lesson-dir",
        file: join(loaded.dir, "lessons", dirName),
        message: `lesson directory "${dirName}" is not declared in course.yaml`,
      });
    }
  }

  return diags;
}
