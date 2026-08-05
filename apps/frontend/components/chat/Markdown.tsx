import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

// The same plugins the lesson page renders with, so a formula reads the same
// in the tutor's answer as in the text it is about.
const REMARK = [remarkGfm, remarkMath];
const REHYPE = [rehypeKatex];

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="chat-prose">
      <ReactMarkdown remarkPlugins={REMARK} rehypePlugins={REHYPE}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
