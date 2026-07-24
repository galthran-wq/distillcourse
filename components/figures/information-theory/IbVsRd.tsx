import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * IbVsRd — the information bottleneck IS rate-distortion with the hand-picked
 * distortion measure replaced by a data-derived relevance term (playbook rule
 * 8: two near-identical objective panels joined by a bold arrow, the single
 * swapped term highlighted, the payoff stated underneath).
 *
 *   rate-distortion:        min_{p(x̂|x)} I(X;X̂)    s.t.  E[ d(x,x̂) ] ≤ D
 *   information bottleneck:  min_{p(t|x)}  I(X;T)   −  β I(T;Y)
 *
 * Each panel is two lines: the shared skeleton  min_{p(·|x)} I(X;·)  on top
 * (currentColor), the traded-off second term below. Only that second term and
 * its tag change:
 *   blue  d(x,x̂)  — the OLD hand-picked distortion (a designer chooses it)
 *   amber I(T;Y)  — the NEW data-derived relevance (read off from p(x,y))
 *
 * One idea: the bottleneck is rate-distortion with the distortion measure
 * replaced by relevant information. Amber = the new data-derived term (the
 * subject); blue = the retired hand-picked term; currentColor = shared
 * structure. Inspiration: Tishby, Pereira & Bialek 1999, §1–§3.1 (no figure in
 * the source; this comparison is drawn here for the first time).
 */

const MSIZE = 20;

/** A highlighted formula term with a tag hung directly beneath it. */
function HiTerm({
  tex,
  color,
  tag,
}: {
  tex: string;
  color: string;
  tag: React.ReactNode;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      <M tex={String.raw`\textcolor{${color}}{${tex}}`} size={MSIZE} />
      {/* short vertical tick tying the tag to the term */}
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          width: 0,
          height: 8,
          borderLeft: `1.4px solid ${color}`,
          opacity: 0.7,
        }}
      />
      <span
        style={{
          position: "absolute",
          top: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginTop: 10,
          width: 150,
          textAlign: "center",
          color,
          fontSize: 11,
          fontStyle: "italic",
          lineHeight: 1.3,
          fontWeight: 600,
        }}
      >
        {tag}
      </span>
    </span>
  );
}

function Panel({
  header,
  line1,
  line2,
}: {
  header: string;
  line1: string;
  line2: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        flex: "none",
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: 0.2 }}>{header}</div>
      <M tex={line1} size={MSIZE} />
      {/* second line: baseline-aligned chunks, tag hangs below the swapped term */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          whiteSpace: "nowrap",
          paddingBottom: 46,
          marginTop: 2,
        }}
      >
        {line2}
      </div>
    </div>
  );
}

/** the bold connector, pointing RD -> IB, with its instruction above it. */
function Bridge() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
        flex: "none",
        alignSelf: "center",
        padding: "0 6px",
        marginTop: 26,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textAlign: "center",
          lineHeight: 1.3,
          maxWidth: 96,
        }}
      >
        replace the
        <br />
        hand-picked term
      </div>
      <svg viewBox="0 0 64 16" width="64" height="16" aria-hidden="true">
        <defs>
          <marker id="ibvrd-head" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
            <path d="M1 1 L7.5 4.5 L1 8" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </marker>
        </defs>
        <line
          x1="2"
          y1="8"
          x2="52"
          y2="8"
          stroke="currentColor"
          strokeWidth="3"
          markerEnd="url(#ibvrd-head)"
        />
      </svg>
    </div>
  );
}

export default function IbVsRd() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 780,
        padding: "0 28px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {/* ── LEFT: rate-distortion ── */}
        <Panel
          header="rate-distortion"
          line1={String.raw`\min_{p(\hat x\mid x)}\; I(X;\hat X)`}
          line2={
            <>
              <M tex={String.raw`\text{s.t.}\;\; \mathbb{E}\big[`} size={MSIZE} />
              <HiTerm tex={String.raw`d(x,\hat x)`} color={SUPPORT} tag="hand-picked by a designer" />
              <M tex={String.raw`\big]\le D`} size={MSIZE} />
            </>
          }
        />

        <Bridge />

        {/* ── RIGHT: information bottleneck ── */}
        <Panel
          header="information bottleneck"
          line1={String.raw`\min_{p(t\mid x)}\; I(X;T)`}
          line2={
            <>
              <M tex={String.raw`-\;\beta\,`} size={MSIZE} />
              <HiTerm
                tex={String.raw`I(T;Y)`}
                color={ACCENT}
                tag={
                  <>
                    derived from <M tex={String.raw`p(x,y)`} size={11} />:
                    <br />
                    bits about the target
                  </>
                }
              />
            </>
          }
        />
      </div>

      {/* ── payoff, centered underneath both panels ── */}
      <div style={{ fontSize: 13, fontWeight: 600, textAlign: "center" }}>
        relevance without a designed distortion
      </div>
    </div>
  );
}
