import { llmsTxt, markdownResponse } from "@/lib/content/markdown-export";
import { getCourses } from "@/lib/content/site";

export const dynamic = "force-static";

export function GET(): Response {
  return markdownResponse(llmsTxt(getCourses()));
}
