// The class lists the site's chrome shares, so restyling one is a single edit
// rather than a hunt through the widgets that use it. No "use client" here on
// purpose: server components call `buttonClass` too, and an export of a client
// module is an opaque reference on the server, not a function.

/**
 * `--motion-base` and `--motion-fast` in milliseconds. A timer cannot read a
 * CSS variable, and something leaving the page has to stay mounted for exactly
 * as long as its animation lasts — see `useExitDelay`. These two numbers are
 * the tokens in globals.css and have to be retuned with them.
 */
export const MOTION_BASE_MS = 200;
export const MOTION_FAST_MS = 150;

/**
 * What makes a field read as one: a fill a step off whatever it sits on. The
 * fill is `--field` rather than a colour, so a surface that is itself
 * panel-filled can flip it — see globals.css. The radius, and the line the
 * accent takes while the field is in use, are left to the two below: two
 * utilities for one property resolve by stylesheet order rather than by which
 * was written last, and the two states differ.
 */
const FIELD_SURFACE =
  "border border-line bg-(--field) transition-colors duration-(--motion-fast)";

/** What typed text looks like, wherever it is typed. */
const FIELD_TEXT = "text-sm text-ink placeholder:text-faint";

/**
 * Every bare text field: input, textarea, and the native time picker. The
 * accent takes its line while it is focused; `hover:` and `focus:` are two
 * different pseudo-classes at the same specificity, and tailwind emits `focus:`
 * after `hover:`, so the accent line wins on a hovered focused field. Where in
 * this string the two are written makes no difference to that.
 */
export const FIELD_CLASS = `${FIELD_SURFACE} ${FIELD_TEXT} hover:border-faint block w-full rounded-sm px-3 py-2 focus:border-accent aria-invalid:border-accent`;

/**
 * A field that is a box around controls rather than a control itself — the
 * tutor's composer, whose send button sits inside the same shape as its
 * textarea. Everything about the state is on the box: the accent takes its
 * line while anything inside it has focus, and the hover line is explicitly
 * not-focused (`focus-within:` and `hover:` are the same specificity, so
 * without that the hover line would win over the accent one for as long as the
 * pointer stayed on the field). The ring is the box's too, which is why
 * `field-box` is in here: it is the site's one ring, stated once in globals.css
 * beside the rule for everything else, and the control inside gives its own up
 * with `FIELD_BOX_INPUT_CLASS`. The radius is the surface one: this holds
 * controls rather than being one.
 */
export const FIELD_BOX_CLASS = `${FIELD_SURFACE} field-box flex items-end gap-1.5 rounded-md p-1.5 not-focus-within:hover:border-faint focus-within:border-accent`;

/**
 * The control inside such a box — a textarea or an input. It draws nothing: the
 * fill, the line and the ring are the box's, and the last of those only works
 * if the control gives its own up. Geometry — size, flex, how it scrolls, its
 * padding — is the caller's, as everywhere else in this file.
 */
export const FIELD_BOX_INPUT_CLASS = `${FIELD_TEXT} bg-transparent focus:outline-none`;

/**
 * The text above a field. It carries the gap down to the field, so FIELD_CLASS
 * is pure look and no consumer has to re-add spacing around it.
 */
export const FIELD_LABEL_CLASS = "mb-1 block text-soft";

/** Mono micro-caps: section headings, group labels. */
export const LABEL_CLASS = "font-mono text-[11px] uppercase tracking-wider text-faint";

/**
 * The surface anything that opens over the page is drawn on — a menu, the
 * preview of a referenced passage. It opens out of the corner it hangs from,
 * which is the caller's to name along with where it hangs; closing it is
 * instant, since something that lingers is still in the way of what was
 * chosen.
 */
export const POPOVER_CLASS =
  "absolute z-50 rounded-md border border-line bg-panel shadow-popover transition-[opacity,scale] duration-(--motion-fast) starting:scale-95 starting:opacity-0";

/**
 * A panel hung under its trigger — the account menu, the chat menu. The caller
 * adds its own width and, where the list can run long, its own scrolling.
 */
export const MENU_CLASS = `${POPOVER_CLASS} right-0 top-full mt-1.5 origin-top-right p-1.5`;

// Everything about such a row except how it lays its contents out. The display
// is left off because it is the one thing a caller replaces, and there is no
// tailwind-merge here: a second display utility in the same class list resolves
// by stylesheet order rather than by the order it is written.
const MENU_ROW =
  "w-full rounded-sm px-2.5 py-2 text-left text-[13px] transition-colors duration-(--motion-fast) hover:bg-line/60";

/** One row of such a panel, whether that row is a link or a button. */
export const MENU_ITEM_CLASS = `block ${MENU_ROW}`;

/** The same row where it carries columns of its own — a name and a date. */
export const MENU_ROW_CLASS = `flex ${MENU_ROW}`;

/**
 * A chip: a small outlined control that names a thing rather than performing
 * an action — the passage a selection offers to the tutor, and the same
 * passage again beside the message it was sent with. Not a Button, and it
 * says so here rather than in each place one is drawn. Geometry is the
 * caller's: one floats at the selection, the others sit in a row.
 */
export const CHIP_CLASS =
  "flex items-center rounded-sm border border-line bg-paper text-[12px] text-soft transition-colors duration-(--motion-fast) hover:border-faint hover:bg-panel hover:text-ink";

export type ButtonVariant = "solid" | "outline" | "ghost";
/**
 * `pill` is a labelled control that floats over the page rather than sitting in
 * a row of others; `icon` is the circle an icon-only control gets.
 */
export type ButtonSize = "sm" | "md" | "pill" | "icon";

// The press is a scale rather than a colour: it reads the same on all three
// variants, including the ghost one that has no surface to darken.
const BASE =
  "inline-flex items-center justify-center gap-2 border font-medium transition-[color,background-color,border-color,box-shadow,scale] duration-(--motion-fast) active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

// The radius lives with the size rather than in BASE because the size decides
// the shape: a control in a row takes the control radius, one that floats or
// carries no label is round.
const SIZE: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-sm px-2.5 text-[13px]",
  md: "min-h-11 rounded-sm px-3.5 text-sm",
  pill: "min-h-11 rounded-full px-5 text-sm",
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
 * links that have to look like one, which cannot be a `<button>`. Variant and
 * size are required: a default here would be a second opinion about what a
 * plain button looks like, next to `ui/Button`'s.
 */
export function buttonClass(
  variant: ButtonVariant,
  size: ButtonSize,
  pressed = false,
): string {
  return `${BASE} ${SIZE[size]} ${pressed ? PRESSED : VARIANT[variant]}`;
}
