"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store";

export interface PersistedStore<T> {
  get: () => T;
  set: (patch: Partial<T>) => void;
  use: <K extends keyof T>(field: K) => T[K];
}

function load<T>(key: string): Partial<T> {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? {} : (JSON.parse(stored) as Partial<T>);
  } catch {
    // No storage at all (the server render, a browser that refuses it) or
    // something unreadable left in it: the defaults are the answer either way.
    return {};
  }
}

/**
 * A record of state that outlives the tab, held in one localStorage entry.
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
  const store = createStore<T>({ ...initial, ...load<T>(key) });

  return {
    get: store.get,
    set(patch: Partial<T>): void {
      const next = { ...store.get(), ...patch };
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
