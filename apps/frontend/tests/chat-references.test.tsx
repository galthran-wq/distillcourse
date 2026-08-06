import { describe, expect, it } from "vitest";
import type { Lessons } from "@/lib/content/links";
import { LESSONS, rendered, turn } from "./chat-fixture";

function reply(text: string, lessons: Lessons = LESSONS): string {
  return rendered([turn("assistant", { type: "text", text })], lessons);
}

describe("a reference in a reply", () => {
  it("links to the section it names, under the lesson's title", () => {
    const html = reply("See [[lesson:info-theory/entropy#the-average]] for the proof.");

    expect(html).toContain('href="/courses/info-theory/lessons/entropy#the-average"');
    expect(html).toContain(">Entropy</a>");
    expect(html).toContain("for the proof.");
  });

  it("links to the lesson when the locator names no section", () => {
    const html = reply("[[lesson:info-theory/entropy]]");

    expect(html).toContain('href="/courses/info-theory/lessons/entropy"');
  });

  it("shows the label the tutor wrote instead of the title", () => {
    const html = reply("[[lesson:info-theory/entropy|the definition]]");

    expect(html).toContain(">the definition</a>");
    expect(html).not.toContain(">Entropy</a>");
  });

  it("leaves a locator naming a lesson the site does not render as text", () => {
    const html = reply("See [[lesson:info-theory/gone#nowhere]].");

    expect(html).toContain("[[lesson:info-theory/gone#nowhere]]");
    expect(html).not.toContain("<a");
  });

  it("leaves a malformed locator as text rather than breaking the message", () => {
    const html = reply("See [[not a locator]] and [[lesson:Bad Slug/x]].");

    expect(html).toContain("[[not a locator]]");
    expect(html).toContain("[[lesson:Bad Slug/x]]");
    expect(html).not.toContain("<a");
  });

  it("renders a corpus with no page as an unclickable source", () => {
    const html = reply("Shown in [[research:info-theory/infonce|the InfoNCE note]].");

    expect(html).toContain("<cite>the InfoNCE note</cite>");
    expect(html).not.toContain("<a");
  });

  it("renders a concept the search returned as a source, not as brackets", () => {
    const html = reply("See [[concept:info-theory/mutual-information]].");

    expect(html).toContain("<cite>concept:info-theory/mutual-information</cite>");
    expect(html).not.toContain("[[");
  });

  it("links a course locator to the course, under its title", () => {
    const html = reply("Covered in [[course:info-theory]].");

    expect(html).toContain('href="/courses/info-theory"');
    expect(html).toContain(">Information theory</a>");
  });

  it("leaves a course the site does not render as text", () => {
    const html = reply("[[course:not-a-course]]");

    expect(html).toContain("[[course:not-a-course]]");
    expect(html).not.toContain("<a");
  });

  it("keeps the markdown around it — a reference is not a block of its own", () => {
    const html = reply("- first, see [[lesson:info-theory/entropy]]\n- second");

    expect(html).toContain("<li>first, see <a");
    expect(html).toContain("<li>second</li>");
  });

  it("resolves nothing on a page that supplies no lessons", () => {
    const html = reply("[[lesson:info-theory/entropy]]", {});

    expect(html).toContain("[[lesson:info-theory/entropy]]");
  });
});
