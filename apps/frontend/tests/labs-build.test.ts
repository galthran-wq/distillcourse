import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadCourse } from "@/lib/content/load";
import type { Diagnostic } from "@/lib/content/lint";
import { runCourseLabs, type LabRunMode } from "@/lib/labs/build";

const FIXTURE = join(__dirname, "fixtures", "lint-course");
const LAB_DIR = join("lessons", "surprisal-lab");
const PYTHON_DIR = join(__dirname, "..", "lib", "labs", "python");

/** Executing a lab needs its locked environment; without uv there is none. */
const hasUv = spawnSync("uv", ["--version"], { stdio: "ignore" }).status === 0;

const MINUTES = 300_000;
const roots: string[] = [];

interface NotebookCell {
  cell_type: string;
  /** nbformat splits multi-line sources into one string per line. */
  source: string | string[];
  outputs?: unknown[];
  id: string;
}

function text(cell: NotebookCell): string {
  return Array.isArray(cell.source) ? cell.source.join("") : cell.source;
}

interface Built {
  root: string;
  diags: Diagnostic[];
  privatePath: string;
  publicDir: string;
}

function buildFixtureIn(root: string): Built {
  const courseDir = join(root, "content", "courses", "lint-course");
  return {
    root,
    diags: runCourseLabs(loadCourse(courseDir), { repoRoot: root, mode: "build" }),
    privatePath: join(root, "labs-dist", "private", "lint-course", "surprisal-lab.json"),
    publicDir: join(root, "labs-dist", "public", "lint-course", "surprisal-lab"),
  };
}

function buildFixture(mutate?: (labDir: string) => void): Built {
  const root = mkdtempSync(join(tmpdir(), "labs-build-"));
  roots.push(root);
  const courseDir = join(root, "content", "courses", "lint-course");
  cpSync(FIXTURE, courseDir, { recursive: true });
  mutate?.(join(courseDir, LAB_DIR));
  return buildFixtureIn(root);
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

afterAll(() => {
  while (roots.length > 0) rmSync(roots.pop()!, { recursive: true, force: true });
});

describe.skipIf(!hasUv)("lab build", () => {
  let built: Built;
  let priv: string;
  let notebook: { cells: NotebookCell[] };

  beforeAll(() => {
    built = buildFixture();
    priv = readFileSync(built.privatePath, "utf8");
    notebook = JSON.parse(readFileSync(join(built.publicDir, "lab.ipynb"), "utf8"));
  }, MINUTES);

  it("builds the fixture lab green", () => {
    expect(built.diags).toEqual([]);
    expect(filesUnder(built.publicDir).map((p) => p.slice(built.publicDir.length + 1))).toEqual([
      "data/holdout.csv",
      "lab.ipynb",
      "manifest.json",
    ]);
  });

  it("captures the reference data every checkpoint kind needs", () => {
    const artifact = JSON.parse(priv);
    expect(artifact.lab).toBe("lint-course/surprisal-lab");
    expect(artifact.content_version).toMatch(/^[0-9a-f]{64}$/);
    const cp = artifact.checkpoints;
    expect(Object.keys(cp).sort()).toEqual([
      "beat-baseline",
      "entropy-terms",
      "surprisal",
      "why-uniform",
    ]);
    expect(cp.surprisal.expected.values[0]).toHaveLength(16);
    expect(cp.surprisal.wrong[0].hint).toContain("Natural log");
    expect(cp.surprisal.wrong[0].values).not.toEqual(cp.surprisal.expected.values);
    // 20x5 outputs are past the small limit, so only the digest is kept.
    expect(cp["entropy-terms"].expected.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(cp["beat-baseline"].labels).toHaveLength(40);
    expect(cp["beat-baseline"].reference_score).toBeGreaterThan(cp["beat-baseline"].threshold);
    expect(cp["why-uniform"].rubric).toContain("uniform distribution");
  });

  it("carries the public half the checkpoint API serves as the manifest", () => {
    // One file, so a learner's inputs and the outputs they are compared
    // against cannot be two ingests apart.
    const artifact = JSON.parse(priv);
    const manifest = JSON.parse(readFileSync(join(built.publicDir, "manifest.json"), "utf8"));
    for (const [id, checkpoint] of Object.entries<{ kind: string }>(manifest.checkpoints)) {
      const { kind, ...published } = checkpoint;
      expect(artifact.checkpoints[id].kind).toBe(kind);
      expect(artifact.checkpoints[id].public).toEqual(published);
    }
  });

  it("keeps the answer key out of everything the learner can fetch", () => {
    const published = filesUnder(built.publicDir)
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    // The lesson's own `private/` is where the held-out labels are read from,
    // and `data/` is republished file for file — so this is the pair that
    // decides whether the natural layout is also a leak.
    expect(published).not.toContain(
      readFileSync(join(FIXTURE, LAB_DIR, "private", "labels.csv"), "utf8"),
    );
    for (const secret of [
      "BEGIN SOLUTION",
      "END SOLUTION",
      "Pass if the answer names",
      "any concentration of",
      "labels",
      "rubric",
      "expected",
      JSON.parse(priv).checkpoints["entropy-terms"].expected.digest,
    ]) {
      expect(published).not.toContain(secret);
    }
    // The answer key is the grading inputs and nothing else: no model answer,
    // which is the author's own wording. It does reach the tutor, as a line of
    // the reference solution the private half also carries.
    const key = JSON.stringify(JSON.parse(priv).checkpoints);
    expect(key).not.toContain("model_answer");
    expect(key).not.toContain("any concentration of");
  });

  it("publishes the inputs but never the outputs", () => {
    const manifest = JSON.parse(readFileSync(join(built.publicDir, "manifest.json"), "utf8"));
    expect(manifest.content_version).toBe(JSON.parse(priv).content_version);
    expect(manifest.checkpoints.surprisal).toEqual({
      kind: "exact",
      seed: 1337,
      atol: 1e-6,
      inputs_code: "p = rng.random(16) * 0.9 + 0.1\ninputs = (p,)\n",
    });
    expect(manifest.checkpoints["beat-baseline"]).toEqual({
      kind: "metric",
      metric: "roc_auc",
      threshold: 0.85,
      holdout: "data/holdout.csv",
    });
    expect(manifest.checkpoints["why-uniform"]).toEqual({ kind: "review" });
  });

  it("generates a student notebook that opens clean", () => {
    const [badge, setup, login] = notebook.cells;
    expect(badge.cell_type).toBe("markdown");
    expect(text(badge)).toContain(
      "https://colab.research.google.com/github/galthran-wq/distillcourse-labs/blob/main/labs/lint-course/surprisal-lab/lab.ipynb",
    );
    expect(text(setup)).toContain("%pip install -q numpy==2.3.1");
    expect(text(setup)).toContain("#subdirectory=client");
    expect(text(setup)).toContain("!wget -q -O data/holdout.csv");
    expect(text(setup)).toContain('distill.open_lab("lint-course/surprisal-lab")');
    // Pairing has a cell of its own: it fails and is re-run on its own
    // occasions, and it ships ready to run — no placeholder to edit.
    expect(login.cell_type).toBe("code");
    expect(text(login)).toContain("distill.login()");
    expect(text(login)).not.toContain("PASTE");

    const body = notebook.cells.map(text).join("\n");
    expect(body.match(/# YOUR CODE HERE/g)).toHaveLength(3);
    // The blank that swallowed a whole function body needs a statement.
    expect(body.match(/raise NotImplementedError/g)).toHaveLength(1);
    // A cell that was nothing but a solution span is the blank, not nothing.
    expect(notebook.cells.map(text)).toContain("# YOUR CODE HERE");
    expect(body).toContain('distill.submit_review("why-uniform", "YOUR ANSWER HERE")');
    expect(body).toContain('distill.check("surprisal", surprisal)');
    expect(body).not.toContain("distill.dump");
    expect(body).not.toContain("np.log2(p)");
    expect(body.match(/distill\.open_lab/g)).toHaveLength(1);
    expect(notebook.cells.every((c) => (c.outputs ?? []).length === 0)).toBe(true);
    expect(notebook.cells[0].id).toBe("c000");
  });

  it("produces identical private artifacts on a second build", () => {
    const again = buildFixture();
    expect(again.diags).toEqual([]);
    expect(readFileSync(again.privatePath, "utf8")).toBe(priv);
  }, MINUTES);

  it("names the checkpoint a broken solution breaks", () => {
    const broken = buildFixture((labDir) => {
      const path = join(labDir, "solution.py");
      writeFileSync(
        path,
        readFileSync(path, "utf8").replace("return -np.log2(p)", "return -np.log(p)"),
      );
    });
    expect(broken.diags).toHaveLength(1);
    expect(broken.diags[0].level).toBe("error");
    expect(broken.diags[0].rule).toBe("lab-build");
    expect(broken.diags[0].message).toContain('checkpoint "surprisal"');
    expect(existsSync(broken.privatePath)).toBe(false);
  }, MINUTES);

  it("fails the build when a mistyped marker leaves the solution in", () => {
    const broken = buildFixture((labDir) => {
      const path = join(labDir, "solution.py");
      writeFileSync(
        path,
        readFileSync(path, "utf8").replace("    # END SOLUTION", "    #END SOLUTION"),
      );
    });
    expect(broken.diags).toHaveLength(1);
    expect(broken.diags[0].level).toBe("error");
    expect(broken.diags[0].message).toContain("solution marker");
    expect(existsSync(broken.publicDir)).toBe(false);
  }, MINUTES);

  it("writes nothing in check mode", () => {
    const root = mkdtempSync(join(tmpdir(), "labs-check-mode-"));
    roots.push(root);
    const courseDir = join(root, "content", "courses", "lint-course");
    cpSync(FIXTURE, courseDir, { recursive: true });
    const diags = runCourseLabs(loadCourse(courseDir), { repoRoot: root, mode: "check" });
    expect(diags).toEqual([]);
    expect(existsSync(join(root, "labs-dist", "public"))).toBe(false);
    expect(existsSync(join(root, "labs-dist", "private"))).toBe(false);
  }, MINUTES);

  it.each(["check_canon_vectors.py", "check_metric_vectors.py"])(
    "matches the committed vectors in %s",
    (script) => {
      const result = spawnSync(
        "uv",
        ["run", "--no-project", "--with", "numpy", "--with", "pyyaml", "python", script],
        { cwd: PYTHON_DIR, encoding: "utf8" },
      );
      expect(result.stderr + result.stdout).toContain("vectors match");
      expect(result.status).toBe(0);
    },
    MINUTES,
  );

  it("writes the private artifact in the shape the other two ends read", () => {
    // The build is the only end that produces this file; the backend's ingest
    // tests and the client's fake restate its shape from the same pinned list.
    const shapes = JSON.parse(readFileSync(join(PYTHON_DIR, "wire_shapes.json"), "utf8"));
    const artifact = JSON.parse(priv);
    expect(Object.keys(artifact).sort()).toEqual([...shapes.private_artifact].sort());
    for (const record of Object.values<Record<string, unknown>>(artifact.checkpoints)) {
      expect(Object.keys(record).sort()).toEqual(
        [...shapes.private_checkpoint[record.kind as string]].sort(),
      );
    }
  });

  it("hands the reference solution to the private half, as authored", () => {
    // The tutor of a lab chat reads it from the API, which reaches content
    // only through what is ingested — never from content/.
    expect(JSON.parse(priv).solution).toBe(
      readFileSync(join(FIXTURE, LAB_DIR, "solution.py"), "utf8"),
    );
  });

  it("retires the artifacts of a lab that no longer exists", () => {
    // The ingest reads the private half as the complete list of labs, so an
    // artifact nothing rebuilds is an answer key nothing can retire.
    const stale = join(built.privatePath, "..", "gone-lab.json");
    writeFileSync(stale, "{}");
    const staleDir = join(built.publicDir, "..", "gone-lab");
    cpSync(built.publicDir, staleDir, { recursive: true });

    buildFixtureIn(built.root);

    expect(existsSync(stale)).toBe(false);
    expect(existsSync(staleDir)).toBe(false);
    expect(existsSync(built.privatePath)).toBe(true);
  }, MINUTES);

  it("skips a lab whose inputs are unchanged and reruns one whose inputs changed", () => {
    const before = statSync(built.privatePath).mtimeMs;
    expect(buildFixtureIn(built.root).diags).toEqual([]);
    expect(statSync(built.privatePath).mtimeMs).toBe(before);

    const solution = join(built.root, "content", "courses", "lint-course", LAB_DIR, "solution.py");
    writeFileSync(solution, `${readFileSync(solution, "utf8")}\n`);
    expect(buildFixtureIn(built.root).diags).toEqual([]);
    expect(statSync(built.privatePath).mtimeMs).toBeGreaterThan(before);
  }, MINUTES);
});

describe("a machine without uv", () => {
  function diagnose(mode: LabRunMode): Diagnostic[] {
    const root = mkdtempSync(join(tmpdir(), "labs-no-uv-"));
    roots.push(root);
    const courseDir = join(root, "content", "courses", "lint-course");
    cpSync(FIXTURE, courseDir, { recursive: true });
    const path = process.env.PATH;
    process.env.PATH = join(root, "no-tools-here");
    try {
      return runCourseLabs(loadCourse(courseDir), { repoRoot: root, mode });
    } finally {
      process.env.PATH = path;
    }
  }

  it("fails both the build and the validator", () => {
    // A lab whose solution was never executed is unvalidated content, and
    // validate is the gate that says so.
    for (const mode of ["build", "check"] as const) {
      expect(diagnose(mode)).toEqual([
        expect.objectContaining({ level: "error", rule: "lab-build" }),
      ]);
    }
  });
});
