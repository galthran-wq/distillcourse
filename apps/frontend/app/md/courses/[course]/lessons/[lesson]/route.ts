import { lessonMarkdown, markdownResponse } from "@/lib/content/markdown-pages";
import { getLessonView, readableLessonParams } from "@/lib/content/site";

// Reached as `/courses/<course>/lessons/<lesson>.md` through the rewrite in
// next.config.ts: a segment cannot carry a suffix after its parameter.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams(): { course: string; lesson: string }[] {
  return readableLessonParams();
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ course: string; lesson: string }> },
): Promise<Response> {
  const { course, lesson } = await params;
  const view = getLessonView(course, lesson);
  if (view === undefined) return new Response("Not found", { status: 404 });
  return markdownResponse(lessonMarkdown(view));
}
