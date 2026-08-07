import { afterEach, describe, expect, it, vi } from "vitest";
import { isReadable, previewMode } from "@/lib/content/visibility";
import type { LoadedLesson } from "@/lib/content/load";

function lesson(status: LoadedLesson["lesson"]["status"], mdx?: string): LoadedLesson {
  return {
    lesson: {
      slug: "x",
      title: "X",
      goal: "g",
      est_minutes: 10,
      status,
    } as LoadedLesson["lesson"],
    moduleSlug: "m",
    index: 0,
    dir: "/nowhere",
    mdxPath: "/nowhere/lesson.mdx",
    mdx,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("previewMode", () => {
  it("is off in a production-like environment", () => {
    // vitest runs with NODE_ENV=test and no CONTENT_PREVIEW
    expect(previewMode()).toBe(false);
  });

  it("is on with CONTENT_PREVIEW=1", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    expect(previewMode()).toBe(true);
  });
});

describe("isReadable", () => {
  it("requires published status outside preview mode", () => {
    expect(isReadable(lesson("published", "# hi"))).toBe(true);
    expect(isReadable(lesson("reviewed", "# hi"))).toBe(false);
    expect(isReadable(lesson("drafted", "# hi"))).toBe(false);
    expect(isReadable(lesson("planned", "# hi"))).toBe(false);
  });

  it("accepts drafted and reviewed in preview mode, but never planned", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    expect(isReadable(lesson("drafted", "# hi"))).toBe(true);
    expect(isReadable(lesson("reviewed", "# hi"))).toBe(true);
    expect(isReadable(lesson("planned", "# hi"))).toBe(false);
  });

  it("never reads a lesson whose MDX file is missing", () => {
    vi.stubEnv("CONTENT_PREVIEW", "1");
    expect(isReadable(lesson("published", undefined))).toBe(false);
  });
});
