"use client";

import { stored } from "@/lib/chat/stored";

// Outside React because the lesson opens the panel too — quoting a passage is
// asking about it — and the two trees have no common ancestor. Stored because
// a reload is not a decision to close it.

export function openPanel(): void {
  stored.set({ open: true });
}

export function togglePanel(): void {
  stored.set({ open: !stored.get().open });
}

export function usePanel(): boolean {
  return stored.use("open");
}
