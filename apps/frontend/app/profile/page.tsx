import type { Metadata } from "next";
import Link from "next/link";
import ProfileLists from "@/components/profile/ProfileLists";
import { getLessonLinks } from "@/lib/content/site";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  // Titles and links come from the build, not from the API: the backend stores
  // lesson keys and knows nothing about which lessons exist.
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <Link
          href="/profile/memories"
          className="font-mono text-[11px] tracking-wide text-faint hover:text-accent"
        >
          what the tutor remembers
        </Link>
      </div>
      <ProfileLists lessons={getLessonLinks()} />
    </div>
  );
}
