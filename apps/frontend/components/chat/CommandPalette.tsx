"use client";

import { MENU_ROW_CLASS, POPOVER_CLASS } from "@/components/ui/styles";
import { COMMANDS, type Command } from "@/lib/chat/commands";

/** What the field points its `aria-controls` and `aria-activedescendant` at. */
export const PALETTE_ID = "chat-commands";

export function commandRowId(command: Command): string {
  return `${PALETTE_ID}-${command}`;
}

interface Props {
  commands: Command[];
  /** Which row Enter runs. The palette is driven from the field it hangs over. */
  active: number;
  onPick: (command: Command) => void;
}

/**
 * The commands the composer offers while the reader is typing one. It hangs
 * over the composer rather than pushing it down — the field is at the bottom
 * of the panel, so it opens upwards, the way a passage's preview does.
 */
export default function CommandPalette({ commands, active, onPick }: Props) {
  return (
    <div
      id={PALETTE_ID}
      role="listbox"
      aria-label="Commands"
      className={`${POPOVER_CLASS} right-0 bottom-full left-0 mb-1.5 origin-bottom p-1.5`}
    >
      {commands.map((command, index) => (
        <button
          key={command}
          id={commandRowId(command)}
          type="button"
          role="option"
          aria-selected={index === active}
          // The press must not take the focus out of the field: that is where
          // the palette is read from and where the reader goes on typing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(command)}
          className={`${MENU_ROW_CLASS} items-baseline gap-2 ${
            index === active ? "bg-line/60 text-ink" : "text-soft"
          }`}
        >
          <span className="shrink-0 font-mono">/{command}</span>
          <span className="truncate text-faint">{COMMANDS[command]}</span>
        </button>
      ))}
    </div>
  );
}
