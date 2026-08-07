"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import RevealLink from "@/components/chat/RevealLink";
import { remarkReferences } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";

// The same plugins the lesson page renders with, so a formula reads the same
// in the tutor's answer as in the text it is about.
const REHYPE = [rehypeKatex];

function Anchor({ href, children }: ComponentProps<"a">) {
  if (href === undefined || !/^[/#]/.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return <RevealLink href={href}>{children}</RevealLink>;
}

const COMPONENTS = { a: Anchor };

export default function Markdown({ text }: { text: string }) {
  const lessons = useLessons();

  return (
    <div className="chat-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, [remarkReferences, { lessons }]]}
        rehypePlugins={REHYPE}
        components={COMPONENTS}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
