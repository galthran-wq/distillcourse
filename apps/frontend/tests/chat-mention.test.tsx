// @vitest-environment jsdom
import { act, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The chip a reference is drawn as is a link into the site, and following one
// is a client-side navigation on a page that has no router under it here. The
// stand-in is what the router does to the press: it takes it off the document,
// leaving the handler that scrolls to the section (`lib/lesson/anchor`).
vi.mock("next/link", () => ({
  default: ({ href, onClick, className, children }: ComponentProps<"a">) => (
    <a
      href={href}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
    >
      {children}
    </a>
  ),
}));

import { asked, mentions, typingAt, write, type Mention } from "@/lib/chat/mention";
import { LESSONS, SECTIONS, composing, rendered, shown, turn } from "./chat-fixture";
import { stubResizeObserver, stubScrollIntoView, type } from "./utils/dom";

stubResizeObserver();
const scrolled = stubScrollIntoView();

/** What the autocomplete offers for a draft whose caret is at its end. */
function offered(draft: string): Mention[] {
  const typing = typingAt(draft, draft.length);
  return typing === null ? [] : mentions(typing, LESSONS, SECTIONS);
}

function titles(draft: string): string[] {
  return offered(draft).map((one) => one.title);
}

describe("the reference being typed", () => {
  it("is whatever follows an @ the caret is still inside", () => {
    expect(typingAt("@us-hist", 8)?.typed).toBe("us-hist");
    // The caret put back into a reference written earlier reads the same.
    expect(typingAt("@us-history and more", 5)?.typed).toBe("us-h");
  });

  it("is not an @ in the middle of a word", () => {
    expect(typingAt("write to me@example.com", 23)).toBeNull();
  });

  it("ends at the space after it", () => {
    expect(typingAt("@us-history and", 15)).toBeNull();
  });

  it("descends a level on each separator", () => {
    const lesson = typingAt("@us-history/indig", 17);
    expect(lesson).toMatchObject({ course: "us-history", typed: "indig" });
    expect(lesson?.inSections).toBe(false);

    const section = typingAt("@us-history/indigenous-america#cah", 34);
    expect(section).toMatchObject({
      course: "us-history",
      lesson: "indigenous-america",
      inSections: true,
      typed: "cah",
    });
  });
});

describe("what the autocomplete offers", () => {
  it("offers every course and lesson to a bare @", () => {
    expect(titles("@")).toEqual([
      "US history",
      "Information theory",
      "Indigenous America",
      "European empires",
      "Entropy",
    ]);
  });

  it("narrows to a course and the lessons in it", () => {
    expect(titles("@us")).toEqual([
      "US history",
      "Indigenous America",
      "European empires",
    ]);
  });

  it("matches a title as well as a slug, word by word", () => {
    // Neither the slug nor the title of the lesson starts with "amer".
    expect(titles("@amer")).toEqual(["Indigenous America"]);
    // A word inside a slug counts too: `us-history` is not typed from "hist".
    expect(titles("@hist")).toEqual(["US history", "Indigenous America", "European empires"]);
  });

  it("offers nothing for a name no course or lesson has", () => {
    expect(titles("@quantum")).toEqual([]);
  });

  it("descends into a course's lessons on a slash", () => {
    expect(titles("@us-history/")).toEqual(["Indigenous America", "European empires"]);
    expect(titles("@us-history/euro")).toEqual(["European empires"]);
    // The other course's lessons are not in this one.
    expect(titles("@us-history/entropy")).toEqual([]);
  });

  it("descends into a lesson's sections on a hash, under their headings", () => {
    expect(titles("@us-history/indigenous-america#")).toEqual([
      "Cahokia and the Mississippians",
      "The mound",
      "The Southwest",
    ]);
    expect(titles("@us-history/indigenous-america#cah")).toEqual([
      "Cahokia and the Mississippians",
    ]);
  });

  it("names each row by the locator the message will carry", () => {
    expect(offered("@us-history").map((one) => one.locator)).toContain(
      "course:us-history",
    );
    expect(offered("@us-history/indig")[0].locator).toBe(
      "lesson:us-history/indigenous-america",
    );
    expect(offered("@us-history/indigenous-america#cah")[0].locator).toBe(
      "lesson:us-history/indigenous-america#cahokia",
    );
  });

  it("names a row's course only where the rows are in more than one", () => {
    // "European empires" and "Entropy" are in different courses.
    expect(offered("@e").map((one) => one.under)).toEqual([
      "US history",
      "Information theory",
    ]);
    // One course between them, and saying so down every row is noise.
    expect(offered("@us").every((one) => one.under === "")).toBe(true);
    expect(offered("@us-history/")[0].under).toBe("");
    expect(offered("@us-history/indigenous-america#")[0].under).toBe("");
  });

  it("offers no section for a lesson the site does not render", () => {
    expect(titles("@us-history/withdrawn#")).toEqual([]);
  });
});

describe("choosing a row", () => {
  it("writes the whole reference over what was typed, in place", () => {
    const draft = "how does @us-hi bear on trade?";
    const typing = typingAt(draft, 15);
    const chosen = mentions(typing!, LESSONS, SECTIONS)[0];

    expect(write(draft, typing!, chosen)).toEqual({
      draft: "how does @us-history bear on trade?",
      caret: 20,
    });
  });

  it("replaces the whole of a reference the caret went back into", () => {
    const draft = "@us-his and more";
    // Between the "s" and the "t": the list narrows on "us-hi", and what is
    // written over is the reference, not the part before the caret.
    const typing = typingAt(draft, 6);
    expect(typing?.typed).toBe("us-hi");

    expect(write(draft, typing!, mentions(typing!, LESSONS, SECTIONS)[0])).toEqual({
      draft: "@us-history and more",
      caret: 11,
    });
  });
});

describe("the question as it is sent", () => {
  it("carries each reference as the locator the harness resolves", () => {
    expect(asked("what is @us-history/indigenous-america#cahokia", LESSONS)).toBe(
      "what is [[lesson:us-history/indigenous-america#cahokia]]",
    );
    expect(asked("@us-history/indigenous-america is where", LESSONS)).toBe(
      "[[lesson:us-history/indigenous-america]] is where",
    );
    expect(asked("start with @us-history", LESSONS)).toBe(
      "start with [[course:us-history]]",
    );
  });

  it("leaves an @ that names nothing the site renders as the text it is", () => {
    expect(asked("write to me@example.com", LESSONS)).toBe("write to me@example.com");
    expect(asked("ask @nobody/at-all about it", LESSONS)).toBe(
      "ask @nobody/at-all about it",
    );
    expect(asked("@us-history/withdrawn", LESSONS)).toBe("@us-history/withdrawn");
  });

  it("ends a reference where the anchor does, not where the sentence does", () => {
    // rehype-slug writes an anchor out of letters, digits and hyphens, so the
    // punctuation after one is punctuation and not part of what is pointed at.
    expect(asked("what is @info-theory/entropy#the-average?", LESSONS)).toBe(
      "what is [[lesson:info-theory/entropy#the-average]]?",
    );
    expect(asked("see @info-theory/entropy#the-average, above", LESSONS)).toBe(
      "see [[lesson:info-theory/entropy#the-average]], above",
    );
    // The letters it keeps are the letters of whatever script the heading is
    // written in, which is why the class is not "anything but a space".
    expect(asked("read @info-theory/entropy#энтропия-ℓ.", LESSONS)).toBe(
      "read [[lesson:info-theory/entropy#энтропия-ℓ]].",
    );
  });

  it("carries several of them, and the words between", () => {
    expect(
      asked("@us-history/indigenous-america or @info-theory/entropy?", LESSONS),
    ).toBe(
      "[[lesson:us-history/indigenous-america]] or [[lesson:info-theory/entropy]]?",
    );
  });
});

describe("the chip a sent reference is drawn as", () => {
  const transcript = shown();
  // The page the chip lands on: following one scrolls to the heading it names
  // and marks it, which needs that heading to be in the document.
  let heading: HTMLHeadingElement;

  beforeEach(() => {
    heading = document.createElement("h2");
    heading.id = "the-average";
    document.body.append(heading);
  });

  afterEach(() => heading.remove());

  /** The reader's question, as the composer rewrote it on the way out. */
  function question(draft: string): string {
    return rendered([turn("user", { type: "text", text: asked(draft, LESSONS) })]);
  }

  it("is a chip on the section it names, never the brackets around it", () => {
    const html = question("what happened at @info-theory/entropy#the-average");

    expect(html).toContain(
      'href="/courses/info-theory/lessons/entropy#the-average"',
    );
    // Under the section's own heading, which is what the reader chose.
    expect(html).toContain(">The average surprisal</a>");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("@info-theory");
    // The chip's line, not the prose link's.
    expect(html).toContain("rounded-sm border border-line");
  });

  it("keeps the sentence around it", () => {
    const html = question("what happened at @info-theory/entropy, exactly?");

    expect(html).toContain("what happened at");
    expect(html).toContain(", exactly?");
    expect(html).toContain(">Entropy</a>");
  });

  it("scrolls to the section and marks it when it is followed", async () => {
    transcript.show([
      turn("user", {
        type: "text",
        text: asked("what is @info-theory/entropy#the-average", LESSONS),
      }),
    ]);

    const chip = transcript.host().querySelector("a");
    act(() => chip?.click());
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // The same landing a reference the tutor wrote gets (lib/lesson/anchor).
    expect(heading.classList.contains("anchor-flash")).toBe(true);
    expect(scrolled).toHaveBeenCalled();
  });
});

describe("the composer's autocomplete", () => {
  const { host, field, press, listed, sent } = composing();

  /** The chips above the field: what the message is pointed at. */
  function chips(): string[] {
    return [...host().querySelectorAll<HTMLElement>("a")].map(
      (chip) => chip.textContent ?? "",
    );
  }

  it("opens on an @ and narrows as the reader types", () => {
    type(field(), "@");
    expect(listed()).toContain("US history");

    type(field(), "@amer");
    expect(listed()).toEqual(["Indigenous America"]);
  });

  it("stays out of a question with no reference in it", () => {
    type(field(), "why is this true?");

    expect(listed()).toEqual([]);
    expect(field().getAttribute("aria-expanded")).toBeNull();
  });

  it("writes the reference the reader takes, and shows it as a chip", () => {
    type(field(), "what about @amer");
    press("Enter");

    expect(field().value).toBe("what about @us-history/indigenous-america");
    // The list has said what it had to say; the sentence goes on.
    expect(listed()).toEqual([]);
    expect(chips()).toEqual(["Indigenous America"]);
    // Never the brackets: those are what the message carries, not what it reads.
    expect(host().textContent).not.toContain("[[");
  });

  it("goes on into the sections of the lesson it just wrote", () => {
    type(field(), "@us-history/indigenous-america#");

    expect(listed()).toEqual([
      "Cahokia and the Mississippians",
      "The mound",
      "The Southwest",
    ]);

    press("Enter");
    expect(field().value).toBe("@us-history/indigenous-america#cahokia");
    expect(chips()).toEqual(["Cahokia and the Mississippians"]);
  });

  it("puts the caret after a reference it rewrote to what it already read", () => {
    // The caret goes back into the middle of a finished reference — between
    // the "h" and the "o" of "cahokia" — so the row the list offers is the one
    // already written and taking it changes nothing about the draft.
    type(field(), "@us-history/indigenous-america#cahokia and more", 34);
    expect(listed()).toEqual(["Cahokia and the Mississippians"]);

    press("Enter");

    expect(field().value).toBe("@us-history/indigenous-america#cahokia and more");
    // At the end of the reference, which is where the next keystroke belongs —
    // not back in the middle of it, where the draft not having changed would
    // otherwise have left it.
    expect(field().selectionStart).toBe(38);
  });

  it("carries the row the arrows walk to into view with them", () => {
    type(field(), "@");
    scrolled.mockClear();

    press("ArrowDown");

    // The list is capped: the row Enter takes has to be a row that can be read.
    expect(scrolled).toHaveBeenCalledWith({ block: "nearest" });
  });

  it("sends the locator, not the @ the reader wrote", () => {
    type(field(), "@us-history/indigenous-america#cahokia what was traded?");
    press("Enter");

    expect(sent).toEqual([
      "[[lesson:us-history/indigenous-america#cahokia]] what was traded?",
    ]);
  });
});
