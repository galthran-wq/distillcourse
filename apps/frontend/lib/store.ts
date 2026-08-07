"use client";

import { useSyncExternalStore } from "react";

export interface Store<T> {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
  use: () => T;
}

/**
 * State that outlives the components reading it, for the cases where React's
 * own context cannot hold it: trees with no common ancestor, and values that
 * must survive a remount.
 */
export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<() => void>();

  const get = (): T => value;
  const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    get,
    subscribe,
    set(next: T): void {
      value = next;
      listeners.forEach((listener) => listener());
    },
    // The server snapshot is the initial value, not the current one: nothing
    // outside the browser has told this store anything, and a snapshot that
    // varies per render makes React loop.
    use: (): T => useSyncExternalStore(subscribe, get, () => initial),
  };
}
