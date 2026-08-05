/**
 * Figure palette + shared inline-style constants. Component figures must NOT
 * use Tailwind classes (they are rendered standalone by scripts/render-figure.ts
 * for visual verification) — style with inline styles and these constants.
 * Text defaults to currentColor so figures follow the page theme.
 */
export const ACCENT = "#e2903a"; // the figure's subject
export const SUPPORT = "#4c8dd6"; // the contrast series / second role
export const OK = "#5aa46a"; // correctness/accept states (rarely)

export const MUTED_OPACITY = 0.55;

export const label: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 13,
};

export const labelMuted: React.CSSProperties = {
  ...label,
  opacity: MUTED_OPACITY,
};
