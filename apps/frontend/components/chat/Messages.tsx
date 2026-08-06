"use client";

import {
  getToolName,
  isToolUIPart,
  type ChatStatus,
  type DynamicToolUIPart,
  type ToolUIPart,
  type UIMessage,
} from "ai";
import { useEffect, useRef } from "react";
import Markdown from "@/components/chat/Markdown";
import { LABEL_CLASS } from "@/components/ui/styles";

// The tool's own name, which is what the harness reports; the widget adds no
// vocabulary of its own so a tool shipped later needs no change here.
function toolStatus(part: ToolUIPart | DynamicToolUIPart): string {
  const name = getToolName(part).replace(/_/g, " ");
  if (part.state === "output-error") return `${name} — failed`;
  if (part.state === "output-available") return `${name} — done`;
  return `${name}…`;
}

export default function Messages({
  messages,
  status,
}: {
  messages: UIMessage[];
  status: ChatStatus;
}) {
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3">
      {messages.length === 0 && (
        <p className="text-sm text-faint">
          Ask about what you are reading. <code>/clear</code> starts a new chat,{" "}
          <code>/compact</code> summarises this one.
        </p>
      )}
      {messages.map((message) => (
        <div key={message.id} className="mb-5">
          <p className={LABEL_CLASS}>{message.role === "user" ? "you" : "tutor"}</p>
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return <Markdown key={index} text={part.text} />;
            }
            if (isToolUIPart(part)) {
              return (
                <p key={index} className={`${LABEL_CLASS} mt-1`}>
                  {toolStatus(part)}
                </p>
              );
            }
            return null;
          })}
        </div>
      ))}
      {status === "submitted" && <p className={LABEL_CLASS}>thinking…</p>}
      <div ref={bottom} />
    </div>
  );
}
