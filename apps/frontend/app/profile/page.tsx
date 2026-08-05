import type { Metadata } from "next";
import ProfileLists from "@/components/profile/ProfileLists";
import { getLessonLinks } from "@/lib/content/site";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  // Titles and links come from the build, not from the API: the backend stores
  // lesson keys and knows nothing about which lessons exist.
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
      <ProfileLists lessons={getLessonLinks()} />
    </div>
  );
}
