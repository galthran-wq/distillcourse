import katex from "katex";

/**
 * Real math inside component figures: KaTeX rendered server-side to static
 * HTML. Use `display` for block equations. Colors: wrap parts of the TeX in
 * \htmlStyle or pass a color prop for the whole formula.
 */
export function M({
  tex,
  display = false,
  color,
  size,
}: {
  tex: string;
  display?: boolean;
  color?: string;
  size?: number;
}) {
  const html = katex.renderToString(tex, {
    displayMode: display,
    throwOnError: false,
    trust: true,
    strict: false,
  });
  return (
    <span
      style={{ color, fontSize: size }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
