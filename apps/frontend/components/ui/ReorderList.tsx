"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";

// Rows are separated by gap-1; a drag step is one row plus this gap.
const GAP_PX = 4;

interface Props<T> {
  items: readonly T[];
  itemKey: (item: T) => string;
  /** Spoken name of a row; its rank is appended. */
  itemLabel: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onReorder: (next: T[]) => void;
  /** A labelled line under row `index` (0-based) — a cut, a budget. */
  divider?: { index: number; label: string };
}

function move<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/**
 * A list the reader puts in order: drag a row by its handle, or focus the
 * handle and press the up/down arrows. Only the handle captures the pointer,
 * so a swipe elsewhere on a row still scrolls the page on a phone.
 */
export function ReorderList<T>({ items, itemKey, itemLabel, renderItem, onReorder, divider }: Props<T>) {
  const handles = useRef(new Map<string, HTMLButtonElement>());
  const drag = useRef<{ key: string; y: number; step: number } | null>(null);
  const refocus = useRef<string | null>(null);

  // Moving a DOM node can drop its focus; put it back on the moved handle.
  useEffect(() => {
    if (refocus.current) handles.current.get(refocus.current)?.focus();
    refocus.current = null;
  }, [items]);

  const shift = (key: string, by: number) => {
    const from = items.findIndex((it) => itemKey(it) === key);
    const to = Math.min(items.length - 1, Math.max(0, from + by));
    if (to !== from) onReorder(move(items, from, to));
    return to - from;
  };

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, key: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const row = e.currentTarget.closest("li");
    drag.current = { key, y: e.clientY, step: (row?.offsetHeight ?? 44) + GAP_PX };
  };

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const steps = Math.round((e.clientY - d.y) / d.step);
    if (steps !== 0) d.y += shift(d.key, steps) * d.step;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, key: string) => {
    const by = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (by === 0) return;
    e.preventDefault();
    refocus.current = key;
    if (shift(key, by) === 0) refocus.current = null;
  };

  return (
    <ol className="flex flex-col gap-1">
      {items.map((item, i) => {
        const key = itemKey(item);
        const cut = divider?.index === i;
        return (
          <li
            key={key}
            className={`relative flex items-center gap-2 ${cut ? "border-b-2 border-dashed border-accent pb-1" : ""}`}
          >
            <button
              type="button"
              ref={(el) => {
                if (el) handles.current.set(key, el);
                else handles.current.delete(key);
              }}
              aria-label={`${itemLabel(item)}, rank ${i + 1} of ${items.length}. Drag, or press the up or down arrow to move.`}
              onPointerDown={(e) => onPointerDown(e, key)}
              onPointerMove={onPointerMove}
              onPointerUp={() => (drag.current = null)}
              onPointerCancel={() => (drag.current = null)}
              onKeyDown={(e) => onKeyDown(e, key)}
              className="flex h-11 w-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm border border-line text-faint hover:border-faint active:cursor-grabbing"
            >
              <span aria-hidden>⋮⋮</span>
            </button>
            <div className="min-w-0 flex-1">{renderItem(item, i)}</div>
            {cut && (
              <span className="absolute -bottom-2.5 right-0 bg-panel px-1 text-[12px] text-accent">
                {divider.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
