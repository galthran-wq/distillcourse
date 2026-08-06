import Link from "next/link";
import { LABEL_CLASS } from "@/components/ui/styles";
import { getCourses } from "@/lib/content/site";
import { isReadable } from "@/lib/content/visibility";

export default function Home() {
  const courses = getCourses();

  return (
    <div className="mx-auto w-full max-w-4xl px-6">
      <section className="border-b border-line py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Short interactive courses on fundamentals
        </h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-soft">
          Textbook-style chapters: definitions, theorems, worked examples,
          exercises with full solutions, references. Interactive models where
          the subject calls for them. No filler.
        </p>
      </section>

      <section className="py-10">
        <p className={`mb-4 ${LABEL_CLASS}`}>Courses</p>
        <ul className="flex flex-col gap-3">
          {courses.map(({ course, lessons }) => {
            const readable = lessons.filter(isReadable).length;
            return (
              <li key={course.slug}>
                <Link
                  href={`/courses/${course.slug}`}
                  className="group flex flex-col gap-2 rounded-md border border-line bg-paper px-5 py-4 transition-[color,border-color,box-shadow] duration-(--motion-base) hover:border-faint hover:shadow-card"
                >
                  <span className="flex items-baseline justify-between gap-4">
                    <span className="text-lg font-semibold tracking-tight group-hover:text-accent">
                      {course.title}
                    </span>
                    <span
                      aria-hidden
                      className="shrink-0 text-faint transition-colors duration-(--motion-base) group-hover:text-accent"
                    >
                      →
                    </span>
                  </span>
                  <span className="text-[0.95rem] text-soft">{course.tagline}</span>
                  {/* How much of the course is written; the count states it,
                      the bar is the same number at a glance. */}
                  <span className="mt-1 flex items-center gap-3">
                    <span aria-hidden className="h-1 flex-1 rounded-full bg-line">
                      <span
                        className="block h-full rounded-full bg-accent"
                        style={{
                          // A course with no lessons yet is 0% written, not NaN.
                          width:
                            lessons.length === 0
                              ? "0%"
                              : `${(readable / lessons.length) * 100}%`,
                        }}
                      />
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-faint">
                      {readable}/{lessons.length} lessons
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
