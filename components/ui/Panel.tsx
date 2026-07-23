import type { ReactNode } from "react";

/** Container for an interactive demo or widget. */
export function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="not-prose rounded-md border border-line bg-panel p-4">
      {children}
    </div>
  );
}
