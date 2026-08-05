import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import type { UIMessage } from "ai";
import Messages from "@/components/chat/Messages";
import { attachQuote, dropQuote, setQuote } from "@/lib/chat/quote";
import { LessonsProvider, type Lessons } from "@/lib/content/links";

const LESSONS: Lessons = {
  "lesson:info-theory/entropy": {
    title: "Entropy",
    course: "Information theory",
    href: "/courses/info-theory/lessons/entropy",
  },
};

afterEach(() => {
  dropQuote();
});

function asked(text: string): string {
  const messages: UIMessage[] = [
    { id: "m1", role: "user", parts: [{ type: "text", text }] },
  ];
  return renderToStaticMarkup(
    <LessonsProvider value={LESSONS}>
      <Messages messages={messages} status="ready" />
    </LessonsProvider>,
  );
}

describe("a passage referenced from the lesson", () => {
  it("goes to the tutor above the question, with the section it came from", () => {
    setQuote({
      text: "The entropy is the average surprisal.",
      locator: "lesson:info-theory/entropy#the-average",
    });

    expect(attachQuote("why the average?")).toBe(
      "> The entropy is the average surprisal.\n>\n> — [[lesson:info-theory/entropy#the-average]]\n\nwhy the average?",
    );
  });

  it("is attached once, not to every message after it", () => {
    setQuote({ text: "quoted", locator: "lesson:info-theory/entropy" });
    attachQuote("first");

    expect(attachQuote("second")).toBe("second");
  });

  it("leaves the message alone when nothing is selected", () => {
    expect(attachQuote("plain question")).toBe("plain question");
  });

  it("is dropped when the reader clears it", () => {
    setQuote({ text: "quoted", locator: "lesson:info-theory/entropy" });
    dropQuote();

    expect(attachQuote("plain question")).toBe("plain question");
  });

  it("reads back as a quote with a link to the passage", () => {
    setQuote({
      text: "The entropy is the average surprisal.",
      locator: "lesson:info-theory/entropy#the-average",
    });

    const html = asked(attachQuote("why the average?"));

    expect(html).toContain("<blockquote>");
    expect(html).toContain("The entropy is the average surprisal.");
    expect(html).toContain('href="/courses/info-theory/lessons/entropy#the-average"');
    expect(html).toContain("why the average?");
  });
});
