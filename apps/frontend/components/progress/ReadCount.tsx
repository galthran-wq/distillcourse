import Link from "next/link";
import { LABEL_CLASS } from "@/components/ui/styles";
import type { CourseProgress } from "@/lib/progress/summary";

/** `7 of 23 read` and where to pick up. */
export default function ReadCount({
  course,
  progress,
}: {
  course: string;
  progress: CourseProgress;
}) {
  return (
    <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <span className={LABEL_CLASS}>
        {progress.read} of {progress.total} read
      </span>
      {progress.next !== undefined && (
        // `relative` lifts it over a card whose title link is stretched across
        // the whole card, so this link still takes its own clicks.
        <Link
          href={`/courses/${course}/lessons/${progress.next.slug}`}
          className="relative text-[0.9rem] text-accent hover:underline"
        >
          Continue: {progress.next.title}
        </Link>
      )}
    </span>
  );
}
