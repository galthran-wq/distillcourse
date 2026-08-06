// The class lists the site's chrome shares, so restyling one is a single edit
// rather than a hunt through the widgets that use it. No "use client" here on
// purpose: server components call `buttonClass` too, and an export of a client
// module is an opaque reference on the server, not a function.

/** Every text field: input, textarea, and the native time picker. */
export const FIELD_CLASS =
  "block w-full rounded-sm border border-line bg-panel px-3 py-2 text-sm text-ink transition-colors duration-(--motion-fast) placeholder:text-faint hover:border-faint focus:border-accent aria-invalid:border-accent";

/** Mono micro-caps: section headings, group labels, the name of a chat turn. */
export const LABEL_CLASS = "font-mono text-[11px] uppercase tracking-wider text-faint";

export type ButtonVariant = "solid" | "outline" | "ghost";
/** `icon` is the circle an icon-only control gets; it carries no label. */
export type ButtonSize = "sm" | "md" | "icon";

const BASE =
  "inline-flex items-center justify-center gap-2 border font-medium transition-[color,background-color,border-color,box-shadow] duration-(--motion-fast) disabled:pointer-events-none disabled:opacity-45";

// The radius lives with the size rather than in BASE because the size decides
// the shape: labelled controls take the control radius, icon-only ones a circle.
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-sm px-2.5 text-[13px]",
  md: "min-h-11 rounded-sm px-3.5 text-sm",
  icon: "size-10 shrink-0 rounded-full p-0 text-base",
};

const VARIANT: Record<ButtonVariant, string> = {
  solid: "border-accent bg-accent text-paper hover:bg-accent/90 active:bg-accent/80",
  outline: "border-line bg-paper text-ink hover:border-faint hover:bg-panel",
  ghost: "border-transparent text-soft hover:bg-panel hover:text-ink",
};

// Toggled on: the accent states the choice, so it replaces the variant rather
// than layering over it — two border-color utilities in one class list resolve
// by stylesheet order, not by the order they are written.
const PRESSED = "border-accent bg-accent/10 text-accent";

/**
 * The button look. `ui/Button` is what a button uses; this is here for the few
 * links that have to look like one, which cannot be a `<button>`.
 */
export function buttonClass(
  variant: ButtonVariant = "outline",
  size: ButtonSize = "md",
  pressed = false,
): string {
  return `${BASE} ${SIZE[size]} ${pressed ? PRESSED : VARIANT[variant]}`;
}
