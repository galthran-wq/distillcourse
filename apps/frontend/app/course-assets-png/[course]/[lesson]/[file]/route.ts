import { assetDir } from "@/lib/content/images";
import { figurePng } from "@/lib/figure-png/render";

/**
 * `/course-assets/<course>/<lesson>/<file>.svg` as a PNG, for the Telegram
 * bot to send. A figure changes only with a deploy, and Telegram fetches the
 * URL afresh for every photo, so the answer is cached for good.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ course: string; lesson: string; file: string }> },
): Promise<Response> {
  const { course, lesson, file } = await params;
  const png = await figurePng(assetDir(process.cwd()), course, lesson, file);
  if (png === undefined) return new Response("not found", { status: 404 });
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
