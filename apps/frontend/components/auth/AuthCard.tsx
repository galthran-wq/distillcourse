"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@/components/ui";
import { ALERT_CLASS } from "@/components/ui/styles";
import { login, signup, MIN_PASSWORD_LENGTH } from "@/lib/auth/api";
import { ApiError } from "@/lib/http";
import { setUser } from "@/lib/auth/store";

type Mode = "login" | "signup";
type Reported = Partial<Record<"email" | "password", string>>;

/**
 * What the form can refuse without asking the server. The browser's own
 * validation says the same things in a bubble that covers the field and
 * disappears on the next keystroke; these stay under the field they are about.
 */
function refuse(mode: Mode, email: string, password: string): Reported {
  const found: Reported = {};
  if (email.trim() === "") found.email = "Enter your email address.";
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
    found.email = "That is not an email address.";
  if (password === "") found.password = "Enter your password.";
  // Mirrors the backend bound: refusing here beats a 422 the form can only
  // show verbatim. The login form must not describe the policy.
  else if (mode === "signup" && password.length < MIN_PASSWORD_LENGTH)
    found.password = `At least ${MIN_PASSWORD_LENGTH} characters.`;
  return found;
}

export default function AuthCard({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [reported, setReported] = useState<Reported>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    const problems = refuse(mode, text("email"), text("password"));
    setReported(problems);
    // Cleared before the guard: the last server answer described a request this
    // submit replaces, so it must not survive alongside the new field errors.
    setError(null);
    if (Object.keys(problems).length > 0) return;
    // Scheduling runs on the user's own clock, so the browser's zone is part
    // of every credential exchange, not something captured once at signup.
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setPending(true);
    try {
      const user = isSignup
        ? await signup({
            email: text("email"),
            password: text("password"),
            full_name: text("full_name") || undefined,
            timezone,
          })
        : await login({
            email: text("email"),
            password: text("password"),
            timezone,
          });
      setUser(user);
      // Where a guarded page sent this visitor from (`?next=`), read at submit
      // rather than via useSearchParams, which would cost the page a Suspense
      // boundary for one string. Same-site paths only: an absolute URL here
      // would make the login form an open redirect.
      const next = new URLSearchParams(window.location.search).get("next");
      // "//host" is protocol-relative and would leave the site too, and URL
      // resolution reads "\" as "/", so "/\host" is the same door.
      const stays =
        next !== null &&
        next.startsWith("/") &&
        !next.startsWith("//") &&
        !next.startsWith("/\\");
      router.push(stays ? next : "/");
    } catch (failure) {
      setError(
        failure instanceof ApiError ? failure.message : "the server is unreachable",
      );
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      {/* The card is the panel surface here, so the fields on it take the
          page's fill instead — a field on panel over panel is a border and
          nothing else. */}
      <div className="rounded-md border border-line bg-panel p-6 shadow-card sm:p-8 [--field:var(--paper)]">
        <h1 className="text-xl font-semibold tracking-tight">
          {isSignup ? "Create an account" : "Sign in"}
        </h1>
        <p className="mt-1.5 text-[13px] text-faint">
          {isSignup
            ? "An email and a password are all it takes."
            : "Your reading history, bookmarks and what the tutor remembers live on the account."}
        </p>

        {/* The messages are this form's, not the browser's. */}
        <form noValidate onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <Input
            name="email"
            label="Email"
            type="email"
            required
            error={reported.email}
          />
          <Input
            name="password"
            label="Password"
            type="password"
            required
            error={reported.password}
          />
          {isSignup && <Input name="full_name" label="Name (optional)" />}
          {error !== null && (
            <p role="alert" className={ALERT_CLASS}>
              {error}
            </p>
          )}
          <Button type="submit" variant="solid" disabled={pending} className="mt-1 w-full">
            {pending
              ? isSignup
                ? "Creating account…"
                : "Signing in…"
              : isSignup
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-[13px] text-faint">
        {isSignup ? "Already have an account? " : "No account yet? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="text-accent hover:underline"
        >
          {isSignup ? "Sign in" : "Sign up"}
        </Link>
        .
      </p>
    </div>
  );
}
