import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { LessonsProvider, type Lessons } from "@/lib/content/links";

const LESSONS: Lessons = {
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

function reply(text: string, lessons: Lessons = LESSONS): string {
  const messages: UIMessage[] = [
    { id: "m1", role: "assistant", parts: [{ type: "text", text }] },
  ];
  return renderToStaticMarkup(
    <LessonsProvider value={lessons}>
      <Messages messages={messages} status="ready" />
    </LessonsProvider>,
  );
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
