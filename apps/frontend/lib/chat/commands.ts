export type Command = "clear" | "compact";

export const COMMANDS: Record<Command, string> = {
  clear: "start a new chat",
  compact: "summarise the history so far",
};

/** A message that is an instruction to the widget rather than to the tutor. */
export function parseCommand(text: string): Command | null {
  const word = text.trim().slice(1);
  return text.trim().startsWith("/") && word in COMMANDS ? (word as Command) : null;
}
