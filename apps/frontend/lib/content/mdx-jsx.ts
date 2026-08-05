/**
 * The MDX JSX nodes — `mdxJsxFlowElement` and `mdxJsxTextElement` — and the one
 * reader for their attributes.
 *
 * They belong to neither the mdast nor the hast node union, so every consumer
 * has to describe their shape itself. This module is that description, shared
 * so the linter and the index export cannot drift apart about what a component
 * attribute is: widen attribute handling here (say, to read
 * `mdxJsxExpressionAttribute` for `<Figure caption={x}>`) and both sides widen
 * together.
 */

export interface MdxJsxAttribute {
  type: string;
  name?: string;
  value?: unknown;
}

/** `Child` is the host tree's node type: mdast for the linter, hast for the export. */
export interface MdxJsxNode<Child = unknown> {
  type: string;
  name?: string | null;
  attributes?: MdxJsxAttribute[];
  children?: Child[];
}

/**
 * Call this on a value typed `unknown`. Every mdast and hast node is already
 * structurally assignable to MdxJsxNode, so narrowing a tree's own node union
 * with it is a no-op and `.name` stays unreachable.
 */
export function isMdxJsxNode(node: unknown): node is MdxJsxNode {
  const type = (node as { type?: string }).type;
  return type === "mdxJsxFlowElement" || type === "mdxJsxTextElement";
}

/** Depth-first collection of the JSX elements within a node list. */
export function collectJsx(nodes: unknown[]): MdxJsxNode[] {
  const out: MdxJsxNode[] = [];
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop() as MdxJsxNode;
    if (isMdxJsxNode(node)) out.push(node);
    if (Array.isArray(node.children)) stack.push(...node.children);
  }
  return out;
}

/** A literal string attribute; an expression attribute reads as absent. */
export function stringAttr(node: MdxJsxNode, name: string): string | undefined {
  const attr = node.attributes?.find(
    (a) => a.type === "mdxJsxAttribute" && a.name === name,
  );
  return typeof attr?.value === "string" ? attr.value : undefined;
}
