import type { UIMessage } from "ai";
import { call } from "@/lib/http";

export interface ChatSummary {
  id: string;
  kind: string;
  model: string;
  title: string | null;
  /** The course whose pages list the chat; null for General. */
  course: string | null;
  created_at: string;
  /** When the chat was last written in; null for one nobody has spoken in. */
  last_message_at: string | null;
}

export interface ChatModel {
  openrouter_id: string;
  display_name: string;
  context_window: number;
}

/**
 * The reader's chats with the site, most recently spoken in first: every one
 * of them, or only those of one course — `null` is General's. Telegram threads
 * are left out: the widget cannot render an eternal thread it does not own.
 */
export async function webChats(course?: string | null): Promise<ChatSummary[]> {
  const query =
    course === undefined ? "" : `?course=${encodeURIComponent(course ?? "")}`;
  const chats = await call<ChatSummary[]>(`/chats${query}`);
  return chats.filter((chat) => chat.kind === "web");
}

export function createChat(
  course: string | null,
  model?: string,
): Promise<ChatSummary> {
  return call<ChatSummary>("/chats", "POST", { kind: "web", model, course });
}

export function setChatModel(id: string, model: string): Promise<ChatSummary> {
  return call<ChatSummary>(`/chats/${id}`, "PATCH", { model });
}

export function setChatCourse(id: string, course: string | null): Promise<ChatSummary> {
  return call<ChatSummary>(`/chats/${id}`, "PATCH", { course });
}

export function loadMessages(id: string): Promise<UIMessage[]> {
  return call<UIMessage[]>(`/chats/${id}/messages`);
}

export function compactChat(id: string): Promise<{ summary: string }> {
  return call<{ summary: string }>(`/chats/${id}/compact`, "POST");
}

export function listModels(): Promise<ChatModel[]> {
  return call<ChatModel[]>("/chats/models");
}
