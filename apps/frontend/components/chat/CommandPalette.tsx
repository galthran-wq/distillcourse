"use client";

import Palette from "@/components/chat/Palette";
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
 * The commands the composer offers while the reader is typing one — the rows
 * of the list `components/chat/Palette` draws, which is where everything about
 * how it opens and how it is walked lives.
 */
export default function CommandPalette({ commands, active, onPick }: Props) {
  return (
    <Palette
      id={PALETTE_ID}
      label="Commands"
      active={active}
      onPick={(index) => onPick(commands[index])}
      rows={commands.map((command) => ({
        id: commandRowId(command),
        children: (
          <>
            <span className="shrink-0 font-mono">/{command}</span>
            <span className="truncate text-faint">{COMMANDS[command]}</span>
          </>
        ),
      }))}
    />
  );
}
