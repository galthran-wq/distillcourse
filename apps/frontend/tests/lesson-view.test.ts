import { describe, expect, it } from "vitest";
import { fixtureContent } from "./utils/content";

// Three lessons in course.yaml: `intro-surprise`, `next-steps` (planned, no
// MDX) and `surprisal-lab`.
fixtureContent("lint-course");

const { getLessonView } = await import("@/lib/content/site");

describe("a lesson's place in its course", () => {
  it("counts every lesson in course.yaml, planned ones too", () => {
    expect(getLessonView("lint-course", "intro-surprise")?.total).toBe(3);
  });

  it("neighbours only on readable lessons, none past either end", () => {
    const first = getLessonView("lint-course", "intro-surprise");
    const last = getLessonView("lint-course", "surprisal-lab");

    expect(first?.prev).toBeUndefined();
    expect(first?.next?.lesson.slug).toBe("surprisal-lab");
    expect(last?.prev?.lesson.slug).toBe("intro-surprise");
    expect(last?.next).toBeUndefined();
    // Its number is its place among all three, not among the readable two.
    expect(last?.entry.index).toBe(2);
  });
});
