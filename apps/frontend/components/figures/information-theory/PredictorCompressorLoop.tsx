import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * PredictorCompressorLoop — prediction and compression are the same map, read
 * in opposite directions. Two boxes on one horizontal axis: a predictor
 * (amber) emitting next-symbol probabilities q(x_t | x_{<t}), and a
 * compressor (blue) emitting a bitstring with codeword lengths ℓ(x). Two
 * labeled arrows join them: top, left→right, "arithmetic coding" turning
 * probabilities into a coded length (len ≤ -log₂ q(x) + 2); bottom,
 * right→left, the "Kraft reading" turning lengths back into an implied
 * predictor (q(x) ∝ 2^{-ℓ(x)}).
 *
 * Color roles: amber = the predictor box and the forward (arithmetic-coding)
 * arrow — this lesson's subject direction; blue = the compressor box and the
 * reverse (Kraft) arrow. currentColor = the boxed content and the gloss.
 *
 * One idea: one object, two interfaces — the same conditional map read either
 * as a probability model or as a code. After Delétang et al., "Language
 * Modeling Is Compression" (idea only, redrawn in house style).
 */

const GAP_W = 232; // width of the central arrow column

/** Horizontal arrow spanning the gap; "right" points at the compressor. */
function Arrow({ dir, color }: { dir: "left" | "right"; color: string }) {
  const H = 20;
  const Y = H / 2;
  return (
    <svg viewBox={`0 0 ${GAP_W} ${H}`} width={GAP_W} height={H} aria-hidden="true" style={{ display: "block" }}>
      {dir === "right" ? (
        <>
          <line x1={2} y1={Y} x2={GAP_W - 10} y2={Y} stroke={color} strokeWidth="1.8" strokeOpacity="0.9" />
          <path d={`M ${GAP_W - 4} ${Y} l -11 -5 l 0 10 Z`} fill={color} fillOpacity="0.9" />
        </>
      ) : (
        <>
          <line x1={GAP_W - 2} y1={Y} x2={10} y2={Y} stroke={color} strokeWidth="1.8" strokeOpacity="0.9" />
          <path d={`M 4 ${Y} l 11 -5 l 0 10 Z`} fill={color} fillOpacity="0.9" />
        </>
      )}
    </svg>
  );
}

function Box({
  color,
  header,
  body,
  sub,
}: {
  color: string;
  header: string;
  body: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div
      style={{
        flex: "0 0 auto",
        width: 176,
        minHeight: 116,
        border: `1.7px solid ${color}`,
        borderRadius: 12,
        padding: "14px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <div style={{ color, fontWeight: 600, fontSize: 13.5 }}>{header}</div>
      {body}
      <div style={{ opacity: 0.6, fontSize: 11.5, lineHeight: 1.35 }}>{sub}</div>
    </div>
  );
}

export default function PredictorCompressorLoop() {
  const amber = (x: string) => String.raw`\textcolor{${ACCENT}}{${x}}`;
  const blue = (x: string) => String.raw`\textcolor{${SUPPORT}}{${x}}`;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        maxWidth: 680,
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "center" }}>
        <Box
          color={ACCENT}
          header="predictor"
          body={<M tex={String.raw`q(x_t \mid x_{<t})`} size={16} />}
          sub="next-symbol probabilities"
        />

        {/* central column: two labeled arrows, opposite directions */}
        <div
          style={{
            flex: "0 0 auto",
            width: GAP_W,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            padding: "0 6px",
          }}
        >
          {/* forward: arithmetic coding (amber, → compressor) */}
          <div style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
            <span style={{ color: ACCENT, fontWeight: 600 }}>arithmetic coding</span>
          </div>
          <M tex={String.raw`\text{len} \le -\log_2 ${amber(String.raw`q(x)`)} + 2`} size={12} />
          <Arrow dir="right" color={ACCENT} />

          <div style={{ height: 6 }} />

          {/* reverse: the Kraft reading (blue, → predictor) */}
          <Arrow dir="left" color={SUPPORT} />
          <M tex={String.raw`${blue(String.raw`q(x)`)} \propto 2^{-\ell(x)}`} size={12} />
          <div style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>
            <span style={{ color: SUPPORT, fontWeight: 600 }}>the Kraft reading</span>
          </div>
        </div>

        <Box
          color={SUPPORT}
          header="compressor"
          body={
            <span
              style={{
                fontFamily: "ui-monospace, monospace",
                fontSize: 15,
                letterSpacing: 1,
                color: SUPPORT,
              }}
            >
              0100111…
            </span>
          }
          sub={
            <>
              codeword lengths <M tex={String.raw`\ell(x)`} size={11.5} />
            </>
          }
        />
      </div>

      {/* one-line takeaway centered beneath both boxes */}
      <div style={{ opacity: 0.6, fontSize: 12.5, fontStyle: "italic" }}>one object, two interfaces</div>
    </div>
  );
}
