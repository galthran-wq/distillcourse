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
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:gap-5 sm:px-6">
        <Link
          href="/"
          className="shrink-0 rounded-sm text-[15px] font-semibold tracking-tight transition-colors duration-(--motion-fast) hover:text-accent"
        >
          distillcourse
        </Link>
        <nav className="min-w-0">
          <Link
            href="/"
            aria-current={onCourses ? "page" : undefined}
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
