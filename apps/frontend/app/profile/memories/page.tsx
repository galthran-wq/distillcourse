import type { Metadata } from "next";
import Memories from "@/components/profile/Memories";

export const metadata: Metadata = { title: "What the tutor remembers" };

export default function MemoriesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">What the tutor remembers</h1>
      <p className="mt-3 text-sm text-soft">
        A profile the tutor keeps of you, used in every chat and in the messages it
        sends on its own. Correct anything that is wrong; delete anything it should
        not keep.
      </p>
      <Memories />
    </div>
  );
}
