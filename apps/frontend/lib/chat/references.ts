import { visit } from "unist-util-visit";
import type { PhrasingContent, Root, Text } from "mdast";
import type { Lessons } from "@/lib/content/links";
import { isSourceLocator, parseLessonLocator } from "@/lib/content/locator";

// `[[locator]]` or `[[locator|label]]`, the form the tutor is told to point at
// material with (app/harness/prompts/base.md). It is written inside the message
// text, so it costs the protocol nothing and reads as a label wherever the
// message is delivered.
const REFERENCE = /\[\[([^[\]|\s]+)(?:\|([^[\]]+))?\]\]/g;

function resolve(
  locator: string,
  label: string | undefined,
  lessons: Lessons,
): PhrasingContent | null {
  if (isSourceLocator(locator)) {
    // Research notes and papers have no page on the site: the reader is shown
    // where the claim came from, with nothing to click.
    return {
      type: "emphasis",
      data: { hName: "cite" },
      children: [{ type: "text", value: label ?? locator }],
    };
  }
  const target = parseLessonLocator(locator);
  const link = target === null ? undefined : lessons[target.key];
  if (target === null || link === undefined) return null;
  const anchor = target.anchor === null ? "" : `#${target.anchor}`;
  return {
    type: "link",
    url: `${link.href}${anchor}`,
    children: [{ type: "text", value: label ?? link.title }],
  };
}

function split(value: string, lessons: Lessons): PhrasingContent[] | null {
  const parts: PhrasingContent[] = [];
  let done = 0;
  for (const match of value.matchAll(REFERENCE)) {
    const node = resolve(match[1], match[2], lessons);
    // A locator naming a lesson the site does not render — a heading renamed
    // since, a chat older than the course — is left as the text it already is.
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
