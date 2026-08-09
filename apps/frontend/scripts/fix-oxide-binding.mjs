// tsx with --conditions=import (which every script here runs under, for the
// ESM-only deps) mis-serves JSON subpath requires: @tailwindcss/oxide's
// fallback loader requires its platform package's package.json for a version
// check, gets transpiled JS instead of JSON, and declares the native binding
// missing even though it loaded. Copying the .node file into the oxide package
// makes its FIRST candidate — a plain relative require — succeed, so the
// broken fallback path is never reached.
import { copyFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const tw = join(import.meta.dirname, '..', 'node_modules', '@tailwindcss')
try {
  for (const pkg of readdirSync(tw)) {
    if (!pkg.startsWith('oxide-')) continue
    for (const f of readdirSync(join(tw, pkg))) {
      if (f.endsWith('.node')) copyFileSync(join(tw, pkg, f), join(tw, 'oxide', f))
    }
  }
} catch {
  // no tailwind install to fix (e.g. CI cache miss mid-install) — nothing to do
}
