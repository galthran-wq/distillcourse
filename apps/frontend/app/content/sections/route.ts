import { getLessonSections } from "@/lib/content/site";

// Prerendered with the rest of the site: the sections are the build's, and
// nothing about them can change until the next one.
export const dynamic = "force-static";

/**
 * The section index the tutor's `@`-autocomplete narrows over. A file rather
 * than part of every page's payload — the composer is the only thing that
 * reads it, and it is fetched the first time the panel is opened.
 */
export async function GET(): Promise<Response> {
  return Response.json(await getLessonSections());
}
