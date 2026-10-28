import CourseList from "@/components/progress/CourseList";
import { LABEL_CLASS } from "@/components/ui/styles";
import { getCourses } from "@/lib/content/site";
import { readableLessons } from "@/lib/content/visibility";
import { ProgressProvider } from "@/lib/progress/context";

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
        <ProgressProvider>
          <CourseList
            courses={courses.map(({ course, lessons }) => ({
              slug: course.slug,
              title: course.title,
              tagline: course.tagline,
              lessons: readableLessons(lessons),
            }))}
          />
        </ProgressProvider>
      </section>
    </div>
  );
}
