import { join, resolve } from "node:path";

// This app is apps/frontend; content/ is the human curation surface and lives
// at the repo root above it, shared with the content factory. Derived from
// __dirname, not cwd, so the scripts work from any invocation directory.
export const appRoot = resolve(__dirname, "..");
export const repoRoot = resolve(appRoot, "..", "..");
export const contentRoot = join(repoRoot, "content");
