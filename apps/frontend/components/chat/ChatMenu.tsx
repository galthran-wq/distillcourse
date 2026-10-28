"use client";

import { useState } from "react";
import ChatList from "@/components/chat/ChatList";
import { PlusIcon } from "@/components/chat/icons";
import type { ChatSummary } from "@/lib/chat/api";
import { courseNames, useLessons } from "@/lib/content/links";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatSummary[];
  /** The panel is over the page, where the rail lists the chats beside it. */
  expanded: boolean;
  onSelect: (chat: ChatSummary) => void;
  onNew: () => void;
  /** File the open chat under a course; null is General. */
  onMove: (course: string | null) => void;
}

// The model is not here: it lives at the foot of the composer now (ModelPicker),
// where a Cursor-style input keeps it. This menu switches between chats, starts
// a new one — the only way to do the latter while docked, where there is no
// rail — and files the open one under another course. The gap above a heading
// is what separates its group from the group above it, so it belongs to the use
// rather than to the constant.
const HEADING = `px-2.5 pb-1 ${LABEL_CLASS}`;
const ITEM = `${MENU_ITEM_CLASS} truncate`;

export default function ChatMenu({
  current,
  chats,
  expanded,
  onSelect,
  onNew,
  onMove,
}: Props) {
  const lessons = useLessons();
  // The destinations replace the chat list rather than joining it: both are
  // lists of names, and one under the other is a menu nobody can tell apart.
  const [moving, setMoving] = useState(false);
  const destinations: [string | null, string][] = [
    ...courseNames(lessons),
    [null, "General"],
  ];

  if (moving) {
    return (
      <div className={`${MENU_CLASS} max-h-96 w-64 overflow-y-auto`}>
        <p className={`${HEADING} pt-1`}>Move to</p>
        {destinations
          .filter(([course]) => course !== current.course)
          .map(([course, title]) => (
            <button
              key={course ?? ""}
              type="button"
              className={`${ITEM} text-soft`}
              onClick={() => onMove(course)}
            >
              {title}
            </button>
          ))}
      </div>
    );
  }

  return (
    <div className={`${MENU_CLASS} max-h-96 w-64 overflow-y-auto`}>
      <button
        type="button"
        className={`${MENU_ITEM_CLASS} flex items-center gap-2 text-soft`}
        onClick={onNew}
      >
        <PlusIcon className="size-3.5" />
        New chat
      </button>
      <button
        type="button"
        className={`${MENU_ITEM_CLASS} text-soft`}
        onClick={() => setMoving(true)}
      >
        Move to…
      </button>

      {/* The rail already lists the chats where it is shown; there the menu is
          just the two actions above. */}
      <div className={expanded ? "lg:hidden" : ""}>
        <p className={`${HEADING} pt-3`}>Chats</p>
        <ChatList
          chats={chats}
          current={current.id}
          className={ITEM}
          onSelect={onSelect}
        />
      </div>
    </div>
  );
}
