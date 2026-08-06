import { afterEach, describe, expect, it } from "vitest";
import { dropQuote, setQuote, takeQuote, unfenced } from "@/lib/chat/quote";
import { rendered, turn } from "./chat-fixture";

const PASSAGE = {
  text: "The entropy is the average surprisal.",
  locator: "lesson:info-theory/entropy#the-average",
};

// The message as the backend stored it: the passage above the question, inside
// the provenance fence it writes (app/harness/prompts.learner_quote).
const STORED = [
  '<untrusted source="learner-quote">',
  `> ${PASSAGE.text}`,
  ">",
  `> — [[${PASSAGE.locator}]]`,
  "</untrusted>",
  "",
  "why the average?",
].join("\n");

afterEach(() => {
  dropQuote();
});

function asked(text: string): string {
  return rendered([turn("user", { type: "text", text })]);
}

describe("a passage referenced from the lesson", () => {
  it("travels with the next message, as data for the backend to fence", () => {
    setQuote(PASSAGE);

    expect(takeQuote()).toEqual(PASSAGE);
  });

  it("is spent by one message, not attached to every one after it", () => {
    setQuote(PASSAGE);
    takeQuote();

    expect(takeQuote()).toBeNull();
  });

  it("is dropped when the reader clears it", () => {
    setQuote(PASSAGE);
    dropQuote();

    expect(takeQuote()).toBeNull();
  });

  it("reads back as a quote with a link to the passage", () => {
    const html = asked(STORED);

    expect(html).toContain("<blockquote>");
    expect(html).toContain(PASSAGE.text);
    expect(html).toContain('href="/courses/info-theory/lessons/entropy#the-average"');
    expect(html).toContain("why the average?");
    // The fence is provenance for the model, not something the reader reads.
    expect(html).not.toContain("untrusted");
  });

  it("leaves a message that carries no quote alone", () => {
    expect(unfenced("plain question")).toBe("plain question");
    // A fence the tutor wrote about something else is not a quote block, so it
    // is not unwrapped: only the one the composer's selection produces is.
    expect(unfenced('<untrusted source="web_search">\nhits\n</untrusted>')).toContain(
      "untrusted",
    );
  });
});
