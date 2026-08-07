import { visit } from "unist-util-visit";
import type { PhrasingContent, Root, Text } from "mdast";
import type { Lessons } from "@/lib/content/links";
import type { LessonSections } from "@/lib/content/site";
import {
  LESSON_PREFIX,
  isSourceLocator,
  parseCourseLocator,
  parseLessonLocator,
} from "@/lib/content/locator";

// `[[locator]]` or `[[locator|label]]`, the form the tutor is told to point at
// material with (app/harness/prompts/base.md). It is written inside the message
// text, so it costs the protocol nothing and reads as a label wherever the
// message is delivered.
const REFERENCE = /\[\[([^[\]|\s]+)(?:\|([^[\]]+))?\]\]/g;

// The lesson set is keyed by lesson, so a course is named by any lesson of it.
// A course with no readable lesson is a course the site does not render.
export function courseTitle(slug: string, lessons: Lessons): string | undefined {
  const prefix = `${LESSON_PREFIX}${slug}/`;
  return Object.entries(lessons).find(([key]) => key.startsWith(prefix))?.[1].course;
}

/**
 * The page a locator names and what to call it, if the site renders one — for
 * the references written into a message and for the passages attached beside
 * it alike, so both stop pointing at a lesson on the same day it is withdrawn.
 *
 * A locator naming a section is called by that section's heading where the
 * caller has the section index to say what it reads (`lib/content/sections`),
 * and by the lesson's title where it has not — a chip saying "Cahokia" names
 * the place; one saying "Indigenous America" names the page it is on.
 */
export function linkTo(
  locator: string,
  lessons: Lessons,
  sections: LessonSections = {},
): { url: string; text: string } | null {
  const course = parseCourseLocator(locator);
  if (course !== null) {
    const title = courseTitle(course, lessons);
    return title === undefined ? null : { url: `/courses/${course}`, text: title };
  }
  const target = parseLessonLocator(locator);
  const link = target === null ? undefined : lessons[target.key];
  if (target === null || link === undefined) return null;
  const anchor = target.anchor === null ? "" : `#${target.anchor}`;
  const heading = sections[target.key]?.find((section) => section.id === target.anchor);
  return { url: `${link.href}${anchor}`, text: heading?.text ?? link.title };
}

/**
 * The same message where it is named rather than rendered: every locator in it
 * reduced to what the chip would have read, and the rest left alone. A chat is
 * titled with the question that started it (`app/harness/runner.py`), and a
 * question written with `@` carries `[[lesson:…]]` — so the rail and the
 * panel's header would otherwise show the brackets in the same panel where the
 * message itself shows the chip. A locator the site cannot resolve stays the
 * text it is, exactly as it does in the message.
 */
export function plain(
  text: string,
  lessons: Lessons,
  sections: LessonSections = {},
): string {
  return text.replace(REFERENCE, (whole, locator: string, label?: string) => {
    if (label !== undefined) return label;
    if (isSourceLocator(locator)) return locator;
    return linkTo(locator, lessons, sections)?.text ?? whole;
  });
}

function resolve(
  locator: string,
  label: string | undefined,
  lessons: Lessons,
  sections: LessonSections,
): PhrasingContent | null {
  if (isSourceLocator(locator)) {
    // A research note, a concept entry and a paper have no page on the site:
    // the reader is shown where the claim came from, with nothing to click.
    return {
      type: "emphasis",
      data: { hName: "cite" },
      children: [{ type: "text", value: label ?? locator }],
    };
  }
  const target = linkTo(locator, lessons, sections);
  if (target === null) return null;
  return {
    type: "link",
    url: target.url,
    // Marked as having come from a reference rather than from a link the
    // markdown itself carried, so a message that draws its references as
    // chips (`components/chat/Markdown`) can tell the two apart.
    data: { hProperties: { "data-ref": "" } },
    children: [{ type: "text", value: label ?? target.text }],
  };
}

function split(
  value: string,
  lessons: Lessons,
  sections: LessonSections,
): PhrasingContent[] | null {
  const parts: PhrasingContent[] = [];
  let done = 0;
  for (const match of value.matchAll(REFERENCE)) {
    const node = resolve(match[1], match[2], lessons, sections);
    // A locator that is malformed, or names a page the site does not render —
    // a chat older than the course, a lesson withdrawn since — is left as the
    // text it already is.
    if (node === null) continue;
    if (match.index > done) {
      parts.push({ type: "text", value: value.slice(done, match.index) });
    }
    parts.push(node);
    done = match.index + match[0].length;
  }
  if (parts.length === 0) return null;
  if (done < value.length) parts.push({ type: "text", value: value.slice(done) });
  return parts;
}

/**
 * Remark plugin that turns the references in a message into links to the
 * section they name. Resolution needs the lesson set the site was built with,
 * which is why it happens here and not in the tutor: the model writes a
 * locator, the site decides whether that locator still points at anything.
 */
export function remarkReferences({
  lessons,
  sections = {},
}: {
  lessons: Lessons;
  sections?: LessonSections;
}) {
  return (tree: Root): void => {
    visit(tree, "text", (node: Text, index, parent) => {
      // A reference inside a link would nest one anchor in another.
      if (parent === undefined || index === undefined || parent.type === "link") {
        return;
      }
      const parts = split(node.value, lessons, sections);
      if (parts === null) return;
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
