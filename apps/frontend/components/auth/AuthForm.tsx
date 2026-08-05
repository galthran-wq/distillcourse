"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui";
import { login, signup, MIN_PASSWORD_LENGTH } from "@/lib/auth/api";
import { ApiError } from "@/lib/http";
import { setUser } from "@/lib/auth/store";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    // Scheduling runs on the user's own clock, so the browser's zone is part
    // of every credential exchange, not something captured once at signup.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setPending(true);
    setError(null);
    try {
      const user =
        mode === "signup"
          ? await signup({
              email: text("email"),
              password: text("password"),
              invite_code: text("invite_code"),
              full_name: text("full_name") || undefined,
              timezone,
            })
          : await login({
              email: text("email"),
              password: text("password"),
              timezone,
            });
      setUser(user);
      router.push("/");
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : "the server is unreachable",
      );
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
      <Input name="email" label="Email" type="email" required />
      <Input
        name="password"
        label="Password"
        type="password"
        required
        // Only on signup: the login form must not describe the policy, and a
        // browser that enforces it beats a 422 the form can only show verbatim.
        minLength={mode === "signup" ? MIN_PASSWORD_LENGTH : undefined}
      />
      {mode === "signup" && (
        <>
          <Input name="full_name" label="Name (optional)" />
          <Input name="invite_code" label="Invite code" required />
        </>
      )}
      {error && (
        <p role="alert" className="text-sm text-accent">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="min-h-11 rounded border border-line px-3 text-sm transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}
