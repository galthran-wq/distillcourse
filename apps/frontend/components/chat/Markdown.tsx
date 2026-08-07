"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import RevealLink from "@/components/chat/RevealLink";
import { CHIP_CLASS } from "@/components/ui/styles";
import { remarkReferences } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";
import { useSections } from "@/lib/content/sections";

// The same plugins the lesson page renders with, so a formula reads the same
// in the tutor's answer as in the text it is about.
const REHYPE = [rehypeKatex];

/** What `remarkReferences` marks a `[[locator]]` it resolved with. */
type Link = ComponentProps<"a"> & { "data-ref"?: string };

function Anchor({ href, children }: Link) {
  if (href === undefined || !/^[/#]/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <RevealLink href={href}>{children}</RevealLink>;
}

// The chip's own geometry, inside a sentence: it sits on the line rather than
// in a row of its own, so it takes the line's own spacing around it. The rule
// it turns off is the prose one every other link in here wants (globals.css).
const CHIP = `${CHIP_CLASS} mx-0.5 inline-flex px-1.5 py-0.5 no-underline`;

/**
 * The reader's own references, drawn as the chips the composer showed them as
 * — a question that named a section reads the same after it is sent as while
 * it was being written. Everything else in the message, links the markdown
 * itself carried included, is a link.
 */
function ChipAnchor({ href, children, ...rest }: Link) {
  if (href === undefined || rest["data-ref"] === undefined) {
    return <Anchor href={href}>{children}</Anchor>;
  }
  return (
    <RevealLink href={href} className={CHIP}>
      {children}
    </RevealLink>
  );
}

const COMPONENTS = { a: Anchor };
const CHIP_COMPONENTS = { a: ChipAnchor };

export default function Markdown({
  text,
  chips = false,
}: {
  text: string;
  /** Draw the references in it as chips: the reader's own message. */
  chips?: boolean;
}) {
  const lessons = useLessons();
  const sections = useSections();

  return (
    <div className="chat-prose">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          // A chip names the place, so it is called by the section's heading
          // where the index says what that reads. A reference in an answer
          // stays a link under the lesson's title, in the prose around it.
          [remarkReferences, { lessons, sections: chips ? sections : {} }],
        ]}
        rehypePlugins={REHYPE}
        components={chips ? CHIP_COMPONENTS : COMPONENTS}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
