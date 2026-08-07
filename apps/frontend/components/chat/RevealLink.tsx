"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { reveal } from "@/lib/lesson/anchor";

/**
 * A link from the panel into the site: client-side, and from the layout the
 * panel lives in, so the conversation survives the navigation it causes — and
 * the section it names is scrolled to and marked on arrival, which the browser
 * does not do for a page it is already on. Both things the tutor points at go
 * through here: a reference it wrote, and a passage the reader attached.
 */
export default function RevealLink({
  href,
  className,
  title,
  children,
}: {
  href: string;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => reveal(href.split("#")[1] ?? null)}
      className={className}
      title={title}
    >
      {children}
    </Link>
  );
}
