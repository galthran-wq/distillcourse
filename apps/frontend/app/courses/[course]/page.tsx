import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { MDXComponents } from "mdx/types";
import { getCourse, getCourses } from "@/lib/content/site";
import { isReadable, previewMode, readableLessons } from "@/lib/content/visibility";
import CourseProgress from "@/components/progress/CourseProgress";
import LessonMark from "@/components/progress/LessonMark";
import ModuleFolds, { FoldChevron } from "@/components/progress/ModuleFolds";
import { ProgressProvider } from "@/lib/progress/context";
import Figure from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import MathText from "@/components/mdx/MathText";
import * as Blocks from "@/components/mdx/Blocks";
import { assetUrl } from "@/lib/content/images";
import { compileIntro, splitLead } from "@/lib/content/intro";
import { lessonPath } from "@/lib/content/locator";
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
  const loaded = getCourse((await params).course);
  return { title: loaded?.course.title, description: loaded?.course.tagline };
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className={`mb-3 ${LABEL_CLASS}`}>{children}</p>;
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

  return (
    <ProgressProvider course={course.slug}>
      <div className="mx-auto w-full max-w-4xl px-6">
        <header className="border-b border-line py-10">
          <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-soft">{course.tagline}</p>
          <CourseProgress course={course.slug} lessons={readableLessons(loaded.lessons)} />
        </header>

        {Lead !== null && (
          <section className="border-b border-line py-8">
            <div className={introClass}>
              <Lead components={introComponents} />
            </div>
            {Rest !== null && (
              // The rest is folded, not left out: it stays in the HTML for
              // search engines and the content export alike.
              <details className="fold group/fold mt-4">
                <summary className="w-fit cursor-pointer list-none font-mono text-[12px] text-faint hover:text-accent group-open/fold:text-accent [&::-webkit-details-marker]:hidden">
                  <span className="group-open/fold:hidden">Read the full introduction</span>
                  <span className="hidden group-open/fold:inline">Fold the introduction</span>
                </summary>
                <div className={`mt-4 ${introClass}`}>
                  <Rest components={introComponents} />
                </div>
              </details>
            )}
          </section>
        )}

        <section className="border-b border-line py-8">
          <SectionLabel>Contents</SectionLabel>
          <ModuleFolds
            course={course.slug}
            modules={course.modules.map((mod, mi) => ({
              slug: mod.slug,
              readable: readableLessons(mod.lessons.map((lesson) => bySlug.get(lesson.slug)!)),
              heading: (
                <h2 className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] text-faint">
                    {String(mi + 1).padStart(2, "0")}
                  </span>
                  <span className="text-lg font-semibold">{mod.title}</span>
                </h2>
              ),
              // A lab's est_minutes is nominal; its row shows est_hours, and so does this sum.
              extent: `${mod.lessons.length} ${mod.lessons.length === 1 ? "lesson" : "lessons"} · ${mod.lessons.reduce((sum, lesson) => sum + (lesson.lab !== undefined ? lesson.lab.est_hours * 60 : lesson.est_minutes), 0)} min`,
              lessons: (
                <ol className="mt-2">
                  {mod.lessons.map((lesson) => {
                    const entry = bySlug.get(lesson.slug)!;
                    const readable = isReadable(entry);
                    const number = String(entry.index + 1).padStart(2, "0");

                    const thumb =
                      lesson.key_image !== undefined
                        ? assetUrl(course.slug, lesson.slug, lesson.key_image)
                        : undefined;
                    const row = (
                      <div className="flex items-center gap-4 py-2.5">
                        <span className="font-mono text-[0.8rem] text-faint">{number}</span>
                        {thumb !== undefined && (
                          <Lightbox
                            src={thumb}
                            alt={`${lesson.title} — key image`}
                            className={`h-14 w-20 shrink-0 rounded-sm border border-line object-cover ${readable ? "" : "opacity-50"} ${(lesson.key_image ?? "").endsWith(".svg") ? "bg-white object-contain p-1" : ""}`}
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block text-[1rem] font-medium leading-snug ${
                              readable ? "group-hover:text-accent" : "text-faint"
                            }`}
                          >
                            {lesson.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[0.88rem] text-faint">
                            {lesson.goal}
                          </span>
                        </span>
                        <span className="flex items-center gap-3 font-mono text-[11px] text-faint">
                          {lesson.type === "extra" && (
                            <span className="rounded-sm border border-dashed border-line px-1.5 py-0.5">
                              extra
                            </span>
                          )}
                          {lesson.type === "lab" && (
                            <span className="rounded-sm border border-accent/40 px-1.5 py-0.5 text-accent">
                              lab
                            </span>
                          )}
                          {readable ? (
                            <>
                              {previewMode() && lesson.status !== "published" && (
                                <span className="rounded-sm border border-line px-1.5 py-0.5">
                                  {lesson.status}
                                </span>
                              )}
                              <span>
                                {lesson.lab !== undefined
                                  ? `~${lesson.lab.est_hours} h`
                                  : `${lesson.est_minutes} min`}
                              </span>
                              <LessonMark lesson={lessonPath(course.slug, lesson.slug)} />
                            </>
                          ) : (
                            <span>planned</span>
                          )}
                        </span>
                      </div>
                    );

                    return (
                      <li
                        key={lesson.slug}
                        className="list-none border-b border-line/60 last:border-b-0"
                      >
                        {readable ? (
                          <Link
                            href={`/courses/${course.slug}/lessons/${lesson.slug}`}
                            className="group block"
                          >
                            {row}
                          </Link>
                        ) : (
                          row
                        )}
                      </li>
                    );
                  })}
                </ol>
              ),
            }))}
          />
        </section>

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
                    const readable = target !== undefined && isReadable(target);
                    return (
                      <li key={i} className="flex gap-3 text-[0.95rem]">
                        <span className="shrink-0 font-mono text-[0.8rem] text-faint">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-soft">
                          <MathText text={kr.text} />{" "}
                          {/* Only the arrow is tied to the title. A nowrap title is
                              wider than a phone's column, and the li is a flex row,
                              so it would widen the whole document instead. */}
                          {readable ? (
                            <Link
                              href={`/courses/${course.slug}/lessons/${kr.lesson}`}
                              className="font-mono text-[11px] text-accent hover:underline"
                            >
                              →&nbsp;{target.lesson.title}
                            </Link>
                          ) : (
                            target !== undefined && (
                              <span className="font-mono text-[11px] text-faint">
                                →&nbsp;{target.lesson.title} (planned)
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
