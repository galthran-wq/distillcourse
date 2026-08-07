"use client";

import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

type Theme = "light" | "dark";

// The theme lives outside React (localStorage + the <html data-theme>
// attribute), so we expose it as an external store instead of syncing it
// into state from an effect.
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  const stored = window.localStorage.getItem("distillcourse.theme");
  if (stored === "light" || stored === "dark") return stored;
  // Light by default; dark only by explicit choice (matches globals.css).
  return "light";
}

function getServerSnapshot(): Theme | null {
  return null;
}

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("distillcourse.theme", next);
    listeners.forEach((listener) => listener());
  }

  return (
    <Button
      size="icon"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === null ? "◐" : theme === "dark" ? "☀" : "☾"}
    </Button>
  );
}
