import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { MDXComponents } from "mdx/types";
import { getCourse, getCourses } from "@/lib/content/site";
import type { LoadedLesson } from "@/lib/content/load";
import { courseExtent, minutesOf } from "@/lib/content/extent";
import { isReadable, readableLessons } from "@/lib/content/visibility";
import CourseReadCount from "@/components/progress/CourseReadCount";
import LessonMark from "@/components/progress/LessonMark";
import StartHere from "@/components/progress/StartHere";
import ModuleFolds, { FoldChevron } from "@/components/progress/ModuleFolds";
import { ProgressProvider } from "@/lib/progress/context";
import Figure from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import MathText from "@/components/mdx/MathText";
import * as Blocks from "@/components/mdx/Blocks";
import { assetUrl, isDrawnFile } from "@/lib/content/images";
import { compileIntro, splitLead } from "@/lib/content/intro";
import { lessonPath } from "@/lib/content/locator";
import { coursePage, markdownUrl } from "@/lib/content/markdown-export";
import Lightbox from "@/components/mdx/Lightbox";
import { LABEL_CLASS } from "@/components/ui/styles";

interface Params {
  course: string;
}

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return getCourses().map((c) => ({ course: c.course.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { course } = await params;
  const loaded = getCourse(course);
  return {
    title: loaded?.course.title,
    description: loaded?.course.tagline,
    alternates: { types: { "text/markdown": markdownUrl(coursePage(course)) } },
  };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={`mb-3 ${LABEL_CLASS}`}>{children}</p>;
}

// The one word a lesson that is not written yet gets, and only on hover: a
// reader is shown the course, never its authoring state.
const NOT_WRITTEN = "Not written yet";

function nounFor(n: number, noun: string): string {
  return n === 1 ? noun : `${noun}s`;
}

function Count({ n, noun }: { n: number; noun: string }) {
  return (
    <>
      <span className="font-medium text-ink">{n}</span> {nounFor(n, noun)}
    </>
  );
}

function LessonRow({ course, entry }: { course: string; entry: LoadedLesson }) {
  const { lesson } = entry;
  const readable = isReadable(entry);
  const thumb =
    readable && lesson.key_image !== undefined
      ? assetUrl(course, lesson.slug, lesson.key_image)
      : undefined;
  const drawn = lesson.key_image !== undefined && isDrawnFile(lesson.key_image);

  const row = (
    <div className="flex items-center gap-4 py-2.5" title={readable ? undefined : NOT_WRITTEN}>
      <span className="text-[0.8rem] tabular-nums text-faint">
        {String(entry.index + 1).padStart(2, "0")}
      </span>
      {thumb !== undefined && (
        // The frame is outside the image so the dark theme's inversion of
        // drawn art does not invert the frame and its ground along with it.
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-sm border border-line bg-paper max-sm:hidden">
          <Lightbox
            src={thumb}
            alt={`${lesson.title} — key image`}
            className={`size-full ${drawn ? "object-contain p-1 [filter:var(--fig-filter)]" : "object-cover [filter:var(--photo-filter)]"}`}
          />
        </div>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[1rem] font-medium leading-snug ${
            readable ? "group-hover:text-accent" : "text-faint"
          }`}
        >
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-[0.88rem] text-faint max-sm:line-clamp-2 sm:truncate">
          {lesson.goal}
        </span>
      </span>
      <span className="flex items-center gap-3 text-[0.8rem] tabular-nums text-faint">
        {lesson.type === "extra" && (
          <span className="rounded-sm border border-dashed border-line px-1.5 py-0.5">extra</span>
        )}
        {lesson.type === "lab" && (
          <span
            className={`rounded-sm border px-1.5 py-0.5 ${readable ? "border-accent/40 text-accent" : "border-line"}`}
          >
            lab
          </span>
        )}
        <span className="whitespace-nowrap">
          {lesson.lab !== undefined ? `~${lesson.lab.est_hours} h` : `${lesson.est_minutes} min`}
        </span>
        {readable && <LessonMark lesson={lessonPath(course, lesson.slug)} />}
      </span>
    </div>
  );

  return readable ? (
    <Link href={`/courses/${course}/lessons/${lesson.slug}`} className="group block">
      {row}
    </Link>
  ) : (
    row
  );
}

export default async function CoursePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const loaded = getCourse((await params).course);
  if (loaded === undefined) notFound();
  const { course } = loaded;
  const bySlug = new Map(loaded.lessons.map((l) => [l.lesson.slug, l]));

  // intro.mdx (rich: figures, images, callouts) wins over the YAML prose.
  const introSource = loaded.introMdx ?? course.intro;
  const intro = introSource === undefined ? undefined : splitLead(introSource);
  const Lead = intro === undefined ? null : await compileIntro(intro.lead);
  const Rest = intro === undefined || intro.rest === "" ? null : await compileIntro(intro.rest);
  // Course-root figures resolve against the course dir (assets bucket
  // "_course"); Ref renders as plain text here (no lesson context).
  const introComponents =
    loaded.introMdx === undefined
      ? undefined
      : ({
          ...Blocks,
          Figure: (props: React.ComponentProps<typeof Figure>) => (
            <Figure {...props} lessonDir={loaded.dir} />
          ),
          FigureSequence: (props: React.ComponentProps<typeof FigureSequence>) => (
            <FigureSequence {...props} lessonDir={loaded.dir} />
          ),
          Ref: ({ children }: { children?: React.ReactNode; lesson: string }) => (
            <span>{children}</span>
          ),
        } as MDXComponents);
  const introClass = `course-intro leading-relaxed ${loaded.introMdx !== undefined ? "prose-lesson max-w-none" : "max-w-2xl"}`;

  const readable = readableLessons(loaded.lessons);
  const extent = courseExtent(course);

  return (
    <ProgressProvider course={course.slug}>
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="border-b border-line py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-soft">{course.tagline}</p>
          <p className="mt-4 text-[0.93rem] tabular-nums text-faint">
            <Count n={extent.parts} noun="part" /> · <Count n={extent.lessons} noun="lesson" /> · ~
            <span className="font-medium text-ink">{extent.hours}</span> h
            <CourseReadCount course={course.slug} lessons={readable} /> ·{" "}
            <a
              href="#about"
              className="whitespace-nowrap text-ink underline decoration-line underline-offset-2 hover:decoration-accent"
            >
              About this course ↓
            </a>
          </p>
        </header>

        <section id="contents" className="border-b border-line py-8">
          <SectionLabel>Contents</SectionLabel>
          <ModuleFolds
            course={course.slug}
            modules={course.modules.map((mod, mi) => {
              const lessons = mod.lessons.map((lesson) => bySlug.get(lesson.slug)!);
              const readableHere = readableLessons(lessons);
              return {
                slug: mod.slug,
                readable: readableHere,
                planned: readableHere.length === 0,
                heading: (
                  <h2 className="flex items-baseline gap-3">
                    <span className="text-[0.8rem] tabular-nums text-faint">
                      {String(mi + 1).padStart(2, "0")}
                    </span>
                    <span className="text-lg font-semibold">{mod.title}</span>
                  </h2>
                ),
                extent: `${mod.lessons.length} ${nounFor(mod.lessons.length, "lesson")} · ${minutesOf(mod.lessons)} min`,
                lessons: (
                  <ol className="mt-2">
                    {lessons.map((entry) => (
                      <StartHere
                        key={entry.lesson.slug}
                        course={course.slug}
                        lessons={readable}
                        slug={entry.lesson.slug}
                      >
                        <LessonRow course={course.slug} entry={entry} />
                      </StartHere>
                    ))}
                  </ol>
                ),
              };
            })}
          />
        </section>

        <section id="about">
          {Lead !== null && (
            <div className="border-b border-line py-8">
              <div className={introClass}>
                <Lead components={introComponents} />
              </div>
              {Rest !== null && (
                // The rest is folded, not left out: it stays in the HTML for
                // search engines and the content export alike.
                <details className="fold group/fold mt-4">
                  <summary className="w-fit cursor-pointer list-none text-[0.88rem] text-faint hover:text-accent group-open/fold:text-accent [&::-webkit-details-marker]:hidden">
                    <span className="group-open/fold:hidden">Read the full introduction</span>
                    <span className="hidden group-open/fold:inline">Fold the introduction</span>
                  </summary>
                  <div className={`mt-4 ${introClass}`}>
                    <Rest components={introComponents} />
                  </div>
                </details>
              )}
            </div>
          )}

          <details className="fold group/fold border-b border-line py-8">
            <summary className="flex cursor-pointer list-none items-baseline justify-between [&::-webkit-details-marker]:hidden">
              <span className={LABEL_CLASS}>About this course</span>
              <FoldChevron />
            </summary>
            <div className="mt-6 flex flex-col gap-8">
              {course.prerequisites.length > 0 && (
                <section>
                  <SectionLabel>Prerequisites</SectionLabel>
                  <ul className="flex flex-col gap-1.5">
                    {course.prerequisites.map((p, i) => (
                      <li key={i} className="flex gap-2 text-[0.95rem] text-soft">
                        <span aria-hidden className="text-faint">
                          –
                        </span>
                        <span>
                          <MathText text={p.text} />
                          {p.course !== undefined && (
                            <>
                              {" "}
                              <Link
                                href={`/courses/${p.course}`}
                                className="text-accent underline decoration-line underline-offset-2 hover:decoration-accent"
                              >
                                → course
                              </Link>
                            </>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <SectionLabel>Outcomes</SectionLabel>
                <ul className="flex flex-col gap-1.5">
                  {course.outcomes.map((o) => (
                    <li key={o.id} className="flex gap-2 text-[0.95rem] text-soft">
                      <span aria-hidden className="text-faint">
                        –
                      </span>
                      <MathText text={o.text} />
                    </li>
                  ))}
                </ul>
              </section>

              {course.key_results.length > 0 && (
                <section>
                  <SectionLabel>Key results</SectionLabel>
                  <ol className="flex list-none flex-col gap-2">
                    {course.key_results.map((kr, i) => {
                      const target = bySlug.get(kr.lesson);
                      const linked = target !== undefined && isReadable(target);
                      return (
                        <li key={i} className="flex gap-3 text-[0.95rem]">
                          <span className="shrink-0 text-[0.8rem] tabular-nums text-faint">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-soft">
                            <MathText text={kr.text} />{" "}
                            {/* Only the arrow is tied to the title. A nowrap title is
                                wider than a phone's column, and the li is a flex row,
                                so it would widen the whole document instead. */}
                            {linked ? (
                              <Link
                                href={`/courses/${course.slug}/lessons/${kr.lesson}`}
                                className="text-[0.88rem] text-accent hover:underline"
                              >
                                →&nbsp;{target.lesson.title}
                              </Link>
                            ) : (
                              target !== undefined && (
                                <span title={NOT_WRITTEN} className="text-[0.88rem] text-faint">
                                  →&nbsp;{target.lesson.title}
                                </span>
                              )
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
            </div>
          </details>
        </section>

        {course.sources.length > 0 && (
          <section className="py-8">
            <SectionLabel>Main sources</SectionLabel>
            <ol className="flex flex-col gap-1.5 pl-5 text-[0.92rem] leading-relaxed text-soft">
              {course.sources.map((s, i) => (
                <li key={i}>
                  <MathText text={s} />
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </ProgressProvider>
  );
}
