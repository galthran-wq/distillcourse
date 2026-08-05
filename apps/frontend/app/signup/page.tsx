import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign up</h1>
      <p className="mt-2 text-sm text-soft">
        Accounts are invite-only while the tutor is in private use.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-sm text-faint">
        Already have an account?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Sign in
        </Link>
        .
      </p>
    </div>
  );
}
