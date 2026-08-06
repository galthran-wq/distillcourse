"use client";

import { isToolUIPart, type ChatStatus, type UIMessage } from "ai";
import { useEffect, useRef } from "react";
import Markdown from "@/components/chat/Markdown";
import ToolChip from "@/components/chat/ToolChip";

// Within this much of the end counts as reading the newest message. Anything
// further up is the reader looking at something, and the transcript stays put.
const AT_END = 32;

export default function Messages({
  messages,
  chatId,
  status,
}: {
  messages: UIMessage[];
  /** Which conversation this is. The component is not remounted between two. */
  chatId: string;
  status: ChatStatus;
}) {
  const view = useRef<HTMLDivElement>(null);
  const following = useRef(true);

  // Reading something further up is the only thing that unpins the transcript,
  // and neither of the two below is that — so both put it back. Nothing else
  // would: the panel keeps this component mounted across a chat switch, a
  // /clear and every message after them, so the ref outlives them all.
  // Declared above the scroll, which is the order the effects run in.
  useEffect(() => {
    following.current = true;
  }, [chatId]);

  useEffect(() => {
    if (messages.at(-1)?.role === "user") following.current = true;
  }, [messages]);

  useEffect(() => {
    const box = view.current;
    if (box === null || !following.current) return;
    box.scrollTop = box.scrollHeight;
  }, [messages, status]);

  function onScroll(): void {
    const box = view.current;
    if (box === null) return;
    following.current = box.scrollHeight - box.scrollTop - box.clientHeight <= AT_END;
  }

  return (
    // No live region: an answer arrives a token at a time, and a transcript
    // that announces itself on every one of them reads the whole conversation
    // out again per token. Each turn says who spoke, which is what is needed.
    <div ref={view} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-3">
      {/* Expanded, the panel is far wider than a column of prose should be. */}
      <div className="mx-auto max-w-2xl space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-faint">
            Ask about what you are reading. <code>/clear</code> starts a new chat,{" "}
            <code>/compact</code> summarises this one.
          </p>
        )}
        {messages.map((message, turn) => (
          <article
            // By position, not by id: the backend gives every stored question
            // of every chat the same id — it derives one from fields a question
            // has none of — so an id is not an identity here, and React
            // reconciles a list of duplicates by matching the wrong nodes. A
            // transcript is only ever appended to, which makes position one.
            key={turn}
            aria-label={message.role === "user" ? "You" : "Tutor"}
            // A turn rises into place as it is added. The answer inside it is
            // written a token at a time and does not animate: the element is
            // there from the first token, and this only plays on the node
            // React inserts.
            className={`transition-[opacity,translate] duration-(--motion-base) starting:translate-y-1.5 starting:opacity-0 ${
              message.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-md bg-accent/10 px-3 py-2"
                : ""
            }`}
          >
            {message.parts.map((part, index) => {
              if (part.type === "text") {
                return <Markdown key={index} text={part.text} />;
              }
              if (isToolUIPart(part)) {
                return <ToolChip key={index} part={part} />;
              }
              return null;
            })}
          </article>
        ))}
        {status === "submitted" && <p className="text-[13px] text-faint">thinking…</p>}
      </div>
    </div>
  );
}
