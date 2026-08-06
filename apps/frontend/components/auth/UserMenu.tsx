"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { buttonClass } from "@/components/ui/styles";
import { logout } from "@/lib/auth/api";
import { setUser, useAuth } from "@/lib/auth/store";

const ITEM =
  "block w-full rounded-sm px-2.5 py-2 text-left text-[13px] transition-colors duration-(--motion-fast) hover:bg-line/60";

export default function UserMenu() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent): void => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  // Holds the trigger's place, so the header does not jump sideways when the
  // answer to "who is this" arrives.
  if (auth.status === "loading") return <span className="size-10" />;

  if (auth.status === "anonymous") {
    return (
      <Link href="/login" className={buttonClass("outline", "sm")}>
        Sign in
      </Link>
    );
  }

  const { user } = auth;

  async function signOut(): Promise<void> {
    setOpen(false);
    await logout();
    setUser(null);
    router.push("/");
  }

  function item(href: string, label: string) {
    return (
      <Link
        href={href}
        aria-current={pathname === href ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={`${ITEM} ${pathname === href ? "text-accent" : "text-soft hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <div ref={root} className="relative">
      {/* No role="menu": the panel is links and a button, which Tab already
          walks — the role would promise arrow-key navigation and not have it. */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Account — ${user.email}`}
        className="text-[13px] font-semibold"
      >
        {(user.full_name ?? user.email).trim().charAt(0).toUpperCase()}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-md border border-line bg-panel p-1.5 shadow-popover">
          <p className="truncate px-2.5 pb-2 pt-1 font-mono text-[11px] text-faint">
            {user.email}
          </p>
          {item("/profile", "Profile")}
          {item("/profile/memories", "What the tutor remembers")}
          {item("/settings", "Settings")}
          <div className="my-1.5 border-t border-line" />
          <button
            type="button"
            onClick={() => void signOut()}
            className={`${ITEM} text-soft hover:text-ink`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
