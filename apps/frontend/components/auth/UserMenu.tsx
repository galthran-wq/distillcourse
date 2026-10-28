"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { buttonClass, MENU_CLASS, MENU_ITEM_CLASS } from "@/components/ui/styles";
import { logout } from "@/lib/auth/api";
import { setUser, useAuth } from "@/lib/auth/store";
import { useDismiss } from "@/lib/ui/dismiss";

// The header must not jump sideways when the answer to "who is this" arrives,
// and the three answers are three different widths — so all three sit in one
// slot no narrower than the widest of them, the "Sign in" button.
const SLOT = "flex h-10 min-w-18 items-center justify-end";

export default function UserMenu() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useDismiss(open, root, setOpen);

  if (auth.status === "loading") return <span className={SLOT} />;

  if (auth.status === "anonymous") {
    return (
      <div className={SLOT}>
        <Link href="/login" className={buttonClass("outline", "sm")}>
          Sign in
        </Link>
      </div>
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
        className={`${MENU_ITEM_CLASS} ${pathname === href ? "text-accent" : "text-soft hover:text-ink"}`}
      >
        {label}
      </Link>
    );
  }

  return (
    <div ref={root} className={`relative ${SLOT}`}>
      {/* No role="menu" and no aria-haspopup: the panel is links and a button,
          which Tab already walks, and both would promise the arrow-key
          navigation of a real menu without providing it. aria-expanded is the
          whole truth — there is a thing below, and it is open. */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Account — ${user.email}`}
        className="text-[13px] font-semibold"
      >
        {(user.full_name ?? user.email).trim().charAt(0).toUpperCase()}
      </Button>
      {open && (
        <div className={`${MENU_CLASS} w-60`}>
          <p className="truncate px-2.5 pb-2 pt-1 text-[12px] text-faint">
            {user.email}
          </p>
          {item("/profile", "Profile")}
          {item("/profile/memories", "What the tutor remembers")}
          {item("/settings", "Settings")}
          <div className="my-1.5 border-t border-line" />
          <button
            type="button"
            onClick={() => void signOut()}
            className={`${MENU_ITEM_CLASS} text-soft hover:text-ink`}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
