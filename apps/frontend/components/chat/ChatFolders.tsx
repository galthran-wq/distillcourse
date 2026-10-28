"use client";

import { useState } from "react";
import ChatList from "@/components/chat/ChatList";
import { ChevronIcon } from "@/components/chat/icons";
import { MENU_ROW_CLASS } from "@/components/ui/styles";
import type { ChatSummary } from "@/lib/chat/api";
import { courseTitle } from "@/lib/chat/references";
import { useLessons } from "@/lib/content/links";

interface Props {
  /** Every chat of the reader, most recently spoken in first. */
  chats: ChatSummary[];
  current: string;
  /** The page's course, whose folder starts open; null off every course. */
  course: string | null;
  onSelect: (chat: ChatSummary) => void;
}

/**
 * One folder per course, in the order of each one's most recent chat — the
 * listing's own order, so the first chat seen of a course places its folder —
 * and General, the chats filed under none, last.
 */
function folders(chats: ChatSummary[]): [string | null, ChatSummary[]][] {
  const grouped = new Map<string | null, ChatSummary[]>();
  for (const chat of chats) {
    grouped.set(chat.course, [...(grouped.get(chat.course) ?? []), chat]);
  }
  const general = grouped.get(null);
  grouped.delete(null);
  return general === undefined ? [...grouped] : [...grouped, [null, general]];
}

const HEADER = `${MENU_ROW_CLASS} items-center gap-1.5 text-soft`;

/** The expanded panel's rail: the reader's chats, filed by course. */
export default function ChatFolders({ chats, current, course, onSelect }: Props) {
  const lessons = useLessons();
  // Seeded once: the page cannot change under the expanded panel, which
  // covers it, and a folder the reader opened stays open across listings.
  const [open, setOpen] = useState<ReadonlySet<string | null>>(() => new Set([course]));

  function toggle(folder: string | null): void {
    const next = new Set(open);
    if (!next.delete(folder)) next.add(folder);
    setOpen(next);
  }

  return (
    <>
      {folders(chats).map(([folder, filed]) => (
        <section key={folder ?? ""} aria-label={folder ?? "General"}>
          <button
            type="button"
            aria-expanded={open.has(folder)}
            onClick={() => toggle(folder)}
            className={HEADER}
          >
            <ChevronIcon
              className={`size-3 shrink-0 transition-transform duration-(--motion-fast) ${
                open.has(folder) ? "" : "-rotate-90"
              }`}
            />
            {/* A course filed but no longer rendered keeps its slug for a name. */}
            <span className="min-w-0 flex-1 truncate">
              {folder === null ? "General" : (courseTitle(folder, lessons) ?? folder)}
            </span>
            <span className="shrink-0 text-[11px] text-faint">{filed.length}</span>
          </button>
          {open.has(folder) && (
            <div className="pl-3">
              <ChatList chats={filed} current={current} dated onSelect={onSelect} />
            </div>
          )}
        </section>
      ))}
    </>
  );
}
