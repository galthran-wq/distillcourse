import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * VibVsVae — the deep variational IB loss stacked directly above the negated
 * VAE objective, term by term, so the reader sees one algebra wearing two
 * names (playbook rules 1, 7, 8: colour bound literally to a role, the shared
 * terms aligned in the same columns, the two differences called out where
 * they occur).
 *
 *   J_VIB = E[-log q(y|t)]  +  (1/β) E_x[ D(p(t|x) ‖ r(t)) ]
 *   J_VAE = E[-log q(x|t)]  +          D(p(t|x) ‖ r(t))
 *
 * The decoder/reconstruction term is amber in both rows; the KL-to-prior
 * (rate) term is blue in both. The identical core D(p(t|x) ‖ r(t)) sits in one
 * shared grid column so it lines up pixel-for-pixel between the rows, and the
 * two dotted connectors carry the only two differences: what the decoder
 * predicts (Y or x itself) and the weight on the rate term (1/β or 1).
 *
 * One idea: two names for one objective, separated by the weight and by what
 * the decoder predicts. Source of the identity: Alemi, Fischer, Dillon &
 * Murphy 2017, "Deep Variational Information Bottleneck", Appendix B.
 */

const MSIZE = 19;

/** the whole grid, column by column: lhs | decoder | + | weight | D-core | ] */
const COLS = "auto auto auto auto auto auto";

function Header({ text, top = 0 }: { text: string; top?: number }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.3,
        marginBottom: 4,
        marginTop: top,
      }}
    >
      {text}
    </div>
  );
}

/** a dotted tie between the two rows, with the difference named beside it. */
function Connector({
  color,
  label,
  height,
}: {
  color: string;
  label: React.ReactNode;
  height: number;
}) {
  return (
    <div style={{ position: "relative", height, alignSelf: "start" }}>
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 2,
          height: height - 4,
          width: 0,
          borderLeft: `1.7px dotted ${color}`,
          opacity: 0.85,
        }}
      />
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translateY(-50%)",
          marginLeft: 11,
          whiteSpace: "nowrap",
          color,
          fontSize: 11.5,
          fontWeight: 600,
          fontStyle: "italic",
          lineHeight: 1.35,
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function VibVsVae() {
  const decoder = (arg: string) =>
    String.raw`\textcolor{${ACCENT}}{\mathbb{E}[-\log q(${arg} \mid t)]}`;
  const core = String.raw`\textcolor{${SUPPORT}}{D(p(t \mid x) \,\|\, r(t))}`;

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        maxWidth: 780,
        display: "flex",
        alignItems: "flex-start",
        gap: 18,
      }}
    >
      {/* ── the two objectives, stacked and column-aligned ── */}
      <div style={{ width: 590, flex: "none" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: COLS,
            justifyContent: "start",
            alignItems: "baseline",
            columnGap: 0,
            rowGap: 0,
          }}
        >
          <Header text="deep variational IB" />

          <M tex={String.raw`J_{\text{VIB}} \;=\;`} size={MSIZE} />
          <M tex={decoder("y")} size={MSIZE} />
          <M tex={String.raw`\;+\;`} size={MSIZE} />
          <M
            tex={String.raw`\textcolor{${SUPPORT}}{\tfrac{1}{\beta}\,\mathbb{E}_x\big[\,}`}
            size={MSIZE}
          />
          <M tex={core} size={MSIZE} />
          <M tex={String.raw`\textcolor{${SUPPORT}}{\,\big]}`} size={MSIZE} />

          {/* ── the two differences, tied term to term ── */}
          <div style={{ gridColumn: 1 }} />
          <Connector
            color={ACCENT}
            height={64}
            label={
              <>
                target <M tex={String.raw`\textcolor{${ACCENT}}{Y}`} size={11.5} /> vs
                <br />
                the input <M tex={String.raw`\textcolor{${ACCENT}}{x}`} size={11.5} /> itself
              </>
            }
          />
          <div />
          <div />
          <Connector
            color={SUPPORT}
            height={64}
            label={
              <>
                weight <M tex={String.raw`\textcolor{${SUPPORT}}{\tfrac{1}{\beta}}`} size={11.5} /> vs
                <br />
                weight <M tex={String.raw`\textcolor{${SUPPORT}}{1}`} size={11.5} />
              </>
            }
          />
          <div />

          <Header text="VAE (ELBO, negated)" top={10} />

          <M tex={String.raw`J_{\text{VAE}} \;=\;`} size={MSIZE} />
          <M tex={decoder("x")} size={MSIZE} />
          <M tex={String.raw`\;+\;`} size={MSIZE} />
          <div />
          <M tex={core} size={MSIZE} />
          <div />

          {/* ── the special case, spelled out under the VAE row ── */}
          <div style={{ gridColumn: "2 / -1", marginTop: 9 }}>
            <M
              tex={String.raw`\textcolor{${SUPPORT}}{\beta = 1}\quad\text{and}\quad\textcolor{${ACCENT}}{Y = X}`}
              size={14}
            />
          </div>
        </div>
      </div>

      {/* ── the payoff, in the right margin ── */}
      <div
        style={{
          flex: "none",
          width: 152,
          fontSize: 11.5,
          lineHeight: 1.5,
          opacity: 0.72,
          borderLeft: "1px solid currentColor",
          paddingLeft: 11,
          marginTop: 4,
        }}
      >
        same algebra, different claim: VIB compresses toward a target, the VAE
        models the data
      </div>
    </div>
  );
}
