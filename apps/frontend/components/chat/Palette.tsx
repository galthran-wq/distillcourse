"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MENU_ROW_CLASS, POPOVER_CLASS } from "@/components/ui/styles";

/** One row of such a list: what it is called in the DOM, and what it reads as. */
export interface PaletteRow {
  /** The row's id — what the field's `aria-activedescendant` names. */
  id: string;
  /** Geometry this row alone takes: a subsection sits under its section. */
  className?: string;
  children: ReactNode;
}

interface Props {
  /** What the field's `aria-controls` names. */
  id: string;
  label: string;
  rows: PaletteRow[];
  /** Which row Enter takes. The list is driven from the field it hangs over. */
  active: number;
  onPick: (index: number) => void;
}

/**
 * A list the composer opens over itself — the commands it accepts, the places
 * a question can point at. It hangs upwards because the field is at the bottom
 * of the panel and there is nothing below it to open into, and it is one
 * component because the two lists are one control to whoever reads it with a
 * screen reader or picks from it with a mouse: the same roles, the same
 * highlight, the same refusal to take the focus out of the field. Only the row
 * bodies are the caller's.
 */
export default function Palette({ id, label, rows, active, onPick }: Props) {
  const chosen = useRef<HTMLButtonElement>(null);

  // The list is capped in height and can hold more rows than it shows, so
  // walking it with the arrows has to carry it along: a highlight below the
  // fold is a row Enter takes and the reader never read.
  useEffect(() => {
    chosen.current?.scrollIntoView({ block: "nearest" });
  }, [active]);

  return (
    <div
      id={id}
      role="listbox"
      aria-label={label}
      className={`${POPOVER_CLASS} right-0 bottom-full left-0 mb-1.5 max-h-64 origin-bottom overflow-y-auto p-1.5`}
    >
      {rows.map((row, index) => (
        <button
          key={row.id}
          id={row.id}
          ref={index === active ? chosen : undefined}
          type="button"
          role="option"
          aria-selected={index === active}
          // The press must not take the focus out of the field: that is where
          // the line is being written and where the reader goes on typing.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(index)}
          className={`${MENU_ROW_CLASS} items-baseline gap-2 ${
            index === active ? "bg-line/60 text-ink" : "text-soft"
          } ${row.className ?? ""}`}
        >
          {row.children}
        </button>
      ))}
    </div>
  );
}
