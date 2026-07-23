import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["md", "mdx", "ts", "tsx"],
  output: "standalone",
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
