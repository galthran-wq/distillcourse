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
import { join, resolve } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { figures } from "../components/figures";

const args = process.argv.slice(2).filter((a) => a !== "--dark");
const dark = process.argv.includes("--dark");
const [name, frameArg] = args;

if (!name || !(name in figures)) {
  console.error(
    `Usage: npm run figure -- <Name> [frame] [--dark]\nRegistered: ${Object.keys(figures).join(", ") || "(none)"}`,
  );
  process.exit(1);
}

const frame = frameArg !== undefined ? Number(frameArg) : undefined;
const markup = renderToStaticMarkup(
  createElement(figures[name].component, { frame }),
);

const repoRoot = resolve(__dirname, "..");
const katexCss = join(repoRoot, "node_modules/katex/dist/katex.min.css");
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

const previewDir = join(repoRoot, ".preview");
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
