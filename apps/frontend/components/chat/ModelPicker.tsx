"use client";

import { useRef, useState } from "react";
import { ChevronIcon } from "@/components/chat/icons";
import { CHIP_CLASS, MENU_ITEM_CLASS, POPOVER_CLASS } from "@/components/ui/styles";
import type { ChatModel } from "@/lib/chat/api";
import { useDismiss } from "@/lib/ui/dismiss";

/**
 * The model the chat runs on, chosen from the bottom-left of the composer — the
 * place a Cursor-style input keeps it. It names the current model and opens the
 * list upward, out of the corner it hangs from, since the composer sits at the
 * foot of the panel. Disabled while a run streams: the model is a field of the
 * chat and the backend refuses a change mid-run, so the control says so.
 */
export default function ModelPicker({
  models,
  current,
  disabled,
  onModel,
}: {
  models: ChatModel[];
  current: string;
  disabled: boolean;
  onModel: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useDismiss(open, box, setOpen);

  const name = models.find((m) => m.openrouter_id === current)?.display_name ?? "Model";

  return (
    <div ref={box} className="relative">
      {/* The site's small outlined control that names a thing (ui/styles): here
          it names the model the chat runs on, Cursor-style, at the foot of the
          composer. */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        aria-label="Model"
        aria-expanded={open}
        className={`${CHIP_CLASS} inline-flex gap-1 px-1.5 py-1 disabled:pointer-events-none disabled:opacity-45`}
      >
        {name}
        <ChevronIcon
          className={`size-3 transition-transform duration-(--motion-fast) ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div
          className={`${POPOVER_CLASS} bottom-full left-0 mb-1.5 w-56 origin-bottom-left p-1.5`}
        >
          {models.map((model) => (
            <button
              key={model.openrouter_id}
              type="button"
              className={`${MENU_ITEM_CLASS} truncate ${
                model.openrouter_id === current ? "text-accent" : "text-soft"
              }`}
              onClick={() => {
                setOpen(false);
                onModel(model.openrouter_id);
              }}
            >
              {model.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
