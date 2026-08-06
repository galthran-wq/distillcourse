// The widget's glyphs, drawn the way the lesson bookmark is — a 16-unit box,
// currentColor, no fill — so a Button's variant colours them and no icon
// package is added for six shapes.
import type { PropsWithChildren } from "react";

interface IconProps {
  className?: string;
}

function Glyph({ className = "size-4", children }: PropsWithChildren<IconProps>) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M2 3.5h12v7H6l-3.5 3v-3H2z" />
    </Glyph>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M4 4l8 8M12 4l-8 8" />
    </Glyph>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M6 2.5H2.5V6M10 2.5h3.5V6M6 13.5H2.5V10M10 13.5h3.5V10" />
    </Glyph>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M2.5 6H6V2.5M13.5 6H10V2.5M2.5 10H6v3.5M13.5 10H10v3.5" />
    </Glyph>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 13V3.5M4 7.5L8 3.5l4 4" />
    </Glyph>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M8 3.5v9M3.5 8h9" />
    </Glyph>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Glyph {...props}>
      <path d="M3 8.5l3.5 3.5L13 5" />
    </Glyph>
  );
}

/** Three dots. Drawn as zero-length round strokes, so it needs no fill. */
export function MoreIcon({ className = "size-4" }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M3.5 8h.01M8 8h.01M12.5 8h.01" />
    </svg>
  );
}
