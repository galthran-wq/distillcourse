import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["md", "mdx", "ts", "tsx"],
  output: "standalone",
  // Pin the project root to this directory. Without it, Turbopack infers the
  // root from lockfile locations and picks the MAIN checkout when running
  // from a git worktree (two package-lock.json files) — client chunks then
  // resolve modules under two different roots and hydration dies, killing
  // every client component (theme toggle, demos, steppers).
  turbopack: { root: __dirname },
  // The dev server is reviewed from the public host, not localhost; without
  // this Next blocks cross-origin /_next/* requests (dead HMR socket, and on
  // some paths broken hydration) for any origin but localhost.
  allowedDevOrigins: ["91.194.2.214", "199.231.235.204"],
};

// Plugins are referenced by name (string form) so they can run under Turbopack;
// only serializable options are allowed here.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm", "remark-math"],
    rehypePlugins: [
      "rehype-katex",
      ["rehype-pretty-code", { theme: "github-dark-default" }],
    ],
  },
});

export default withMDX(nextConfig);
