import { M } from "../M";
import { ACCENT, SUPPORT, labelMuted } from "../palette";

/**
 * Reference component figure: recreation of the word2vec one-training-step
 * diagram (after Voita, NLP Course For You — redrawn, not copied). Shows the
 * house idiom: HTML/flex layout for text, KaTeX for math, SVG only for pure
 * graphics (matrices + arrow fan), colors bound to semantic roles.
 */

const VCAT = String.raw`\textcolor{${ACCENT}}{v_{\text{cat}}}`;
/** Subscript is raw TeX: pass `\text{cute}` for words, `w_1` for symbols. */
const U = (sub: string) => String.raw`\textcolor{${SUPPORT}}{u_{${sub}}}`;
const DOT = (sub: string) => String.raw`${U(sub)}^{\top}${VCAT}`;

function Step({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: "50%",
        border: `1.5px solid ${ACCENT}`,
        color: ACCENT,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {n}
    </span>
  );
}

function DotRow({ word, boxed = false }: { word: string; boxed?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          padding: "1px 6px",
          border: boxed ? `1.3px solid ${SUPPORT}` : "1.3px solid transparent",
          borderRadius: 4,
        }}
      >
        <M tex={DOT(word)} />
      </span>
      <span style={{ color: ACCENT, opacity: 0.8 }}>⟶</span>
      <M tex={String.raw`\exp(${DOT(word)})`} size={12} />
    </div>
  );
}

export default function W2vOneStep() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14, maxWidth: 760 }}>
      {/* main flow: one aligned grid — headers row, then content row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          columnGap: 26,
          rowGap: 8,
          alignItems: "start",
          justifyContent: "start",
        }}
      >
        <div style={{ fontWeight: 600 }}>
          1. dot product of <M tex={VCAT} /> with <b>every</b> <M tex={String.raw`\textcolor{${SUPPORT}}{u}`} />
        </div>
        <div style={{ fontWeight: 600 }}>2. exponentiate</div>
        <div style={{ fontWeight: 600 }}>3. sum over V</div>

        {/* matrices + fan (pure graphics: SVG) */}
        <div>
          <svg viewBox="0 0 264 170" width="240" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect
                key={`v${i}`}
                x="30"
                y={8 + i * 17}
                width="78"
                height="17"
                fill={i === 4 ? ACCENT : "none"}
                opacity={i === 4 ? 0.85 : 1}
                stroke="currentColor"
                strokeOpacity="0.35"
              />
            ))}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <rect
                key={`u${i}`}
                x="150"
                y={8 + i * 17}
                width="78"
                height="17"
                fill={i === 2 ? SUPPORT : "none"}
                opacity={i === 2 ? 0.75 : 1}
                stroke="currentColor"
                strokeOpacity="0.35"
              />
            ))}
            <text x="26" y="88" textAnchor="end" fontSize="12" fontWeight="600" fill={ACCENT}>
              cat
            </text>
            <text x="152" y="52" fontSize="12" fontWeight="600" fill={SUPPORT} opacity="0.9">
              {""}
            </text>
            <text x="232" y="52" textAnchor="start" fontSize="12" fontWeight="600" fill={SUPPORT}>
              cute
            </text>
            {[16, 50, 84, 118, 152].map((y) => (
              <path
                key={y}
                d={`M110 84 L 148 ${y}`}
                stroke={ACCENT}
                strokeWidth="1.2"
                fill="none"
                opacity="0.8"
              />
            ))}
            <text x="69" y="166" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
              v
            </text>
            <text x="189" y="166" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.55" fontStyle="italic">
              u
            </text>
          </svg>
        </div>

        {/* dot products → exp */}
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <DotRow word={"w_1"} />
            <DotRow word={"w_2"} />
            <div style={{ ...labelMuted, paddingLeft: 24 }}>⋮</div>
            <DotRow word={String.raw`\text{cute}`} boxed />
            <div style={{ ...labelMuted, paddingLeft: 24 }}>⋮</div>
            <DotRow word={"w_n"} />
          </div>
          <div style={{ marginTop: 10, paddingLeft: 24 }}>
            <Step n={1} />
          </div>
        </div>

        {/* sum */}
        <div>
          <div
            style={{
              border: `1.5px solid ${ACCENT}`,
              borderRadius: 6,
              padding: "10px 16px",
              display: "inline-block",
            }}
          >
            <M tex={String.raw`\sum_{w \in V} \exp\!\big(${DOT("w")}\big)`} />
          </div>
          <div style={{ marginTop: 10, textAlign: "center" }}>
            <Step n={2} />
          </div>
        </div>
      </div>

      {/* loss + update: same aligned-grid treatment */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto",
          columnGap: 48,
          rowGap: 4,
          alignItems: "start",
          justifyContent: "start",
          marginTop: 20,
        }}
      >
        <div style={{ fontWeight: 600 }}>4. loss for this one step</div>
        <div style={{ fontWeight: 600 }}>5. gradient step</div>
        <div>
          <M
            display
            tex={String.raw`J_{t,j}(\theta) \;=\; -\underbrace{${DOT(String.raw`\text{cute}`)}}_{\textcolor{${ACCENT}}{(1)}} \;+\; \log \underbrace{\sum_{w \in V} \exp\!\big(${DOT("w")}\big)}_{\textcolor{${ACCENT}}{(2)}}`}
          />
        </div>
        <div>
          <M display tex={String.raw`${VCAT} \leftarrow ${VCAT} - \alpha\,\frac{\partial J_{t,j}(\theta)}{\partial ${VCAT}}`} />
          <M display tex={String.raw`${U("w")} \leftarrow ${U("w")} - \alpha\,\frac{\partial J_{t,j}(\theta)}{\partial ${U("w")}} \quad \forall\, w \in V`} />
        </div>
      </div>

      <div style={{ ...labelMuted, marginTop: 12 }}>
        one training step: pull <M tex={VCAT} size={12} /> toward <M tex={U(String.raw`\text{cute}`)} size={12} />, push it away from
        every other <M tex={String.raw`\textcolor{${SUPPORT}}{u}`} size={12} />
      </div>
    </div>
  );
}
