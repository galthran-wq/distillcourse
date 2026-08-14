import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { STATUS_RANK, type LoadedCourse, type LoadedLesson } from "../content/load";
import type { Diagnostic } from "../content/lint";
import { CLIENT_INSTALL, colabUrl, rawUrlBase } from "./mirror";

/**
 * Building a lab means running it: the reference solution is executed in the
 * lab's own locked environment, and what it produces becomes the answer key.
 * A solution that does not run is not content, so a failure here is an error
 * of the same weight as unparsable MDX.
 *
 * Everything the run touches is a copy in a temp directory — content/ is read
 * only — and the artifacts land split in two: `labs-dist/public/` (the student
 * notebook, the manifest, data files) goes to the mirror, `labs-dist/private/`
 * (expected outputs, secret labels, rubrics) goes to the checkpoint API.
 */

/**
 * Copied into the run directory; the rest of the lesson is irrelevant here.
 * `data/` is republished to the mirror verbatim, `private/` never leaves the
 * run — held-out labels and anything else a checkpoint is graded against read
 * from there, so the natural file layout is not also a leak.
 */
const LAB_SOURCES = [
  "solution.py",
  "challenges.yaml",
  "pyproject.toml",
  "uv.lock",
  "data",
  "private",
];

/** A lab that outruns this is miscalibrated, not slow. */
const TIMEOUT_MS = 30 * 60 * 1000;

const PYTHON_DIR = join(__dirname, "python");

export type LabRunMode = "build" | "check";

export interface LabRunOptions {
  repoRoot: string;
  /** `check` throws the artifacts away: validate gates, it does not publish. */
  mode: LabRunMode;
  /** Restrict the run to one lesson slug. */
  lesson?: string;
}

export function runCourseLabs(loaded: LoadedCourse, options: LabRunOptions): Diagnostic[] {
  const targets = loaded.lessons.filter(
    (entry) =>
      entry.lesson.type === "lab" &&
      STATUS_RANK[entry.lesson.status] >= STATUS_RANK.drafted &&
      (options.lesson === undefined || entry.lesson.slug === options.lesson),
  );
  const course = basename(loaded.dir);
  const distRoot = join(options.repoRoot, "labs-dist");
  // Before the early return, because a course that lost its last lab is
  // exactly the case whose leftovers ingest would go on serving. Skipped when
  // the run is one lesson's: the rest were not asked for, not deleted.
  if (options.mode === "build" && options.lesson === undefined) {
    retireLabs(
      distRoot,
      course,
      targets.map((entry) => entry.lesson.slug),
    );
  }
  if (targets.length === 0) return [];

  if (spawnSync("uv", ["--version"], { stdio: "ignore" }).status !== 0) {
    return [
      {
        // An error in both modes: a lab whose solution was never executed is
        // unvalidated content, and validate is the gate that says so. uv is a
        // dependency of validating a course that has labs in it.
        level: "error",
        rule: "lab-build",
        file: join(loaded.dir, "course.yaml"),
        message: `${targets.length} lab lesson(s) left unbuilt: uv is not installed`,
      },
    ];
  }

  const outRoot =
    options.mode === "check" ? mkdtempSync(join(tmpdir(), "labs-check-")) : distRoot;
  try {
    return targets.flatMap((entry) =>
      buildLab(course, entry, outRoot, join(distRoot, ".venvs")),
    );
  } finally {
    if (options.mode === "check") rmSync(outRoot, { recursive: true, force: true });
  }
}

const HALVES = ["private", "public"] as const;

/**
 * One directory of `labs-dist/`, cut back to the names that still exist. The
 * ingest reads the private half as the complete list of the labs there are,
 * so an artifact nothing rebuilds is an answer key nothing can retire.
 */
function keepOnly(dir: string, kept: Set<string>): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    // A lab is `private/<slug>.json` on one side of the split and
    // `public/<slug>/` on the other; a course is a bare name in both.
    if (kept.has(basename(entry, ".json"))) continue;
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

function retireLabs(distRoot: string, course: string, slugs: string[]): void {
  for (const half of HALVES) keepOnly(join(distRoot, half, course), new Set(slugs));
}

/** The same sweep one level up: a course whose directory is gone. */
export function retireCourses(repoRoot: string, courses: string[]): void {
  const kept = new Set(courses);
  for (const half of HALVES) keepOnly(join(repoRoot, "labs-dist", half), kept);
}

function buildLab(
  course: string,
  entry: LoadedLesson,
  outRoot: string,
  venvRoot: string,
): Diagnostic[] {
  const lab = `${course}/${entry.lesson.slug}`;
  const runDir = mkdtempSync(join(tmpdir(), "lab-run-"));
  try {
    for (const name of LAB_SOURCES) {
      const source = join(entry.dir, name);
      if (existsSync(source)) cpSync(source, join(runDir, name), { recursive: true });
    }
    cpSync(join(PYTHON_DIR, "distill_capture.py"), join(runDir, "distill.py"));
    const configPath = join(runDir, "build-config.json");
    writeFileSync(
      configPath,
      JSON.stringify({
        lab,
        public_dir: join(outRoot, "public", course, entry.lesson.slug),
        private_path: join(outRoot, "private", course, `${entry.lesson.slug}.json`),
        cell_timeout: TIMEOUT_MS / 1000,
        colab_url: colabUrl(lab),
        raw_url_base: rawUrlBase(lab),
        client_install: CLIENT_INSTALL,
      }),
    );

    console.log(`build-labs: ${lab} — executing the reference solution`);
    const result = spawnSync(
      "uv",
      [
        "run",
        "--frozen",
        ...["jupytext", "nbclient", "ipykernel", "pyyaml"].flatMap((p) => ["--with", p]),
        "python",
        join(PYTHON_DIR, "build_lab.py"),
        configPath,
      ],
      {
        cwd: runDir,
        encoding: "utf8",
        timeout: TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
        env: {
          ...process.env,
          // Keeps uv's environment out of the run directory, so the lab's deps
          // are resolved once and reused across builds.
          UV_PROJECT_ENVIRONMENT: join(venvRoot, course, entry.lesson.slug),
        },
      },
    );
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.status === 0) return [];
    return [
      {
        level: "error",
        rule: "lab-build",
        file: join(entry.dir, "solution.py"),
        message: failure(result),
      },
    ];
  } finally {
    rmSync(runDir, { recursive: true, force: true });
  }
}

/** The driver ends every failure with a `lab-build:` line; the rest is noise. */
function failure(result: SpawnSyncReturns<string>): string {
  if (result.signal !== null) {
    return `killed after ${TIMEOUT_MS / 60_000} minutes — the wall-clock cap is per lab`;
  }
  const stderr = result.stderr ?? String(result.error ?? "");
  const reported = stderr
    .split("\n")
    .filter((line) => line.startsWith("lab-build: "))
    .map((line) => line.slice("lab-build: ".length));
  if (reported.length > 0) return reported.join("; ");
  const tail = stderr.trim().split("\n").slice(-8).join(" | ");
  return tail === "" ? `uv exited with status ${result.status}` : tail;
}
