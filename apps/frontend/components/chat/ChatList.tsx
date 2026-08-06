"use client";

import type { ChatSummary } from "@/lib/chat/api";
import { MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  chats: ChatSummary[];
  current: string;
  onSelect: (chat: ChatSummary) => void;
}

/** The reader's other conversations — in the panel's menu, and in its rail. */
export default function ChatList({ chats, current, onSelect }: Props) {
  return (
    <>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          // A chat title is arbitrary length and these are the two places that
          // list them.
          className={`${MENU_ITEM_CLASS} truncate ${chat.id === current ? "text-accent" : "text-soft"}`}
          onClick={() => onSelect(chat)}
        >
          {chat.title ?? "New chat"}
        </button>
      ))}
    </>
  );
}
