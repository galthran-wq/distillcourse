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
import { mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { figures } from "../components/figures";
import { restoreInvocationDir } from "./invocation-dir";

restoreInvocationDir();

const args = process.argv.slice(2).filter((a) => a !== "--dark");
const dark = process.argv.includes("--dark");
const [target, frameArg] = args;

let name: string;
let component: ComponentType<{ frame?: number }>;
if (target !== undefined && target in figures) {
  name = target;
  component = figures[target].component;
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

const appRoot = resolve(__dirname, "..");
const katexCss = join(appRoot, "node_modules/katex/dist/katex.min.css");
const tokens = dark
  ? "--paper:#131312;--panel:#1d1d1b;--ink:#eaeae6;--line:#34342f;"
  : "--paper:#fdfdfc;--panel:#f4f4f1;--ink:#191918;--line:#d9d9d3;";

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
execFileSync("google-chrome", [
  "--headless=new",
  "--disable-gpu",
  "--no-sandbox",
  "--hide-scrollbars",
  "--force-device-scale-factor=2",
  "--window-size=900,1400",
  `--screenshot=${out}`,
  `file://${htmlPath}`,
]);

// Trim the empty page area around the figure, keep a small margin.
const paper = dark ? "#131312" : "#fdfdfc";
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
