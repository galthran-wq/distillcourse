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

/**
 * What the palette offers for what has been written so far: the commands the
 * draft names the start of. Only ever a slash and a word, so the palette is
 * the first thing typed into an empty composer rather than a slash inside a
 * question — a draft that is anything else lists nothing, and a list of
 * nothing is what closes it.
 */
export function matchCommands(draft: string): Command[] {
  const typed = /^\/([a-z]*)$/.exec(draft);
  if (typed === null) return [];
  return (Object.keys(COMMANDS) as Command[]).filter((name) =>
    name.startsWith(typed[1]),
  );
}
