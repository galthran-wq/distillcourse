/**
 * npm runs a script with cwd = its own package directory (apps/frontend), but
 * these CLIs are normally driven through the root proxy scripts and their path
 * arguments are typed relative to the repo root — `content/courses/…` above
 * all. npm exports the directory it was actually started in as INIT_CWD;
 * restoring it makes a path argument mean what the caller typed, both here and
 * in the tools these scripts shell out to.
 *
 * Call it before touching any path argument. No INIT_CWD (a bare `tsx
 * scripts/x.ts`) means nobody moved us, so cwd is already right.
 */
export function restoreInvocationDir(): void {
  const dir = process.env.INIT_CWD;
  if (dir !== undefined) process.chdir(dir);
}
