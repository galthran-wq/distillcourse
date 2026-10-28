"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import UserMenu from "@/components/auth/UserMenu";

export default function SiteHeader() {
  const pathname = usePathname();
  // The course list is the site's front page, so the two are one section.
  const onCourses = pathname === "/" || pathname.startsWith("/courses");

  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm text-[17px] font-bold tracking-[-0.01em] transition-colors duration-(--motion-fast) hover:text-accent"
        >
          distillcourse
        </Link>
        <nav className="min-w-0">
          {/* aria-current is about the href, not the section: this item points
              at "/", so it is the current page only on "/". The highlight is
              the section's, and stays on through a course. */}
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={`block rounded-sm px-2 py-1.5 text-[13px] transition-colors duration-(--motion-fast) ${
              onCourses
                ? "bg-panel font-medium text-ink"
                : "text-soft hover:bg-panel hover:text-ink"
            }`}
          >
            Courses
          </Link>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
