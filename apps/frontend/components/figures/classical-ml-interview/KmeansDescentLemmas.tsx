import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * KmeansDescentLemmas — the two k-means half-steps as coordinate descent on
 * ONE objective. Single static <Figure>: two equal panels above a full-width
 * footer that carries the shared objective J(r, μ).
 *
 * One idea: each half-step exactly minimizes J over its own colored block of
 * variables, so J never increases.
 *   amber = assignment block r  (the subject of the LEFT panel)
 *   blue  = center block μ      (the subject of the RIGHT panel)
 * No other hues. The footer's J binds r → amber and μ → blue so the reader
 * sees both panels landing on the same function.
 *
 * Left panel instantiates "assignment minimizes J over r" with point B of the
 * worked iteration-2 table (1.25 vs 11.69). Right panel is the three-line
 * gradient derivation for "the mean minimizes total squared distance".
 */

const R = ACCENT; // assignment block r
const MU = SUPPORT; // center block μ

const cr = (t: string) => String.raw`\textcolor{${R}}{${t}}`;
const cmu = (t: string) => String.raw`\textcolor{${MU}}{${t}}`;

const hairline = "1px solid rgba(128,128,128,0.35)";

// --- left panel: assignment step ------------------------------------------

const CHOSEN = String.raw`\lVert x_B - \mu_1\rVert^2 = 1.25`;
const OTHER = String.raw`\lVert x_B - \mu_2\rVert^2 = 11.69`;
const RULE = String.raw`${cr("r_{nj}")} = 1 \iff j = \arg\min_{j'}\lVert x_n - \mu_{j'}\rVert^2`;

// --- right panel: update step ---------------------------------------------

const GRAD = String.raw`\nabla_{\mu_j}\!\sum_n ${cr("r_{nj}")}\lVert x_n - ${cmu("\\mu_j")}\rVert^2 = 2\sum_n ${cr("r_{nj}")}\bigl(${cmu("\\mu_j")} - x_n\bigr)`;
const MEAN = String.raw`${cmu("\\mu_j")} = \frac{\sum_n ${cr("r_{nj}")}\, x_n}{\sum_n ${cr("r_{nj}")}}`;

// --- footer: the shared objective -----------------------------------------

const OBJECTIVE = String.raw`J(${cr("r")}, ${cmu("\\mu")}) = \sum_n \sum_j ${cr("r_{nj}")}\,\lVert x_n - ${cmu("\\mu_j")}\rVert^2`;

function PanelHead({ text }: { text: string }) {
  return (
    <div
      style={{
        fontWeight: 600,
        fontSize: 13.5,
        marginBottom: 16,
      }}
    >
      {text.split("$").map((chunk, i) =>
        i % 2 === 1 ? (
          <M key={i} tex={chunk} size={13.5} />
        ) : (
          <span key={i}>{chunk}</span>
        )
      )}
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        color,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export default function KmeansDescentLemmas() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        width: 720,
        boxSizing: "border-box",
        border: hairline,
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* two equal panels side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* LEFT: assignment step */}
        <div style={{ padding: "18px 22px 22px", borderRight: hairline }}>
          <PanelHead text="assignment step ($\mu$ fixed)" />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            {/* chosen term: amber, boxed */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  display: "inline-block",
                  border: `1.8px solid ${R}`,
                  borderRadius: 8,
                  padding: "8px 14px",
                }}
              >
                <M tex={String.raw`\textcolor{${R}}{${CHOSEN}}`} size={16} />
              </span>
              <Tag color={R}>chosen</Tag>
            </div>

            <div style={{ opacity: 0.5, fontSize: 13, paddingLeft: 6 }}>vs</div>

            {/* alternative term: muted */}
            <div style={{ opacity: 0.5, paddingLeft: 4 }}>
              <M tex={OTHER} size={16} />
            </div>
          </div>

          {/* the rule */}
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: hairline,
            }}
          >
            <M tex={RULE} display size={14} />
            <div
              style={{
                marginTop: 10,
                fontSize: 12.5,
                fontStyle: "italic",
                opacity: 0.65,
                lineHeight: 1.45,
              }}
            >
              each point takes its smallest available term of J
            </div>
          </div>
        </div>

        {/* RIGHT: update step */}
        <div style={{ padding: "18px 22px 22px" }}>
          <PanelHead text="update step ($r$ fixed)" />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* line 1: the gradient */}
            <M tex={GRAD} display size={14} />

            {/* line 2: set to 0 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: 0.7,
                fontSize: 12.5,
                fontStyle: "italic",
              }}
            >
              <span style={{ opacity: 0.5 }}>↓</span>
              set to <M tex={"0"} size={13} />
            </div>

            {/* line 3: the mean, boxed blue */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "inline-block",
                  border: `1.8px solid ${MU}`,
                  borderRadius: 8,
                  padding: "8px 16px",
                }}
              >
                <M tex={MEAN} size={17} />
              </span>
              <Tag color={MU}>the cluster mean</Tag>
            </div>
          </div>
        </div>
      </div>

      {/* full-width footer: the shared objective */}
      <div
        style={{
          borderTop: hairline,
          background: "rgba(128,128,128,0.06)",
          padding: "16px 22px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          textAlign: "center",
        }}
      >
        <M tex={OBJECTIVE} display size={16} />
        <div
          style={{
            fontSize: 12.5,
            opacity: 0.72,
            lineHeight: 1.5,
            maxWidth: 620,
          }}
        >
          each half-step exactly minimizes{" "}
          <M tex={"J"} size={12.5} /> over its own colored block, so{" "}
          <M tex={"J"} size={12.5} /> never increases
        </div>
      </div>
    </div>
  );
}
