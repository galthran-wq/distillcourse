import type { ReactNode } from "react";

/**
 * Textbook environments. Numbering is done with CSS counters (see
 * globals.css): each environment class increments its own counter and the
 * label ("Definition 2", "Exercise 1", …) is injected via ::before on
 * .env-head. Optional `title` renders in parentheses after the label.
 */

function Env({
  kind,
  title,
  children,
}: {
  kind: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className={`env env-${kind}`}>
      <p className="env-head">{title !== undefined && <> ({title})</>}</p>
      <div className="env-body">{children}</div>
    </section>
  );
}

export function Definition(props: { title?: string; children: ReactNode }) {
  return <Env kind="definition" {...props} />;
}

export function Theorem(props: { title?: string; children: ReactNode }) {
  return <Env kind="theorem" {...props} />;
}

export function Example(props: { title?: string; children: ReactNode }) {
  return <Env kind="example" {...props} />;
}

export function Remark(props: { title?: string; children: ReactNode }) {
  return <Env kind="remark" {...props} />;
}

export function Proof({ children }: { children: ReactNode }) {
  // Collapsed by default — the statement matters to every reader, the proof
  // only to some.
  return (
    <details className="env env-proof">
      <summary>Proof</summary>
      <div className="env-body">{children}</div>
    </details>
  );
}

export function Exercise({ children }: { children: ReactNode }) {
  return (
    <section className="env env-exercise">
      <p className="env-head" />
      <div className="env-body">{children}</div>
    </section>
  );
}

export function Solution({ children }: { children: ReactNode }) {
  return (
    <details className="solution">
      <summary>Solution</summary>
      <div className="solution-body">{children}</div>
    </details>
  );
}

export function References({
  children,
  credits,
}: {
  children: ReactNode;
  /**
   * Provenance of the lesson's sourced images, injected by the page from
   * figures/credits.yaml. It belongs here rather than under each figure:
   * a three-line licence note beside a plot is noise, but a citation is
   * exactly what this section is for.
   */
  credits?: ReactNode;
}) {
  return (
    <section className="references mt-12 border-t border-line pt-5">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-faint">
        References
      </p>
      <div className="references-body">{children}</div>
      {credits}
    </section>
  );
}

/** Course-wide color roles (voita-playbook): rose = key takeaway. */
export function KeyFact({ children }: { children: ReactNode }) {
  return (
    <section className="callout callout-keyfact">
      <p className="callout-label">Key fact</p>
      <div className="env-body">{children}</div>
    </section>
  );
}

/** Green = something the reader does right now (compute, try, check). */
export function Task({ children }: { children: ReactNode }) {
  return (
    <section className="callout callout-task">
      <p className="callout-label">Task</p>
      <div className="env-body">{children}</div>
    </section>
  );
}

export function Aside({ children }: { children: ReactNode }) {
  return (
    <details className="aside my-8 rounded border border-dashed border-line px-5 py-3">
      <summary className="cursor-pointer font-mono text-[12px] text-faint">
        Aside
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
