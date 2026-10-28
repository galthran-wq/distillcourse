import { courseMarkdown, markdownResponse } from "@/lib/content/markdown-export";
import { getCourse, getCourses } from "@/lib/content/site";

// Reached as `/courses/<course>.md` through the rewrite in next.config.ts.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams(): { course: string }[] {
  return getCourses().map((c) => ({ course: c.course.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ course: string }> },
): Promise<Response> {
  const course = getCourse((await params).course);
  if (course === undefined) return new Response("Not found", { status: 404 });
  return markdownResponse(courseMarkdown(course));
}
