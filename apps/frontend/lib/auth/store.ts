"use client";

import { useSyncExternalStore } from "react";
import { me, type User } from "@/lib/auth/api";
import { resetSession } from "@/lib/chat/session";
import { claimStored } from "@/lib/chat/stored";
import { createStore } from "@/lib/store";

export type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "signed-in"; user: User };

// The session cookie is httpOnly, so the only way to learn who is signed in is
// to ask the API once and share the answer with every component that asks.
const LOADING: AuthState = { status: "loading", user: null };
const ANONYMOUS: AuthState = { status: "anonymous", user: null };

const auth = createStore<AuthState>(LOADING);
let asked = false;

export function setUser(user: User | null): void {
  asked = true;
  const previous = auth.get().user;
  // Everything held for the reader outside React belongs to this identity:
  // whoever signs in next on this tab must not inherit the previous one's
  // conversation with the tutor.
  if (user?.id !== previous?.id) resetSession();
  // Unconditionally, and never mind `previous`: this call also arrives on every
  // load, where nobody was signed in yet and the entry itself is the only thing
  // that knows who left the draft in it.
  claimStored(user?.id ?? "");
  auth.set(user ? { status: "signed-in", user } : ANONYMOUS);
}

// Wrapped rather than used directly: the first component to read the store is
// what triggers the one request that answers who is signed in.
function subscribe(listener: () => void): () => void {
  if (!asked) {
    asked = true;
    me().then(setUser, () => setUser(null));
  }
  return auth.subscribe(listener);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, auth.get, () => LOADING);
}
