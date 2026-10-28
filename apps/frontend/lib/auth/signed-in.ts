"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "@/lib/auth/store";
import { answered } from "@/lib/load";

/**
 * Loads something that exists only for a signed-in reader; `null` until it is
 * there, and again once they sign out. One copy of the rule, so what "not loaded" means cannot drift between
 * the profile and the lesson controls.
 *
 * `load` must be a stable reference (a module function) — it is an effect
 * dependency, and a fresh closure would reload on every render.
 */
export function useSignedIn<T>(
  load: (key: string) => Promise<T>,
  key = "",
): [T | null, Dispatch<SetStateAction<T | null>>] {
  const auth = useAuth();
  const [value, setValue] = useState<T | null>(null);

  useEffect(() => {
    if (auth.status !== "signed-in") return;
    return answered(load(key), setValue);
  }, [auth.status, load, key]);

  return [auth.status === "signed-in" ? value : null, setValue];
}
