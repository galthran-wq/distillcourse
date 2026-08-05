"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus, type UIMessage } from "ai";
import { useSyncExternalStore } from "react";
import {
  compactChat,
  createChat,
  loadMessages,
  setChatModel,
  webChats,
  type ChatSummary,
} from "@/lib/chat/api";
import { API } from "@/lib/api-base";
import { errorDetail } from "@/lib/http";
import { currentLocator } from "@/lib/lesson/position";

export interface Session {
  summary: ChatSummary;
  chat: Chat<UIMessage>;
}

// The dialogue is global: it lives here, outside the React tree, so that
// remounting the widget — a route change that rebuilds the layout, collapsing
// and reopening the panel — resumes the same conversation instead of ending it.
let current: Session | null = null;
const listeners = new Set<() => void>();

function publish(next: Session): Session {
  current = next;
  listeners.forEach((listener) => listener());
  return next;
}

function open(summary: ChatSummary): Promise<Session> {
  return loadMessages(summary.id).then((messages) =>
    publish({
      summary,
      chat: new Chat<UIMessage>({
        id: summary.id,
        messages,
        // The SDK major is pinned to the one pydantic-ai's Vercel adapter is
        // converted from (v6) — the data stream the backend emits is that
        // version's wire format.
        transport: new DefaultChatTransport({
          api: `${API}/chats/${summary.id}/stream`,
          credentials: "same-origin",
          // Resolved per request rather than per chat: the tutor is asked about
          // the section on screen when send is pressed. Off a lesson page it is
          // null, which is what the harness expects to hear.
          body: () => ({ currentLocator: currentLocator() }),
        }),
      }),
    }),
  );
}

let opening: Promise<Session> | null = null;

/** Reopen the last web chat, or start the reader's first one. */
export function resumeSession(): Promise<Session> {
  if (current !== null) return Promise.resolve(current);
  // Without a single in-flight bootstrap, a second render would create a
  // second chat before the first request came back.
  opening ??= (async () => {
    const chats = await webChats();
    return open(chats[0] ?? (await createChat()));
  })().finally(() => {
    opening = null;
  });
  return opening;
}

export function selectSession(summary: ChatSummary): Promise<Session> {
  return open(summary);
}

/** `/clear` on the web: a new chat, not a marker in this one. */
export async function clearSession(): Promise<Session> {
  return open(await createChat(current?.summary.model));
}

export async function compactSession(): Promise<void> {
  if (current === null) return;
  await compactChat(current.summary.id);
}

export async function changeModel(model: string): Promise<void> {
  if (current === null) return;
  // The model is a field of the chat, so the conversation carries on in the
  // same Chat instance under a new one.
  publish({ summary: await setChatModel(current.summary.id, model), chat: current.chat });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}

export function busy(status: ChatStatus): boolean {
  return status === "submitted" || status === "streaming";
}

/** What the backend refused with — the cap, or a run already in flight. */
export function streamFailure(error: Error): string {
  // A stream fails inside the AI SDK transport, which reports the response
  // body verbatim instead of parsing FastAPI's shape.
  try {
    return errorDetail(JSON.parse(error.message)) ?? error.message;
  } catch {
    return error.message;
  }
}
