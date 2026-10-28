"use client";

import type { Chat } from "@ai-sdk/react";
import type { ChatStatus, DataUIPart, UIDataTypes, UIMessage } from "ai";
import { steerChat } from "@/lib/chat/api";
import { setDraft, storedDraft } from "@/lib/chat/stored";

/**
 * Where a message sent while the tutor answers is: waiting for the run's next
 * model request, read by it, or handed back — the run ended without a request
 * left to read it in, and it goes as a turn of its own.
 */
type Mark = "queued" | "taken" | "returned";

export function steerMark(message: UIMessage): Mark | null {
  const mark = (message.metadata as { steer?: Mark } | undefined)?.steer;
  return mark ?? null;
}

function remark(chat: Chat<UIMessage>, ids: string[], from: Mark[], to: Mark): void {
  chat.messages = chat.messages.map((message) => {
    const mark = steerMark(message);
    return mark !== null && from.includes(mark) && ids.includes(message.id)
      ? { ...message, metadata: { ...(message.metadata as object), steer: to } }
      : message;
  });
}

function text(message: UIMessage): string {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

/** A run is in flight: what the reader sends now is a steer, not a turn. */
export function busy(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

/** The handed-back messages, sent together once nothing is in flight. */
function flush(chat: Chat<UIMessage>): void {
  if (busy(chat.status)) return;
  const returned = chat.messages.filter((message) => steerMark(message) === "returned");
  if (returned.length === 0) return;
  chat.messages = chat.messages.filter((message) => !returned.includes(message));
  void chat.sendMessage({ text: returned.map(text).join("\n\n") });
}

/**
 * A message for the run in flight. It is on screen at once, under the question
 * the run is answering — above the answer, which the SDK keeps writing into
 * the last message of the list and would otherwise write a second copy of.
 */
export async function steer(chat: Chat<UIMessage>, words: string): Promise<void> {
  const message: UIMessage = {
    id: crypto.randomUUID(),
    role: "user",
    parts: [{ type: "text", text: words }],
    metadata: { steer: "queued" },
  };
  const last = chat.messages.at(-1);
  chat.messages =
    last?.role === "assistant"
      ? [...chat.messages.slice(0, -1), message, last]
      : [...chat.messages, message];
  let taken = false;
  try {
    taken = await steerChat(chat.id, { id: message.id, text: words });
  } catch {
    // Unreachable is no different from too late: it goes as a turn, which
    // reports a failure of its own if there is one.
  }
  if (!taken) {
    remark(chat, [message.id], ["queued"], "returned");
    flush(chat);
  }
}

/** What the stream says about the messages it was handed. */
export function steerData(chat: Chat<UIMessage>, part: DataUIPart<UIDataTypes>): void {
  if (part.type === "data-steer") {
    remark(chat, [(part.data as { id: string }).id], ["queued"], "taken");
  } else if (part.type === "data-steer-unused") {
    remark(chat, (part.data as { ids: string[] }).ids, ["queued"], "returned");
  }
}

/**
 * The run is over. What it handed back goes as one turn — unless it was
 * stopped or failed, when nothing the reader sent alongside it is sent on its
 * own: it goes back into the composer, ahead of whatever is being written.
 */
export function settleSteers(chat: Chat<UIMessage>, interrupted: boolean): void {
  if (!interrupted) return flush(chat);
  const unread = chat.messages.filter((message) => {
    const mark = steerMark(message);
    return mark === "queued" || mark === "returned";
  });
  if (unread.length === 0) return;
  chat.messages = chat.messages.filter((message) => !unread.includes(message));
  setDraft(
    [...unread.map(text), storedDraft()].filter((part) => part !== "").join("\n\n"),
  );
}
