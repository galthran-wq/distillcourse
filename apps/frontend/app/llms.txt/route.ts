import { llmsTxt, markdownResponse } from "@/lib/content/markdown-pages";
import { getCourses } from "@/lib/content/site";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(llmsTxt(getCourses()));
}
