import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { LABEL_CLASS } from "@/components/ui/styles";
import { CONCLUSION_ANCHOR } from "@/lib/content/locator";

/**
 * Textbook environments. Numbering is done with CSS counters (see
 * globals.css): each environment class increments its own counter and the
 * label ("Definition 2", "Exercise 1", …) is injected via ::before on
 * .env-head. Optional `title` renders in parentheses after the label.
 *
 * `data-toggle` on the collapsible ones is telemetry's hook
 * (lib/telemetry/targets.ts), kept separate from the class names so that
 * restyling cannot silently stop the counting.
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

/**
 * A stated result. Authors nest its <Proof> inside it; it is lifted out and
 * set after the statement's closing rule, as a printed book does, since a
 * rule cannot stop halfway down a section in CSS. Lemma, Proposition and
 * Corollary share Theorem's counter (globals.css), as in amsthm.
 */
function Result({
  kind,
  title,
  children,
}: {
  kind: string;
  title?: string;
  children: ReactNode;
}) {
  const parts = Children.toArray(children);
  const isProof = (c: ReactNode) => isValidElement(c) && c.type === Proof;
  return (
    <>
      <Env kind={kind} title={title}>
        {parts.filter((c) => !isProof(c))}
      </Env>
      {parts.filter(isProof)}
    </>
  );
}

export function Definition(props: { title?: string; children: ReactNode }) {
  return <Env kind="definition" {...props} />;
}

export function Theorem(props: { title?: string; children: ReactNode }) {
  return <Result kind="theorem" {...props} />;
}

export function Lemma(props: { title?: string; children: ReactNode }) {
  return <Result kind="lemma" {...props} />;
}

export function Proposition(props: { title?: string; children: ReactNode }) {
  return <Result kind="proposition" {...props} />;
}

export function Corollary(props: { title?: string; children: ReactNode }) {
  return <Result kind="corollary" {...props} />;
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
    <details className="env env-proof" data-toggle="proof">
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
    <details className="solution" data-toggle="solution">
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
      <p className={`mb-2 ${LABEL_CLASS}`}>
        References
      </p>
      <div className="references-body">{children}</div>
      {credits}
    </section>
  );
}

/** The load-bearing fact of a section: the one environment with a fill. */
export function KeyFact({ children }: { children: ReactNode }) {
  return (
    <section className="callout callout-keyfact">
      <p className="callout-label">Key fact</p>
      <div className="env-body">{children}</div>
    </section>
  );
}

/**
 * The lesson's closing (L10c): what the reader can now do, and the problem
 * left open. It is the end of the chapter's prose rather than an aside, so it
 * is not boxed: a rule and a label are enough to make the end read as an end.
 */
export function Conclusion({ children }: { children: ReactNode }) {
  return (
    <section id={CONCLUSION_ANCHOR} className="conclusion">
      <p className="conclusion-label">Conclusion</p>
      <div className="env-body">{children}</div>
    </section>
  );
}

/** Something the reader does right now (compute, try, check). */
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
    <details
      className="aside my-8 rounded-sm border border-dashed border-line px-5 py-3"
      data-toggle="aside"
    >
      <summary className="cursor-pointer text-[0.95em] italic text-faint">
        Aside
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

/**
 * A passage quoted from a source — the evidence a reading rests on. Bilingual
 * when the children hold an <Original>: that block is lifted out and set
 * beside the translation (globals.css lays the two out side by side on a
 * wide screen, stacked on a phone); an <Original> with nothing beside it —
 * a Latin tag the prose glosses itself — stands alone. `source` is the
 * locator the reader checks the passage against — a siglum, a section, the
 * translator.
 */
export function Quote({
  source,
  children,
}: {
  source?: string;
  children: ReactNode;
}) {
  const parts = Children.toArray(children);
  const original = parts.find(
    (c) => isValidElement(c) && c.type === Original,
  ) as ReactElement<OriginalProps> | undefined;
  const translation = parts.filter((c) => c !== original);
  return (
    <figure className="quote">
      {original !== undefined && (
        <blockquote className="quote-original" lang={original.props.lang}>
          {original.props.children}
        </blockquote>
      )}
      {translation.length > 0 && (
        <blockquote className="quote-text">{translation}</blockquote>
      )}
      {source !== undefined && (
        <figcaption className={`quote-source ${LABEL_CLASS}`}>{source}</figcaption>
      )}
    </figure>
  );
}

type OriginalProps = { lang: string; children: ReactNode };

/**
 * The original-language text of a <Quote>, which renders it itself; on its
 * own it is inert. `lang` is the BCP-47 tag of that text alone, so
 * hyphenation and screen readers switch language for the original only.
 */
export function Original({ children }: OriginalProps) {
  return <>{children}</>;
}
