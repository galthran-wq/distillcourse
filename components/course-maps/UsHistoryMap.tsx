import Link from "next/link";
import type { CourseMapProps } from "./index";
import { assetUrl } from "@/lib/content/images";

/**
 * The us-history roadmap as a pictorial timeline: one card per spine step —
 * a real artifact image, the years, and a concrete one-line event. Images
 * resolve from an explicit per-step pick first, then from the first lesson
 * in the step that has a key_image, so the map fills itself in as the
 * course gets written. Abstract argument language stays in the lessons;
 * the map shows things.
 */
const STEP_IMAGES: Record<number, string> = {
  4: "leutze-crossing.jpg",
  5: "constitution-page1.png",
  7: "tocqueville-title.png",
  9: "antietam-gardner.png",
  10: "homestead-encampment.png",
};

export default function UsHistoryMap({
  spine,
  courseSlug,
  lessonThumbs,
  readable,
}: CourseMapProps) {
  return (
    <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {spine.map((step, i) => {
        const explicit = STEP_IMAGES[i];
        const img =
          explicit !== undefined
            ? assetUrl(courseSlug, "_course", explicit)
            : step.lessons.map((s) => lessonThumbs[s]).find((u) => u !== undefined);
        const firstReadable = step.lessons.find((s) => readable.includes(s));
        const card = (
          <span className="block h-full overflow-hidden rounded border border-line bg-panel transition-colors group-hover:border-accent" title={step.step}>
            {img !== undefined ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img}
                alt=""
                aria-hidden
                loading="lazy"
                className={`h-24 w-full border-b border-line object-cover ${img.endsWith(".svg") ? "bg-white object-contain p-1" : "bg-white"}`}
              />
            ) : (
              <span className="flex h-24 w-full items-center justify-center border-b border-line font-mono text-2xl text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
            )}
            <span className="block px-2.5 py-2">
              <span className="block font-mono text-[11px] text-faint">
                {String(i + 1).padStart(2, "0")} · {step.years ?? ""}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-snug text-soft">
                {step.caption ?? step.label ?? ""}
              </span>
            </span>
          </span>
        );
        return (
          <li key={i} className="list-none">
            {firstReadable !== undefined ? (
              <Link
                href={`/courses/${courseSlug}/lessons/${firstReadable}`}
                className="group block h-full"
              >
                {card}
              </Link>
            ) : (
              <span className="block h-full opacity-80">{card}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
