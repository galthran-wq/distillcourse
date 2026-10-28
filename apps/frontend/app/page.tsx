import Link from "next/link";
import { courseCover } from "@/lib/content/images";
import { getCourses } from "@/lib/content/site";

/**
 * The catalogue: one plate per course — a framed figure, its title, its
 * tagline. A reader's progress lives on the course page, not here.
 */
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6">
      <section className="pt-9 pb-7 sm:pt-[3.75rem] sm:pb-[2.75rem]">
        <h1 className="text-[1.55rem] leading-[1.2] font-semibold tracking-[-0.01em] sm:text-[2.05rem]">
          Short interactive courses on fundamentals
        </h1>
        <p className="mt-[0.85rem] max-w-[46rem] text-base leading-[1.6] text-soft sm:text-[1.12rem]">
          Each course is written as a textbook: definitions, theorems, worked
          examples, exercises with full solutions. Interactive models where the
          subject calls for them, labs where it needs code, and a tutor that has
          read every page.
        </p>
      </section>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 border-t border-line pt-6 sm:gap-x-[2.75rem] sm:gap-y-[3.25rem] sm:pt-[2.75rem] lg:grid-cols-3">
        {getCourses().map((loaded) => {
          const { slug, title, tagline } = loaded.course;
          const cover = courseCover(loaded);
          return (
            <li key={slug}>
              <Link href={`/courses/${slug}`} className="group block">
                <span
                  className={`relative block aspect-[4/3] overflow-hidden border border-line sm:aspect-[16/10] ${
                    cover === undefined
                      ? "bg-panel"
                      : cover.drawn
                        ? "bg-paper [--pad:0.35rem] sm:[--pad:0.9rem] [:root[data-theme=dark]_&]:bg-panel"
                        : "bg-paper [--pad:0px] [:root[data-theme=dark]_&]:bg-transparent"
                  }`}
                >
                  {cover !== undefined && (
                    // A plate's figure is decoration beside the title that names
                    // the link, so it has no alt text of its own.
                    // eslint-disable-next-line @next/next/no-img-element -- pre-sized static asset, no optimizer in this build
                    <img
                      src={cover.src}
                      alt=""
                      className={`absolute inset-(--pad) h-[calc(100%-2*var(--pad))] w-[calc(100%-2*var(--pad))] ${
                        cover.drawn
                          ? "object-contain [filter:var(--fig-filter)]"
                          : "object-cover [filter:var(--photo-filter)]"
                      }`}
                    />
                  )}
                </span>
                <h2 className="pt-[0.6rem] text-base leading-[1.25] font-semibold tracking-[-0.005em] group-hover:text-accent sm:pt-[0.95rem] sm:text-[1.3rem]">
                  {title}
                </h2>
                <p className="mt-[0.3rem] text-[0.86rem] leading-[1.4] text-soft sm:mt-[0.4rem] sm:text-[0.98rem] sm:leading-[1.5]">
                  {tagline}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
