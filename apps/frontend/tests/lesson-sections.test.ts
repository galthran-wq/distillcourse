import { describe, expect, it } from "vitest";
import { fixtureContent } from "./utils/content";

/**
 * The index the `@`-autocomplete's sections come out of, built off the real
 * course tree rather than off a literal — every other test in the feature
 * hands the composer a `LessonSections` written by hand, which says nothing
 * about whether the build ever produces one.
 */
fixtureContent("lint-course");

const { getLessonSections } = await import("@/lib/content/site");

describe("the section index the build ships", () => {
  it("keys every readable lesson by its locator, under its own headings", async () => {
    const sections = await getLessonSections();

    // The lab lesson is in there too: a lab is a lesson, so its brief is a
    // place a question can point at like any chapter.
    expect(Object.keys(sections)).toEqual([
      "lesson:lint-course/intro-surprise",
      "lesson:lint-course/surprisal-lab",
    ]);
    // The lesson's h2s, with the ids rehype-slug put on the page itself.
    expect(sections["lesson:lint-course/intro-surprise"]).toEqual([
      {
        depth: 2,
        text: "Information and probability",
        id: "information-and-probability",
      },
      { depth: 2, text: "Exercises", id: "exercises" },
    ]);
  });

  it("leaves out the lessons the site does not render", async () => {
    // `next-steps` is planned and has no MDX: it is listed as upcoming on the
    // course page and is not a place a question can point at.
    const sections = await getLessonSections();

    expect(sections).not.toHaveProperty("lesson:lint-course/next-steps");
  });
});
