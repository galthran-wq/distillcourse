"use client";

import type { ChatListing } from "@/lib/chat/api";
import { plain } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";
import { useSections } from "@/lib/content/sections";
import { ago } from "@/lib/day";
import { MENU_ROW_CLASS } from "@/components/ui/styles";

interface Props {
  chats: ChatListing[];
  current: string;
  /**
   * The row look. In the menu these rows sit among the command and model rows
   * and have to be the same row as them, which is a class the menu owns; the
   * rail is a list of its own and takes the default.
   */
  className?: string;
  /**
   * Whether a row says when the chat was last spoken in. The rail is where a
   * reader goes looking for a conversation they had, and when it was is how
   * they find it; the menu is a switcher and has no width for a second column.
   */
  dated?: boolean;
  onSelect: (chat: ChatListing) => void;
}

// The rail's row: a name that takes what is left and a date that keeps its own
// width. The title is arbitrary length, so the truncation is on the name.
const ROW = `${MENU_ROW_CLASS} items-baseline gap-2`;

/** The reader's other conversations — in the panel's menu, and in its rail. */
export default function ChatList({
  chats,
  current,
  className = ROW,
  dated = false,
  onSelect,
}: Props) {
  const lessons = useLessons();
  const sections = useSections();

  return (
    <>
      {chats.map((chat) => (
        <button
          key={chat.id}
          type="button"
          className={`${className} ${chat.id === current ? "text-accent" : "text-soft"}`}
          onClick={() => onSelect(chat)}
        >
          {/* A chat is named after its first answer, so the one being had has
              no name yet. "New chat" is what the button above this list does —
              the row for a chat already open is not that. A name made out of a
              question written with `@` carries that question's locators, and a
              name is where they read as what they point at. */}
          <span className="min-w-0 flex-1 truncate">
            {chat.title === null
              ? chat.id === current
                ? "Current chat"
                : "New chat"
              : plain(chat.title, lessons, sections)}
          </span>
          {dated && chat.last_message_at !== null && (
            <span className="shrink-0 text-[11px] text-faint">
              {ago(chat.last_message_at)}
            </span>
          )}
        </button>
      ))}
    </>
  );
}
