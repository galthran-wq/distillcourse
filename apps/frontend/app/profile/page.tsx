import type { Metadata } from "next";
import Link from "next/link";
import ProfileLists from "@/components/profile/ProfileLists";
import { buttonClass } from "@/components/ui/styles";
import { getLessonLinks } from "@/lib/content/site";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  // Titles and links come from the build, not from the API: the backend stores
  // lesson keys and knows nothing about which lessons exist.
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <Link href="/profile/memories" className={buttonClass("outline", "sm")}>
          What the tutor remembers
        </Link>
      </div>
      <ProfileLists lessons={getLessonLinks()} />
    </div>
  );
}
