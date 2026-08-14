import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { MDXComponents } from "mdx/types";
import { getCourse, getCourses } from "@/lib/content/site";
import { isReadable, previewMode } from "@/lib/content/visibility";
import Figure from "@/components/mdx/Figure";
import FigureSequence from "@/components/mdx/FigureSequence";
import * as Blocks from "@/components/mdx/Blocks";
import { assetUrl } from "@/lib/content/images";
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
  let Intro: React.ComponentType<{ components?: MDXComponents }> | null = null;
  let introComponents: MDXComponents | undefined;
  const introSource = loaded.introMdx ?? course.intro;
  if (introSource !== undefined) {
    const compiled = await evaluate(introSource, {
      ...runtime,
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
    } as Parameters<typeof evaluate>[1]);
    Intro = compiled.default;
    if (loaded.introMdx !== undefined) {
      // Course-root figures resolve against the course dir (assets bucket
      // "_course"); Ref renders as plain text here (no lesson context).
      introComponents = {
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
      } as MDXComponents;
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6">
      <header className="border-b border-line py-10">
        <h1 className="text-3xl font-semibold tracking-tight">{course.title}</h1>
        <p className="mt-2 max-w-2xl text-soft">{course.tagline}</p>
      </header>

      {Intro !== null && (
        <section className="border-b border-line py-8">
          <SectionLabel>Introduction</SectionLabel>
          <div className={`course-intro leading-relaxed ${loaded.introMdx !== undefined ? "prose-lesson max-w-none" : "max-w-2xl"}`}>
            <Intro components={introComponents} />
          </div>
        </section>
      )}

      {course.prerequisites.length > 0 && (
        <section className="border-b border-line py-8">
          <SectionLabel>Prerequisites</SectionLabel>
          <ul className="flex flex-col gap-1.5">
            {course.prerequisites.map((p, i) => (
              <li key={i} className="flex gap-2 text-[0.95rem] text-soft">
                <span aria-hidden className="text-faint">
                  –
                </span>
                <span>
                  {p.text}
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

      <section className="border-b border-line py-8">
        <SectionLabel>Outcomes</SectionLabel>
        <ul className="flex flex-col gap-1.5">
          {course.outcomes.map((o) => (
            <li key={o.id} className="flex gap-2 text-[0.95rem] text-soft">
              <span aria-hidden className="text-faint">
                –
              </span>
              {o.text}
            </li>
          ))}
        </ul>
      </section>

      {course.key_results.length > 0 && (
        <section className="border-b border-line py-8">
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
                    {kr.text}{" "}
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

      <section className="border-b border-line py-8">
        <SectionLabel>Contents</SectionLabel>
        {course.modules.map((mod, mi) => (
          <div key={mod.slug} className={mi > 0 ? "mt-7" : ""}>
            <h2 className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] text-faint">
                {String(mi + 1).padStart(2, "0")}
              </span>
              <span className="text-lg font-semibold">{mod.title}</span>
            </h2>
            <ol className="mt-3">
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
          </div>
        ))}
      </section>

      {course.sources.length > 0 && (
        <section className="py-8">
          <SectionLabel>Main sources</SectionLabel>
          <ol className="flex flex-col gap-1.5 pl-5 text-[0.92rem] leading-relaxed text-soft">
            {course.sources.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
