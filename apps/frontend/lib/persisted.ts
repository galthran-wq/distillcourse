"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store";

export interface PersistedStore<T> {
  get: () => T;
  set: (patch: Partial<T>) => void;
  use: <K extends keyof T>(field: K) => T[K];
}

function load<T extends object>(key: string, initial: T): Partial<T> {
  try {
    const entry = window.localStorage.getItem(key);
    if (entry === null) return {};
    const parsed = JSON.parse(entry) as Record<string, unknown>;
    // Whatever is in there was written by an older version of this code, or by
    // hand, so a field is taken only if it is still the type its default is —
    // the readers call it as that type, and these stores are mounted on every
    // page, where one wrong field would break the whole site until the reader
    // cleared their own storage.
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([field, value]) => typeof value === typeof initial[field as keyof T],
      ),
    ) as Partial<T>;
  } catch {
    // No storage at all (the server render, a browser that refuses it) or
    // something unreadable left in it: the defaults are the answer either way.
    return {};
  }
}

/**
 * A record of state that outlives the tab, held in one localStorage entry.
 * Every field must be exactly one JSON type, since that type is all a corrupt
 * entry is checked against; write "" or 0 for absence rather than null.
 *
 * Fields are read one at a time, so a keystroke in one does not re-render the
 * readers of another. The server snapshot stays the declared initial value for
 * the reason `createStore` gives: the first client render has to reproduce
 * markup written by something that never saw this browser's storage. React
 * reads the live value again immediately after hydration, which is where the
 * stored one arrives.
 */
export function createPersistedStore<T extends object>(
  key: string,
  initial: T,
): PersistedStore<T> {
  const store = createStore<T>({ ...initial, ...load(key, initial) });

  return {
    get: store.get,
    set(patch: Partial<T>): void {
      // Merged onto the entry, not onto this tab's copy of it: every write goes
      // through storage, so what another tab has changed since this tab loaded
      // is already there, and merging the other way would write it back out.
      const next = { ...store.get(), ...load(key, initial), ...patch };
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // Refused or full: this tab still has to see its own change.
      }
      store.set(next);
    },
    use: <K extends keyof T>(field: K): T[K] =>
      useSyncExternalStore(
        store.subscribe,
        () => store.get()[field],
        () => initial[field],
      ),
  };
}
