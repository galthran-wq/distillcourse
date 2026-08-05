import type { MDXComponents } from "mdx/types";

// Custom lesson components (Checkpoint, Demo, Figure, WorkedExample, Recap,
// Aside) are registered here once they exist under components/mdx/.
const components: MDXComponents = {};

export function useMDXComponents(): MDXComponents {
  return components;
}
