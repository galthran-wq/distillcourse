import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CourseSpine — the capstone map for the compression-is-prediction lesson.
 *
 * One left-to-right spine of five rounded nodes joined by plain rightward
 * arrows, each a step in the single pipeline the whole course builds:
 *   (1) entropy sets the floor, (2) codes spend the Kraft budget, (3) KL
 *   prices the mismatch, (4) cross-entropy is the training loss, (5)
 *   compression cashes it out as a file size.
 *
 * Color roles: amber (ACCENT) = the destination node (compression, the
 * receipt); blue (SUPPORT) = the formula accents on the four upstream nodes;
 * currentColor = node frames, role text, arrows, and the gloss line.
 *
 * One idea: the course is one pipeline that ends in a file size.
 */

type Node = {
  tex: string;
  concept: string;
  role: string; // the "— the ..." tail
  lesson: string;
  dest?: boolean;
};

const NODES: Node[] = [
  {
    tex: String.raw`H`,
    concept: "entropy",
    role: "the floor",
    lesson: "surprisal, entropy lessons",
  },
  {
    tex: String.raw`\sum 2^{-\ell_i} \le 1`,
    concept: "codes",
    role: "spend the budget",
    lesson: "prefix-codes, kraft-inequality",
  },
  {
    tex: String.raw`D(p\,\|\,q)`,
    concept: "mismatch",
    role: "the extra bits",
    lesson: "kl-divergence",
  },
  {
    tex: String.raw`H(p,q) = H + D`,
    concept: "cross-entropy",
    role: "the training loss",
    lesson: "cross-entropy-loss",
  },
  {
    tex: String.raw`\text{len} \le -\log_2 q + 2`,
    concept: "compression",
    role: "the receipt",
    lesson: "this lesson",
    dest: true,
  },
];

function Arrow() {
  return (
    <svg
      width="18"
      height="10"
      viewBox="0 0 18 10"
      aria-hidden="true"
      style={{ flex: "none", opacity: 0.6, alignSelf: "flex-start", marginTop: 24 }}
    >
      <line x1="0" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 5 l-7 -3.4 l0 6.8 Z" fill="currentColor" />
    </svg>
  );
}

function NodeCard({ node }: { node: Node }) {
  const hue = node.dest ? ACCENT : SUPPORT;
  return (
    <div
      style={{
        flex: "none",
        width: 132,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 7,
        textAlign: "center",
        border: node.dest ? `1.8px solid ${ACCENT}` : "1.4px solid currentColor",
        borderRadius: 12,
        padding: "12px 7px 10px",
        background: node.dest ? "rgba(226,144,58,0.08)" : "transparent",
      }}
    >
      {/* formula headline */}
      <div
        style={{
          minHeight: 26,
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={String.raw`\textcolor{${hue}}{${node.tex}}`} size={13} />
      </div>

      {/* role line: concept — tail */}
      <div style={{ lineHeight: 1.3, fontSize: 12 }}>
        <span style={{ fontWeight: 600, color: node.dest ? ACCENT : undefined }}>
          {node.concept}
        </span>
        <span style={{ opacity: 0.85 }}> — {node.role}</span>
      </div>

      {/* muted lesson label */}
      <div style={{ fontSize: 11, opacity: 0.5, lineHeight: 1.25 }}>
        {node.lesson}
      </div>
    </div>
  );
}

export default function CourseSpine() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        maxWidth: 920,
        padding: "4px 0",
      }}
    >
      {/* the spine */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {NODES.map((node, i) => (
          <div key={i} style={{ display: "flex", alignItems: "stretch" }}>
            {i > 0 && <Arrow />}
            <NodeCard node={node} />
          </div>
        ))}
      </div>

      {/* one gloss line beneath the spine */}
      <div
        style={{
          fontSize: 13,
          opacity: 0.7,
          textAlign: "center",
          fontStyle: "italic",
          lineHeight: 1.4,
          maxWidth: 720,
        }}
      >
        entropy floors it, Kraft prices it, KL charges the mismatch, training
        minimizes it, arithmetic coding cashes it
      </div>
    </div>
  );
}
