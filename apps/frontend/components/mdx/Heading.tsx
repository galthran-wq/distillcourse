import type { ComponentProps } from "react";

/**
 * The "#" after a heading: a plain fragment link, so following it puts the
 * section in the address bar and the reader copies the URL from there (or
 * "Copy link" on the mark itself). Hidden until the heading is hovered; on a
 * touch screen, which has no hover, it stays faintly visible.
 */
export function AnchorMark({ id }: { id: string }) {
  return (
    <a href={`#${id}`} className="heading-anchor" aria-label="Link to this section">
      #
    </a>
  );
}

// rehype-slug gives every heading an id; one without (raw JSX) gets no mark.
export function H2({ children, ...props }: ComponentProps<"h2">) {
  return (
    <h2 {...props}>
      {children}
      {props.id && <AnchorMark id={props.id} />}
    </h2>
  );
}

export function H3({ children, ...props }: ComponentProps<"h3">) {
  return (
    <h3 {...props}>
      {children}
      {props.id && <AnchorMark id={props.id} />}
    </h3>
  );
}
