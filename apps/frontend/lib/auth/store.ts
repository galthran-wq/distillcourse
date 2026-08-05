"use client";

import { useSyncExternalStore } from "react";
import { me, type User } from "@/lib/auth/api";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "signed-in"; user: User };

// The session cookie is httpOnly, so the only way to learn who is signed in is
// to ask the API once and share the answer with every component that asks.
const LOADING: AuthState = { status: "loading", user: null };
const ANONYMOUS: AuthState = { status: "anonymous", user: null };

let state: AuthState = LOADING;
let asked = false;
const listeners = new Set<() => void>();

export function setUser(user: User | null): void {
  asked = true;
  state = user ? { status: "signed-in", user } : ANONYMOUS;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!asked) {
    asked = true;
    me().then(setUser, () => setUser(null));
  }
  return () => {
    listeners.delete(listener);
  };
}

export function useAuth(): AuthState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => LOADING,
  );
}
