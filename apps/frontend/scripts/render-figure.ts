#!/usr/bin/env tsx
/**
 * Figure verification renderer: `npm run figure -- <Name> [frame] [--dark]`
 *
 * Renders a registered component figure standalone (KaTeX included) and
 * screenshots it with headless Chrome to .preview/<Name>[-f<frame>][-dark].png.
 * The figure-artist loop: edit component -> run this -> LOOK at the PNG ->
 * fix -> repeat.
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { figures } from "../components/figures";
import { restoreInvocationDir } from "./invocation-dir";
import { appRoot } from "./paths";

restoreInvocationDir();

const args = process.argv.slice(2).filter((a) => a !== "--dark");
const dark = process.argv.includes("--dark");
const [target, frameArg] = args;

let name: string;
let component: ComponentType<{ frame?: number }>;
if (target !== undefined && target in figures) {
  name = target;
  component = figures[target].component;
} else if (target !== undefined && /\.svg$/.test(target)) {
  // Raw-SVG mode: no browser at all. librsvg rasterizes a house-style SVG in
  // ~0.1s and ~25 MB, against seconds and hundreds of megabytes for headless
  // chrome — and chrome's only job here was turning vectors into pixels the
  // reviewer can look at. `currentColor` has no meaning outside a document,
  // so the theme's text colour is injected on the root element.
  const svgPath = resolve(target);
  const src = readFileSync(svgPath, "utf8");
  const ink = dark ? "#eef0f2" : "#15171a";
  const paper = dark ? "#0f1012" : "#ffffff";
  const themed = src.replace(/<svg\b/, `<svg style="color:${ink}"`);
  const outDir = join(appRoot, ".preview");
  mkdirSync(outDir, { recursive: true });
  const tmp = join(outDir, `.themed-${basename(svgPath)}`);
  const png = join(
    outDir,
    `${basename(svgPath).replace(/\.svg$/, "")}${dark ? "-dark" : ""}.png`,
  );
  writeFileSync(tmp, themed);
  execFileSync(
    "rsvg-convert",
    ["-w", "1200", "-b", paper, tmp, "-o", png],
    { timeout: 30_000, killSignal: "SIGKILL" },
  );
  console.log(png);
  process.exit(0);
} else if (target !== undefined && /\.tsx?$/.test(target)) {
  // Path mode: render a not-yet-registered figure straight from its module.
  // Used when figures are built in parallel and registration is a single
  // later step (index.ts must not be edited concurrently).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require(resolve(target)) as {
    default?: ComponentType<{ frame?: number }>;
  };
  if (!mod.default) {
    console.error(`${target} has no default export`);
    process.exit(1);
  }
  component = mod.default;
  name = basename(target).replace(/\.tsx?$/, "");
} else {
  console.error(
    `Usage: npm run figure -- <Name|path/to/Figure.tsx> [frame] [--dark]\nRegistered: ${Object.keys(figures).join(", ") || "(none)"}`,
  );
  process.exit(1);
}

const frame = frameArg !== undefined ? Number(frameArg) : undefined;
const markup = renderToStaticMarkup(createElement(component, { frame }));

// Resolve through node's own lookup rather than assuming node_modules sits at
// the app root: a git worktree has none, and node walks up to the main
// checkout's. Guessing the path silently produced a dead <link>, KaTeX's CSS
// never loaded, `.katex-mathml` was left visible, and every formula rendered
// twice — a defect of the harness that reviewers saw as a defect of the figure.
const katexCss = require.resolve("katex/dist/katex.min.css");
const tokens = dark
  ? "--paper:#0f1012;--panel:#1a1c20;--ink:#eef0f2;--line:#33373d;"
  : "--paper:#ffffff;--panel:#f2f3f5;--ink:#15171a;--line:#d5d8dc;";

const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="file://${katexCss}">
<style>
  :root { ${tokens} }
  body { margin: 24px; background: var(--paper); color: var(--ink);
         font-family: system-ui, sans-serif; width: 800px; }
</style>
</head><body>${markup}</body></html>`;

const previewDir = join(appRoot, ".preview");
mkdirSync(previewDir, { recursive: true });
const htmlPath = join(previewDir, `${name}.html`);
writeFileSync(htmlPath, html);

const out = join(
  previewDir,
  `${name}${frame !== undefined ? `-f${frame}` : ""}${dark ? "-dark" : ""}.png`,
);
execFileSync(
  "google-chrome",
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-zygote",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    "--window-size=900,1400",
    `--screenshot=${out}`,
    `file://${htmlPath}`,
  ],
  // A hung renderer used to linger until the box ran out of memory: kill it
  // outright rather than leaving orphans behind. --no-zygote keeps chrome
  // from forking a process tree that outlives the parent.
  { timeout: 90_000, killSignal: "SIGKILL" },
);

// Trim the empty page area around the figure, keep a small margin.
const paper = dark ? "#0f1012" : "#ffffff";
execFileSync("convert", [
  out,
  "-trim",
  "+repage",
  "-bordercolor",
  paper,
  "-border",
  "32",
  out,
]);
console.log(out);
