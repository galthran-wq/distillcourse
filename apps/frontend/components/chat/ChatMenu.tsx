"use client";

import ChatList from "@/components/chat/ChatList";
import { PlusIcon } from "@/components/chat/icons";
import type { ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatSummary[];
  /** The panel is over the page, where the rail lists the chats beside it. */
  expanded: boolean;
  onSelect: (chat: ChatSummary) => void;
  onNew: () => void;
}

// The model is not here: it lives at the foot of the composer now (ModelPicker),
// where a Cursor-style input keeps it. This menu switches between chats and
// starts a new one — the only way to do the latter while docked, where there is
// no rail. The gap above a heading is what separates its group from the group
// above it, so it belongs to the use rather than to the constant.
const HEADING = `px-2.5 pb-1 ${LABEL_CLASS}`;
const ITEM = `${MENU_ITEM_CLASS} truncate`;

export default function ChatMenu({ current, chats, expanded, onSelect, onNew }: Props) {
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

      {/* The rail already lists the chats where it is shown; there the menu is
          just the new-chat button above. */}
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
