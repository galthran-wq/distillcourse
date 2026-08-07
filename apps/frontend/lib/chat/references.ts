import { visit } from "unist-util-visit";
import type { PhrasingContent, Root, Text } from "mdast";
import type { Lessons } from "@/lib/content/links";
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
function courseTitle(slug: string, lessons: Lessons): string | undefined {
  const prefix = `${LESSON_PREFIX}${slug}/`;
  return Object.entries(lessons).find(([key]) => key.startsWith(prefix))?.[1].course;
}

/**
 * The page a locator names and what to call it, if the site renders one — for
 * the references written into a message and for the passages attached beside
 * it alike, so both stop pointing at a lesson on the same day it is withdrawn.
 */
export function linkTo(
  locator: string,
  lessons: Lessons,
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
  return { url: `${link.href}${anchor}`, text: link.title };
}

function resolve(
  locator: string,
  label: string | undefined,
  lessons: Lessons,
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
  const target = linkTo(locator, lessons);
  if (target === null) return null;
  return {
    type: "link",
    url: target.url,
    children: [{ type: "text", value: label ?? target.text }],
  };
}

function split(value: string, lessons: Lessons): PhrasingContent[] | null {
  const parts: PhrasingContent[] = [];
  let done = 0;
  for (const match of value.matchAll(REFERENCE)) {
    const node = resolve(match[1], match[2], lessons);
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
export function remarkReferences({ lessons }: { lessons: Lessons }) {
  return (tree: Root): void => {
    visit(tree, "text", (node: Text, index, parent) => {
      // A reference inside a link would nest one anchor in another.
      if (parent === undefined || index === undefined || parent.type === "link") {
        return;
      }
      const parts = split(node.value, lessons);
      if (parts === null) return;
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
