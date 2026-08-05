import type { ReactNode } from "react";

/** Live numeric/text readout under a control (announced to screen readers). */
export function Readout({ children }: { children: ReactNode }) {
  return (
    <p className="pt-1 text-sm" aria-live="polite">
      {children}
    </p>
  );
}
