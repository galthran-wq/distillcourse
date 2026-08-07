"use client";

import { getToolName, type DynamicToolUIPart, type ToolUIPart } from "ai";
import { CheckIcon } from "@/components/chat/icons";

type Part = ToolUIPart | DynamicToolUIPart;

/**
 * A tool run, as one line of the transcript rather than a section of it: what
 * the tutor reached for, and whether it came back. The reader opens it only if
 * they want to see the query and the answer behind an assertion.
 */
export default function ToolChip({ part }: { part: Part }) {
  // The tool's own name, which is what the harness reports; the widget adds no
  // vocabulary of its own so a tool shipped later needs no change here.
  const name = getToolName(part).replace(/_/g, " ");
  const failed = part.state === "output-error";
  const done = part.state === "output-available";
  const chip = (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border border-line bg-panel px-2 py-0.5 font-mono text-[11px] ${
        failed ? "text-accent" : "text-faint"
      }`}
    >
      {done ? (
        <CheckIcon className="size-3 shrink-0" />
      ) : (
        <span
          className={`size-1.5 shrink-0 rounded-full ${failed ? "bg-accent" : "animate-pulse bg-faint"}`}
        />
      )}
      <span className="truncate">
        {name}
        {failed ? " failed" : done ? "" : "…"}
      </span>
    </span>
  );

  const shown = detail(part).filter((value) => value !== undefined);
  if (shown.length === 0) return <span className={WRAP}>{chip}</span>;

  return (
    // Open, it is no longer one line among several, so it takes the width the
    // query and the answer need to be readable in.
    <details className={`${WRAP} open:block open:w-full`}>
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        {chip}
      </summary>
      <pre className="mt-1 max-h-48 overflow-auto rounded-sm border border-line bg-panel p-2 font-mono text-[11px] whitespace-pre-wrap text-soft">
        {shown.map((value) => JSON.stringify(value, null, 2)).join("\n\n")}
      </pre>
    </details>
  );
}

const WRAP = "mt-1 mr-1.5 mb-1 inline-block max-w-full align-middle";

/** What the tutor asked this tool and what it answered, as the parts hold it. */
function detail(part: Part): unknown[] {
  if (part.state === "output-available") return [part.input, part.output];
  if (part.state === "output-error") return [part.input, part.errorText];
  return [part.input];
}
