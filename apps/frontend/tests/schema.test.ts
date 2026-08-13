import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import {
  ConceptsFileSchema,
  CourseSchema,
} from "@/lib/content/schema";

const FIXTURES = join(__dirname, "fixtures", "information-theory");

function loadYaml(path: string): unknown {
  return parse(readFileSync(path, "utf8"));
}

describe("CourseSchema", () => {
  it("parses the information-theory fixture", () => {
    const course = CourseSchema.parse(loadYaml(join(FIXTURES, "course.yaml")));
    expect(course.slug).toBe("information-theory");
    expect(course.modules).toHaveLength(2);
    expect(course.modules[0].lessons[0].demo?.component).toBe("SurprisalSlider");
    expect(course.modules[1].lessons[1].demo).toBeNull();
  });

  it("rejects a lesson with an invalid status", () => {
    const raw = loadYaml(join(FIXTURES, "course.yaml")) as {
      modules: { lessons: { status: string }[] }[];
    };
    raw.modules[0].lessons[0].status = "done";
    expect(CourseSchema.safeParse(raw).success).toBe(false);
  });

  it("rejects non-kebab-case slugs", () => {
    const raw = loadYaml(join(FIXTURES, "course.yaml")) as { slug: string };
    raw.slug = "Information Theory";
    expect(CourseSchema.safeParse(raw).success).toBe(false);
  });
});

describe("lab lessons", () => {
  /** The fixture with its first lesson turned into whatever the test needs. */
  function withFirstLesson(patch: Record<string, unknown>): unknown {
    const raw = loadYaml(join(FIXTURES, "course.yaml")) as {
      modules: { lessons: Record<string, unknown>[] }[];
    };
    Object.assign(raw.modules[0].lessons[0], patch);
    return raw;
  }

  const spec = {
    est_hours: 4,
    checkpoints: [
      { id: "logloss", kind: "exact", text: "Implement the log-loss" },
      { id: "beat-baseline", kind: "metric", text: "Beat AUC 0.85", required: false },
    ],
  };

  it("parses a lab lesson, defaulting checkpoints to required", () => {
    const course = CourseSchema.parse(withFirstLesson({ type: "lab", lab: spec }));
    const lab = course.modules[0].lessons[0].lab;
    expect(lab?.est_hours).toBe(4);
    expect(lab?.checkpoints.map((c) => c.required)).toEqual([true, false]);
  });

  it("rejects a lab block on a lesson that is not a lab", () => {
    expect(CourseSchema.safeParse(withFirstLesson({ lab: spec })).success).toBe(false);
  });

  it("rejects a lab lesson with no lab block", () => {
    expect(CourseSchema.safeParse(withFirstLesson({ type: "lab" })).success).toBe(false);
  });

  it("rejects a checkpoint of an unknown kind", () => {
    const broken = { ...spec, checkpoints: [{ id: "x", kind: "eyeball", text: "?" }] };
    expect(
      CourseSchema.safeParse(withFirstLesson({ type: "lab", lab: broken })).success,
    ).toBe(false);
  });

  it("leaves a review checkpoint optional unless an author says otherwise", () => {
    // A review is a model's opinion, and an outage leaves that verdict pending
    // with nothing to re-grade it: gating a lesson on one is opt-in.
    const reviews = {
      ...spec,
      checkpoints: [
        ...spec.checkpoints,
        { id: "why-not-mse", kind: "review", text: "Say why not" },
        { id: "why-convex", kind: "review", text: "Say why convex", required: true },
      ],
    };
    const course = CourseSchema.parse(withFirstLesson({ type: "lab", lab: reviews }));

    expect(course.modules[0].lessons[0].lab?.checkpoints.map((c) => c.required)).toEqual(
      [true, false, false, true],
    );
  });

  it("rejects a checkpoint id the checkpoint API could not store", () => {
    // `app/labs/ingest.py` refuses it, and only after the content index has
    // already committed — so it is refused here, where it is still a typo.
    const broken = {
      ...spec,
      checkpoints: [{ id: "a".repeat(65), kind: "exact", text: "?" }],
    };
    expect(
      CourseSchema.safeParse(withFirstLesson({ type: "lab", lab: broken })).success,
    ).toBe(false);
  });
});

describe("ConceptsFileSchema", () => {
  it("parses the fixture registry", () => {
    const file = ConceptsFileSchema.parse(
      loadYaml(join(FIXTURES, "concepts.yaml")),
    );
    expect(file.concepts.map((c) => c.id)).toContain("entropy");
  });
});

