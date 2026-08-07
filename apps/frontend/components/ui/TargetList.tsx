import type { ReactNode } from "react";

export interface Target {
  /** What the reader has to achieve, phrased as an instruction. */
  label: ReactNode;
  /** Live evidence for/against: the numbers the check is reading. */
  detail?: ReactNode;
  /** True while the current state satisfies the target. */
  met: boolean;
  /** True once it has been satisfied at any point this session. */
  latched?: boolean;
}

/**
 * Checklist of targets a demo asks the reader to hit (pedagogy D1: a demo
 * earns its place when the reader can DO something and see that they did).
 * Live state + latched state are distinguished, so a reader who moves on
 * keeps credit for a target already met.
 */
export function TargetList({
  title = "Targets",
  targets,
}: {
  title?: string;
  targets: Target[];
}) {
  return (
    <div className="mb-3 rounded border border-line p-2">
      <p className="pb-1 text-xs font-medium uppercase tracking-wide text-faint">
        {title}
      </p>
      <ol className="space-y-1 text-sm" aria-live="polite">
        {targets.map((t, i) => {
          const shown = t.met || t.latched;
          return (
            <li key={i} className="flex gap-2">
              <span
                aria-hidden
                className={`font-mono ${t.met ? "text-accent" : shown ? "text-faint" : "text-faint"}`}
              >
                {shown ? "✓" : "○"}
              </span>
              <span className={t.met ? "text-ink" : "text-soft"}>
                <span className={t.met ? "font-medium" : ""}>{t.label}</span>
                <span className="sr-only">
                  {t.met ? " — met now" : t.latched ? " — met earlier" : " — not met yet"}
                </span>
                {t.detail !== undefined && (
                  <span className="block font-mono text-xs text-faint">{t.detail}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
