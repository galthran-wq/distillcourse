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

describe("ConceptsFileSchema", () => {
  it("parses the fixture registry", () => {
    const file = ConceptsFileSchema.parse(
      loadYaml(join(FIXTURES, "concepts.yaml")),
    );
    expect(file.concepts.map((c) => c.id)).toContain("entropy");
  });
});

