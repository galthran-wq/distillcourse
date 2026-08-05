"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth/api";
import { setUser, useAuth } from "@/lib/auth/store";

export default function UserMenu() {
  const auth = useAuth();
  const router = useRouter();

  if (auth.status === "loading") return <span className="h-9" />;

  if (auth.status === "anonymous") {
    return (
      <Link href="/login" className="text-[13px] text-soft hover:text-accent">
        Sign in
      </Link>
    );
  }

  async function signOut() {
    await logout();
    setUser(null);
    router.push("/");
  }

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] text-faint">{auth.user.email}</span>
      <button
        type="button"
        onClick={signOut}
        className="text-[13px] text-soft hover:text-accent"
      >
        Sign out
      </button>
    </div>
  );
}
