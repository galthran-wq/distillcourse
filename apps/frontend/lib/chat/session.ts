"use client";

import { Chat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
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
import { takeQuotes } from "@/lib/chat/quote";
import { settleSteers, steerData } from "@/lib/chat/steer";
import { rememberChat, storedChatId } from "@/lib/chat/stored";
import { createStore } from "@/lib/store";

export interface Session {
  summary: ChatSummary;
  chat: Chat<UIMessage>;
}

// The dialogue is global: it lives here, outside the React tree, so that
// remounting the widget — a route change that rebuilds the layout, collapsing
// and reopening the panel — resumes the same conversation instead of ending it.
const session = createStore<Session | null>(null);

async function open(summary: ChatSummary): Promise<Session> {
  const messages = await loadMessages(summary.id);
  const chat: Chat<UIMessage> = new Chat<UIMessage>({
    id: summary.id,
    messages,
    // On the Chat rather than on `useChat`, which ignores its callbacks when
    // it is handed one: the stream reports on the messages sent while it
    // ran, and they are settled when it ends, whether or not a panel is
    // mounted to watch.
    onData: (part) => steerData(chat, part),
    onFinish: ({ isAbort, isError }) =>
      // After the SDK has let go of the run that just ended: a turn sent
      // from inside its callback would be started under it.
      setTimeout(() => settleSteers(chat, isAbort || isError)),
    // The SDK major is pinned to the one pydantic-ai's Vercel adapter is
    // converted from (v6) — the data stream the backend emits is that
    // version's wire format.
    transport: new DefaultChatTransport({
      api: `${API}/chats/${summary.id}/stream`,
      credentials: "same-origin",
      // Resolved per request rather than per chat: the tutor is asked about
      // the section on screen when send is pressed. Off a lesson page it is
      // null, which is what the harness expects to hear. The attached
      // passages go the same way, and are spent by the message carrying them.
      body: () => ({ currentLocator: currentLocator(), quotes: takeQuotes() }),
    }),
  });
  const next: Session = { summary, chat };
  session.set(next);
  rememberChat(summary.id);
  return next;
}

let opening: Promise<Session> | null = null;

/** Reopen the chat the reader last had open, or start their first one. */
export function resumeSession(): Promise<Session> {
  const current = session.get();
  if (current !== null) return Promise.resolve(current);
  // Without a single in-flight bootstrap, a second render would create a
  // second chat before the first request came back.
  opening ??= (async () => {
    const chats = await webChats();
    // The stored one can be gone — deleted, or belonging to whoever was
    // signed in on this browser before — and then the most recent stands in.
    const last = chats.find((chat) => chat.id === storedChatId());
    return open(last ?? chats[0] ?? (await createChat()));
  })().finally(() => {
    opening = null;
  });
  return opening;
}

/** The conversation belongs to whoever was signed in when it was opened. */
export function resetSession(): void {
  opening = null;
  session.set(null);
}

export function selectSession(summary: ChatSummary): Promise<Session> {
  return open(summary);
}

/** `/clear` on the web: a new chat, not a marker in this one. */
export async function clearSession(): Promise<Session> {
  return open(await createChat(session.get()?.summary.model));
}

export async function compactSession(): Promise<void> {
  const current = session.get();
  if (current === null) return;
  await compactChat(current.summary.id);
}

export async function changeModel(model: string): Promise<void> {
  const current = session.get();
  if (current === null) return;
  // The model is a field of the chat, so the conversation carries on in the
  // same Chat instance under a new one.
  const summary = await setChatModel(current.summary.id, model);
  session.set({ summary, chat: current.chat });
}

/**
 * The backend names a chat itself — from its first message, and again once the
 * conversation has moved past it — so the name arrives out of the listing the
 * panel already fetches rather than from a request of its own.
 */
export function adoptSummary(chats: ChatSummary[]): void {
  const current = session.get();
  if (current === null) return;
  const listed = chats.find((chat) => chat.id === current.summary.id);
  // Only on a real change of the name, or the panel that asked for this would
  // be rendered back into asking for it. The dates the same listing carries
  // belong to the rail, which reads them from the listing itself.
  if (listed === undefined || listed.title === current.summary.title) return;
  session.set({ summary: listed, chat: current.chat });
}

export function useSession(): Session | null {
  return session.use();
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
