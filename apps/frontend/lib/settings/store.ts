"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/store";
import { getSettings, type Settings } from "@/lib/settings/api";
import { createStore } from "@/lib/store";

// One read of /settings per reader, shared: the banner sits in the layout and
// the panel on its own page — two trees with no common ancestor — and a write
// in the panel has to reach the banner without a reload.
const store = createStore<Settings | null>(null);
let asked = false;

/** What a write answered with. Every writer calls this, or the banner lies. */
export function setSettings(next: Settings | null): void {
  store.set(next);
}

export function useSettings(): Settings | null {
  const auth = useAuth();

  useEffect(() => {
    if (auth.status !== "signed-in") {
      // Whoever signs in next must not be shown the last reader's channel.
      asked = false;
      store.set(null);
      return;
    }
    if (asked) return;
    asked = true;
    getSettings().then(store.set, () => store.set(null));
  }, [auth.status]);

  return store.use();
}
