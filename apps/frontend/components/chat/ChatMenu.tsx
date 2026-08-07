"use client";

import ChatList from "@/components/chat/ChatList";
import type { ChatListing, ChatModel, ChatSummary } from "@/lib/chat/api";
import { LABEL_CLASS, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";

interface Props {
  current: ChatSummary;
  chats: ChatListing[];
  models: ChatModel[];
  /** The panel is over the page, where the rail lists the chats beside it. */
  expanded: boolean;
  onSelect: (chat: ChatListing) => void;
  onModel: (model: string) => void;
}

// The commands are not here: the composer's palette is where they are run
// from. `first:` is written after the unvaried utilities in the stylesheet, so
// the heading at the top of the menu keeps the menu's own padding rather than
// adding the gap that separates one group from the one above it.
const HEADING = `px-2.5 pt-3 pb-1 first:pt-1.5 ${LABEL_CLASS}`;
const ITEM = `${MENU_ITEM_CLASS} truncate`;

export default function ChatMenu({
  current,
  chats,
  models,
  expanded,
  onSelect,
  onModel,
}: Props) {
  return (
    <div className={`${MENU_CLASS} max-h-96 w-64 overflow-y-auto`}>
      <p className={HEADING}>Model</p>
      {models.map((model) => (
        <button
          key={model.openrouter_id}
          type="button"
          className={`${ITEM} ${model.openrouter_id === current.model ? "text-accent" : "text-soft"}`}
          onClick={() => onModel(model.openrouter_id)}
        >
          {model.display_name}
        </button>
      ))}

      {/* Only where the rail is not: it appears at the same width the rail does. */}
      <div className={expanded ? "lg:hidden" : ""}>
        <p className={HEADING}>Chats</p>
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
