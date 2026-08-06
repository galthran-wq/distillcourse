"use client";

import { createStore } from "@/lib/store";

// Outside React because the lesson opens the panel too — quoting a passage is
// asking about it — and the two trees have no common ancestor.
const open = createStore(false);

export function openPanel(): void {
  open.set(true);
}

export function togglePanel(): void {
  open.set(!open.get());
}

export function usePanel(): boolean {
  return open.use();
}
