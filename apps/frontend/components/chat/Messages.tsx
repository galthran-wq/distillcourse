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
  status,
}: {
  messages: UIMessage[];
  status: ChatStatus;
}) {
  const view = useRef<HTMLDivElement>(null);
  const following = useRef(true);

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
    <div
      ref={view}
      onScroll={onScroll}
      role="log"
      className="flex-1 overflow-y-auto px-4 py-3"
    >
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
            className={
              message.role === "user"
                ? "ml-auto w-fit max-w-[85%] rounded-md bg-accent/10 px-3 py-2"
                : ""
            }
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
