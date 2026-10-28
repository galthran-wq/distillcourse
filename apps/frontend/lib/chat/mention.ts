import { courseTitle } from "@/lib/chat/references";
import { courseNames, type Lessons } from "@/lib/content/links";
import { lessonKey, lessonParts, sectionKey } from "@/lib/content/locator";
import type { LessonSections } from "@/lib/content/site";

/**
 * The `@`-reference the reader writes into a question, as opposed to the
 * `[[locator]]` the tutor writes into an answer (`./references`). It is
 * written `@course`, `@course/lesson` or `@course/lesson#anchor` — the path
 * the site's own URLs have — and every one of those three is a place worth
 * pointing at, so every one of them is a row the autocomplete can stop on.
 *
 * The message carries the locator, not this: `asked()` below rewrites each
 * reference that names something the site renders as it is sent. What the
 * composer shows is this form, because a textarea can only hold text and
 * `[[lesson:us-history/indigenous-america#cahokia]]` is not a thing to read
 * in the middle of a sentence — the chips above the field are.
 */

const SLUG = "[a-z0-9-]";
// An anchor is not a slug — rehype-slug writes whatever the heading gives it,
// including the letters of whatever script it is written in — but it is not
// "anything but a space" either: it keeps letters, digits and `-` and drops
// the rest. The narrower class is what stops the full stop that ends the
// sentence from being read as part of the section it ends.
const ANCHOR = "[\\p{L}\\p{N}_-]";

// Written at the start of the line or after a space, so an email address in a
// question is an email address.
const WRITTEN = new RegExp(
  `(^|\\s)@(${SLUG}+)(?:/(${SLUG}+)(?:#(${ANCHOR}+))?)?`,
  "gu",
);

// The same shape half-typed: every part may still be empty, and the presence
// of the separator — not of what follows it — is what says which level the
// reader has reached.
const TYPING = new RegExp(`^(${SLUG}*)(?:/(${SLUG}*)(?:#(${ANCHOR}*))?)?$`, "u");

/** How many rows the list offers. Past this it is a directory, not a prompt. */
const LIMIT = 8;

/** A reference part-written at the caret — what the autocomplete narrows over. */
export interface Typing {
  /** Where the `@` is in the draft, and how far the reference runs. */
  at: number;
  to: number;
  /** The course it has been narrowed to; "" until a `/` settled one. */
  course: string;
  /** The lesson likewise, settled by a `#`. */
  lesson: string;
  /** `#` has been typed: the rows are that lesson's sections. */
  inSections: boolean;
  /** What has been written at whichever level that leaves. */
  typed: string;
}

/** One row of the autocomplete: somewhere the message can point at. */
export interface Mention {
  kind: "course" | "lesson" | "section";
  /** What the message will carry. */
  locator: string;
  /** The row's name — a title, or a section's heading. */
  title: string;
  /**
   * Which course the row is in, where the list spans more than one — otherwise
   * empty: a column repeating the same course down every row says nothing and
   * takes the width the titles need.
   */
  under: string;
  /** The `@`-form choosing it writes into the draft. */
  written: string;
  /** A section's rank in the lesson's contents; absent on the other two. */
  depth?: 2 | 3;
}

/**
 * What has been typed against what a row is called. A row matches on the start
 * of its slug or title, or on the start of any word inside either — so `@amer`
 * finds "Indigenous America", `@hist` finds `us-history`, and neither the
 * reader's capitals nor the hyphens in a slug have to be guessed.
 */
function matches(typed: string, ...names: string[]): boolean {
  if (typed === "") return true;
  const query = typed.toLowerCase();
  return names.some((name) => {
    const lower = name.toLowerCase();
    return (
      lower.startsWith(query) ||
      lower.split(/[^\p{L}\p{N}]+/u).some((word) => word.startsWith(query))
    );
  });
}

/**
 * The reference the caret is inside, if it is inside one. Read off the draft
 * rather than tracked as the reader types: the draft outlives the tab, and the
 * caret can be put back into a reference written yesterday.
 */
export function typingAt(draft: string, caret: number): Typing | null {
  const before = draft.slice(0, caret);
  const at = before.lastIndexOf("@");
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(before[at - 1])) return null;
  const written = TYPING.exec(before.slice(at + 1));
  if (written === null) return null;
  const [, course, lesson, anchor] = written;
  // The list narrows by what is left of the caret, but the reference itself
  // runs to the end of what was written: a caret put back into the middle of
  // one is still inside that one, and choosing a row replaces the whole of it
  // rather than leaving its tail behind.
  const after = /^[\p{L}\p{N}_\/#-]*/u.exec(draft.slice(caret))?.[0] ?? "";
  return {
    at,
    to: caret + after.length,
    course: lesson === undefined ? "" : course,
    lesson: anchor === undefined ? "" : lesson,
    inSections: anchor !== undefined,
    typed: anchor ?? lesson ?? course,
  };
}

function courseRows(typed: string, lessons: Lessons): Mention[] {
  return [...courseNames(lessons)]
    .filter(([slug, title]) => matches(typed, slug, title))
    .map(([slug, title]) => ({
      kind: "course" as const,
      locator: `course:${slug}`,
      title,
      under: "",
      written: `@${slug}`,
    }));
}

/**
 * Every lesson, or only one course's, narrowed by what has been typed. Naming
 * the course names its lessons while nothing has been narrowed — `@us` is the
 * US history course and the lessons in it, which is what the reader is
 * choosing between — but not once a `/` has already said which course it is,
 * where the course matches everything and would offer the whole of it back.
 */
function lessonRows(course: string | null, typed: string, lessons: Lessons): Mention[] {
  const rows: Mention[] = [];
  for (const [key, link] of Object.entries(lessons)) {
    const path = lessonParts(key);
    if (path === null) continue;
    if (course !== null && path.course !== course) continue;
    const named =
      course === null
        ? matches(typed, path.lesson, link.title, path.course, link.course)
        : matches(typed, path.lesson, link.title);
    if (!named) continue;
    rows.push({
      kind: "lesson",
      locator: key,
      title: link.title,
      under: course === null ? link.course : "",
      written: `@${path.course}/${path.lesson}`,
    });
  }
  return rows;
}

function sectionRows(
  typing: Typing,
  lessons: Lessons,
  sections: LessonSections,
): Mention[] {
  const key = lessonKey(typing.course, typing.lesson);
  // A lesson the site does not render has no sections to offer, whatever the
  // index still remembers about it.
  if (!(key in lessons)) return [];
  return (sections[key] ?? [])
    .filter((section) => matches(typing.typed, section.id, section.text))
    .map((section) => ({
      kind: "section" as const,
      locator: sectionKey(typing.course, typing.lesson, section.id),
      title: section.text,
      under: "",
      written: `@${typing.course}/${typing.lesson}#${section.id}`,
      depth: section.depth,
    }));
}

/** A column naming the course is worth its width only where they differ. */
function narrow(rows: Mention[]): Mention[] {
  const courses = new Set(rows.map((row) => row.under).filter((name) => name !== ""));
  return courses.size > 1 ? rows : rows.map((row) => ({ ...row, under: "" }));
}

/**
 * What the autocomplete offers for what has been typed. Courses and lessons
 * together while nothing has been narrowed — `@amer` is as likely to mean a
 * lesson as a course — and one level at a time after that.
 */
export function mentions(
  typing: Typing,
  lessons: Lessons,
  sections: LessonSections,
): Mention[] {
  if (typing.inSections) return sectionRows(typing, lessons, sections).slice(0, LIMIT);
  if (typing.course !== "") {
    return lessonRows(typing.course, typing.typed, lessons).slice(0, LIMIT);
  }
  return narrow(
    [
      ...courseRows(typing.typed, lessons),
      ...lessonRows(null, typing.typed, lessons),
    ].slice(0, LIMIT),
  );
}

/**
 * The draft with the row chosen written over the reference being typed, and
 * where the caret lands — at the end of it, with no space after: the next
 * keystroke is as likely to be the `/` or `#` that goes a level deeper as it
 * is to be the rest of the sentence.
 */
export function write(
  draft: string,
  typing: Typing,
  chosen: Mention,
): { draft: string; caret: number } {
  return {
    draft: draft.slice(0, typing.at) + chosen.written + draft.slice(typing.to),
    caret: typing.at + chosen.written.length,
  };
}

/** A reference finished in the draft, and the locator it turned out to name. */
export interface Reference {
  at: number;
  length: number;
  locator: string;
}

function resolve(
  course: string,
  lesson: string | undefined,
  anchor: string | undefined,
  lessons: Lessons,
): string | null {
  if (lesson === undefined) {
    return courseTitle(course, lessons) === undefined ? null : `course:${course}`;
  }
  const key = lessonKey(course, lesson);
  if (!(key in lessons)) return null;
  return sectionKey(course, lesson, anchor ?? null);
}

/**
 * The references written in a draft that name something the site renders, in
 * the order they are written. A reference to a lesson that does not exist —
 * a typo, a handle, a lesson withdrawn since the draft was written — is not
 * one: it stays the text it already is, here and in the message that is sent.
 */
export function references(draft: string, lessons: Lessons): Reference[] {
  const found: Reference[] = [];
  for (const match of draft.matchAll(WRITTEN)) {
    const [whole, lead, course, lesson, anchor] = match;
    const locator = resolve(course, lesson, anchor, lessons);
    if (locator === null) continue;
    found.push({
      at: match.index + lead.length,
      length: whole.length - lead.length,
      locator,
    });
  }
  return found;
}

/**
 * The question as it is sent: each reference becomes the `[[locator]]` the
 * harness already understands — the tutor fetches it, and the transcript draws
 * it as the same chip the composer showed.
 */
export function asked(draft: string, lessons: Lessons): string {
  let out = "";
  let done = 0;
  for (const reference of references(draft, lessons)) {
    out += draft.slice(done, reference.at) + `[[${reference.locator}]]`;
    done = reference.at + reference.length;
  }
  return out + draft.slice(done);
}
