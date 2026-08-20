import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// The course page's short prose fields — key results, outcomes, prerequisites,
// sources — are author strings that may carry a formula (`$…$`, `$$…$$`). They
// were rendered as bare text, so the math showed as source. This runs the same
// math pipeline the lessons and the intro use over one string, and no more.
//
// Rendered on the server (the KaTeX stylesheet is already global, app/layout),
// so it ships no client JS. Inline: the paragraph react-markdown would wrap the
// line in is unwrapped, so the result drops into a flex row or a list item
// beside a link without forcing a block of its own.
const REMARK = [remarkGfm, remarkMath];
const REHYPE = [rehypeKatex];
const INLINE = { p: ({ children }: { children?: ReactNode }) => <>{children}</> };

export default function MathText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className === undefined ? "math-text" : `math-text ${className}`}>
      <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE} components={INLINE}>
        {text}
      </ReactMarkdown>
    </span>
  );
}
