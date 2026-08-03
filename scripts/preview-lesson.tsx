#!/usr/bin/env tsx
/**
 * Lesson preview renderer: `npm run preview -- <course> <lesson>`
 *
 * Renders one lesson's MDX with the real MDX components and the project's
 * compiled CSS into `.preview/<lesson>-light.html` and `-dark.html`, and
 * screenshots both with headless Chrome. The figure-level equivalent is
 * `npm run figure`; this is the page-level one — how a sourced image, a
 * floated figure or a sequence's first frame actually lands in the chapter,
 * in both themes, without starting a dev server.
 *
 * Static render only: client islands (demos, the carousel's controls) are not
 * interactive here, and a sequence shows every frame stacked. Use the dev
 * server for interaction; use this to LOOK.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeSlug from "rehype-slug";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import Figure from "../components/mdx/Figure";
import FigureSequence from "../components/mdx/FigureSequence";
import { ImageCredits } from "../components/mdx/SourcedImage";
import * as Blocks from "../components/mdx/Blocks";
import { loadCredits } from "../lib/content/credits";

const repoRoot = resolve(__dirname, "..");
const [course, lesson] = process.argv.slice(2);
const shoot = !process.argv.includes("--no-screenshot");

if (course === undefined || lesson === undefined) {
  console.error("Usage: npm run preview -- <course> <lesson> [--no-screenshot]");
  process.exit(1);
}

const lessonDir = join(repoRoot, "content/courses", course, "lessons", lesson);
if (!existsSync(join(lessonDir, "lesson.mdx"))) {
  console.error(`No lesson.mdx in ${lessonDir}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const cssPath = join(repoRoot, "app/globals.css");
  const css = (
    await postcss([tailwind()]).process(readFileSync(cssPath, "utf8"), {
      from: cssPath,
    })
  ).css;

  const { default: MDXContent } = await evaluate(
    readFileSync(join(lessonDir, "lesson.mdx"), "utf8"),
    {
      ...runtime,
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeSlug, rehypeKatex],
    } as Parameters<typeof evaluate>[1],
  );

  const imageCredits = loadCredits(lessonDir).entries;

  const components = {
    ...Blocks,
    References: (props: { children: unknown }) =>
      createElement(Blocks.References, {
        ...(props as { children: React.ReactNode }),
        credits: createElement(ImageCredits, { credits: imageCredits }),
      }),
    // Cross-links and demos are the page's job, not the preview's.
    Ref: ({ children, lesson: target }: { children?: unknown; lesson: string }) =>
      createElement("span", null, (children ?? target) as never),
    Demo: ({ name }: { name?: string }) =>
      createElement(
        "div",
        { className: "my-10 rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint" },
        `demo “${name ?? ""}” (interactive — run the dev server)`,
      ),
    Figure: (props: Record<string, unknown>) =>
      createElement(Figure, { ...props, lessonDir } as never),
    FigureSequence: (props: Record<string, unknown>) =>
      createElement(FigureSequence, { ...props, lessonDir } as never),
  };

  // Sourced images are served from /course-assets at runtime; in a file://
  // preview they resolve straight out of public/.
  const body = renderToStaticMarkup(
    createElement(MDXContent as never, { components } as never),
  ).replaceAll('src="/course-assets/', `src="file://${repoRoot}/public/course-assets/`);

  const katex = readFileSync(
    join(repoRoot, "node_modules/katex/dist/katex.min.css"),
    "utf8",
  );
  const previewDir = join(repoRoot, ".preview");
  mkdirSync(previewDir, { recursive: true });

  // The chapter is long; a second, short page holds just its figures, which
  // is what the figure loops (image-sourcer, figure-artist) need to look at.
  const figuresOnly = (body.match(/<figure[\s\S]*?<\/figure>/g) ?? []).join("\n");
  console.log(`${(body.match(/<figure/g) ?? []).length} figure(s) in the chapter`);

  const page = (theme: string, content: string): string =>
    `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">
<style>${katex}</style><style>${css}</style>
<style>
  body { background: var(--paper); color: var(--ink); margin: 0; }
  .wrap { max-width: 46rem; margin: 0 auto; padding: 2.5rem 1.5rem; }
  img { max-width: 100%; }
</style></head>
<body><div class="wrap prose-lesson">${content}</div></body></html>`;

  for (const theme of ["light", "dark"] as const) {
    for (const [suffix, content, height] of [
      [theme, body, 4000],
      [`figures-${theme}`, figuresOnly, 6000],
    ] as const) {
      const htmlPath = join(previewDir, `${lesson}-${suffix}.html`);
      writeFileSync(htmlPath, page(theme, content));
      console.log(htmlPath);
      if (!shoot) continue;
      const png = join(previewDir, `${lesson}-${suffix}.png`);
      try {
        execFileSync(chromePath(), [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--hide-scrollbars",
          "--allow-file-access-from-files",
          `--window-size=1100,${height}`,
          `--screenshot=${png}`,
          `file://${htmlPath}`,
        ]);
        // Trim the empty page below the content so the PNG is readable.
        try {
          execFileSync("convert", [png, "-trim", "+repage", "-bordercolor", "none", "-border", "24", png]);
        } catch {
          /* ImageMagick is optional */
        }
        console.log(png);
      } catch (err) {
        console.error(`screenshot failed (${(err as Error).message}) — open the HTML instead`);
      }
    }
  }
}

/** google-chrome if installed, else the Playwright chromium many boxes have. */
function chromePath(): string {
  for (const candidate of [
    process.env.CHROME_PATH,
    "google-chrome",
    "chromium",
  ]) {
    if (candidate === undefined) continue;
    try {
      execFileSync("which", [candidate], { stdio: "ignore" });
      return candidate;
    } catch {
      /* keep looking */
    }
  }
  const cache = join(process.env.HOME ?? "", ".cache/ms-playwright");
  if (existsSync(cache)) {
    for (const dir of readdirSync(cache).filter((d) => d.startsWith("chromium-"))) {
      for (const layout of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
        const path = join(cache, dir, layout);
        if (existsSync(path)) return path;
      }
    }
  }
  return "google-chrome";
}

void main();
