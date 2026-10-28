import { getToolName, isToolUIPart, type UIMessage } from "ai";

type Part = UIMessage["parts"][number];

/** One thing the tutor did on the way to an answer, in the order it did it. */
export type Step =
  | {
      kind: "tool";
      tool: string;
      /** What it was asked, in a few words: the query, the lesson read. */
      about: string;
      state: "running" | "done" | "failed";
    }
  | { kind: "thought"; text: string; running: boolean; seconds: number | null };

/**
 * How each tool reads in the activity line: done, counted, and while it runs.
 * A noun is counted as one ("read 2 lessons"); without one the verb is
 * ("searched 3×"). A tool shipped later and missing here reads as its name.
 */
const TOOLS: Record<string, { done: string; doing: string; noun?: [string, string] }> = {
  search_content: { done: "searched", doing: "searching" },
  fetch_content: { done: "read", doing: "reading", noun: ["lesson", "lessons"] },
  web_search: { done: "searched the web", doing: "searching the web for" },
  get_course_structure: { done: "looked at the course", doing: "looking at the course" },
  get_user_progress: { done: "checked your progress", doing: "checking your progress" },
  read_memory: { done: "recalled", doing: "recalling" },
  save_memory: { done: "noted", doing: "noting", noun: ["memory", "memories"] },
  delete_memory: { done: "forgot", doing: "forgetting" },
  report_content_incident: { done: "reported a problem", doing: "reporting a problem" },
  create_reminder: { done: "set a reminder", doing: "setting a reminder" },
  list_reminders: { done: "checked your reminders", doing: "checking your reminders" },
  cancel_reminder: { done: "cancelled a reminder", doing: "cancelling a reminder" },
  mute_proactive: { done: "paused messages", doing: "pausing messages" },
  unmute_proactive: { done: "resumed messages", doing: "resuming messages" },
};

function wording(tool: string): { done: string; doing: string; noun?: [string, string] } {
  const name = tool.replace(/_/g, " ");
  return TOOLS[tool] ?? { done: name, doing: name };
}

/** A locator read as the place it names: its last path segment, no anchor. */
function place(locator: string): string {
  return locator.split("#")[0].split("/").at(-1) ?? locator;
}

function about(tool: string, input: unknown): string {
  const args = (input ?? {}) as Record<string, unknown>;
  if (typeof args.locator === "string") return place(args.locator);
  const first = Object.values(args).find((value) => typeof value === "string");
  return typeof first === "string" ? first : "";
}

/**
 * The steps an answer took. `timing` is when the reader's own browser saw each
 * thought start and end — the stream carries no clock of its own — keyed by
 * the message and the part's place in it; a thought replayed from history has
 * none.
 */
export function steps(
  messages: UIMessage[],
  timing: Map<string, { start: number; end?: number }>,
): Step[] {
  return messages.flatMap((message) =>
    message.parts.flatMap((part: Part, index): Step[] => {
      if (part.type === "reasoning") {
        if (part.text === "") return [];
        const seen = timing.get(`${message.id}:${index}`);
        return [
          {
            kind: "thought",
            text: part.text,
            running: part.state === "streaming",
            seconds:
              seen?.end === undefined
                ? null
                : Math.max(1, Math.round((seen.end - seen.start) / 1000)),
          },
        ];
      }
      if (!isToolUIPart(part)) return [];
      const tool = getToolName(part);
      return [
        {
          kind: "tool",
          tool,
          about: about(tool, part.input),
          state:
            part.state === "output-available"
              ? "done"
              : part.state === "output-error"
                ? "failed"
                : "running",
        },
      ];
    }),
  );
}

function capitalised(line: string): string {
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/** `Searched 3× · read 2 lessons · thought 14s`: every step, counted. */
export function summary(all: Step[]): string {
  const counts = new Map<string, number>();
  for (const step of all)
    if (step.kind === "tool") counts.set(step.tool, (counts.get(step.tool) ?? 0) + 1);
  const said = [...counts].map(([tool, count]) => {
    const { done, noun } = wording(tool);
    if (noun !== undefined) return `${done} ${count} ${noun[count === 1 ? 0 : 1]}`;
    return count > 1 ? `${done} ${count}×` : done;
  });
  const thoughts = all.filter((step) => step.kind === "thought");
  if (thoughts.length > 0) {
    const timed = thoughts.map((step) => step.seconds);
    const seconds = timed.every((value) => value !== null)
      ? timed.reduce((total, value) => total + value, 0)
      : null;
    said.push(seconds === null ? "thought" : `thought ${seconds}s`);
  }
  return capitalised(said.join(" · "));
}

/** The step under way, as it reads while it runs — or null between steps. */
export function current(all: Step[]): string | null {
  const last = all.at(-1);
  if (last === undefined) return null;
  if (last.kind === "thought") return last.running ? "thinking…" : null;
  if (last.state !== "running") return null;
  const { doing } = wording(last.tool);
  return `${doing}${last.about === "" ? "" : ` ${last.about}`}…`;
}

export function describe(step: Step & { kind: "tool" }): string {
  const name = step.tool.replace(/_/g, " ");
  const failed = step.state === "failed" ? " — failed" : "";
  return `${name}${step.about === "" ? "" : `: ${step.about}`}${failed}`;
}
