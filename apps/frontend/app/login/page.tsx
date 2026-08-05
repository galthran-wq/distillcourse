import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="mx-auto w-full max-w-sm px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <AuthForm mode="login" />
      <p className="mt-6 text-sm text-faint">
        No account yet?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Sign up with an invite code
        </Link>
        .
      </p>
    </div>
  );
}
