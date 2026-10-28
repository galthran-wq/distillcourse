"use client";

import { Suspense, lazy, type ComponentType } from "react";
import { demos } from "@/components/demos";

// Wrap every registered loader once at module load: lazy() defers the actual
// import until first render, and the components stay referentially stable
// across renders (never created during render).
const lazyDemos: Record<string, ComponentType<object>> = Object.fromEntries(
  Object.entries(demos).map(([name, loader]) => [name, lazy(loader)]),
);

interface Props {
  name: string;
  caption?: string;
}

export default function DemoHost({ name, caption }: Props) {
  const Demo = lazyDemos[name] ?? null;

  return (
    // data-demo is what telemetry counts: which demo the reader touched.
    <figure className="my-10" data-demo={name}>
      {Demo === null ? (
        <div className="rounded-md border border-dashed border-line px-5 py-8 text-center font-mono text-sm text-faint">
          demo “{name}” not built yet — /demo-builder will fill this in
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="rounded-md border border-line px-5 py-8 text-center text-sm text-faint">
              loading demo…
            </div>
          }
        >
          <Demo />
        </Suspense>
      )}
      {caption !== undefined && (
        <figcaption className="mt-2">{caption}</figcaption>
      )}
    </figure>
  );
}
