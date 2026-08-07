import { M } from "../M";
import { ACCENT, SUPPORT, OK } from "../palette";

/**
 * BernoulliExpFamSteps — the "force the Bernoulli pmf into exponential-family
 * shape and read off the natural parameter" derivation in three moves, staging
 * exactly the section 'Bernoulli, rearranged: the logit appears by itself'
 * (after CS229 ch. 3's worked rewrite — recreated in house style, not copied).
 *
 * FigureSequence, 3 frames. House formula-dissection layout: one large centered
 * KaTeX line, short color-bound labels floating above/below individual terms on
 * thin leader lines, a muted gloss, and a persistent role legend. Color roles
 * are fixed once the algebra exposes them:
 *   amber = the natural parameter  η = log φ/(1−φ)   (the subject / payoff)
 *   blue  = the sufficient statistic  T(y) = y
 *   green = the log-partition  a(η)  (here −a(η) = log(1−φ))
 *
 *   frame 1  the raw pmf φ^y (1−φ)^{1−y}; exponents select φ or 1−φ
 *   frame 2  the exp/log rewrite, terms regrouped and color-bound to η, T, a
 *   frame 3  box η = logit(φ) and invert it → φ = σ(η): the sigmoid is the
 *            inverse link, not an imposed squashing
 */

const ETA = ACCENT; // amber — natural parameter η = log φ/(1−φ)
const T = SUPPORT; // blue — sufficient statistic T(y) = y
const A = OK; // green — log-partition (−a(η) = log(1−φ))

const cEta = (t: string) => String.raw`\textcolor{${ETA}}{${t}}`;
const cT = (t: string) => String.raw`\textcolor{${T}}{${t}}`;
const cA = (t: string) => String.raw`\textcolor{${A}}{${t}}`;

// --- shared chrome --------------------------------------------------------

const TITLES: Record<number, string> = {
  1: "The Bernoulli pmf",
  2: "Regroup into exponential-family form",
  3: "The natural parameter is the logit",
};

const GLOSS: Record<number, string> = {
  1: "two numbers, φ and 1−φ, picked out by the exponents y and 1−y",
  2: "one exp of a sum — the coefficient sitting in front of y is the log-odds; the natural parameter appears on its own",
  3: "invert η = log φ/(1−φ) to get φ = σ(η): the sigmoid is not chosen, it is the inverse link",
};

function Badge({ n }: { n: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 11px",
        border: "1.3px solid currentColor",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.02em",
        opacity: 0.55,
        whiteSpace: "nowrap",
      }}
    >
      step {n} / 3
    </span>
  );
}

function Chip({ color, label }: { color: string; label: React.ReactNode }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          width: 11,
          height: 11,
          borderRadius: 3,
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
    </span>
  );
}

/**
 * A math atom carrying an absolutely-positioned label above or below, joined by
 * a thin leader line to the term's centre. Absolute positioning keeps the atom
 * on the equation's baseline so the leader always lands on its term regardless
 * of term width.
 */
function Term({
  tex,
  size = 22,
  color,
  symbol,
  descriptor,
  pos,
  floating = true,
}: {
  tex: string;
  size?: number;
  color: string;
  symbol: string;
  descriptor: string;
  pos: "top" | "bottom";
  floating?: boolean;
}) {
  const leader = (
    <span
      style={{ width: 1.3, height: 16, background: color, opacity: 0.75 }}
    />
  );
  const symbolEl = (
    <span
      style={{
        fontSize: 12.5,
        fontWeight: 600,
        color,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      {symbol}
    </span>
  );
  const descriptorEl = (
    <span
      style={{
        fontSize: 10.5,
        opacity: 0.5,
        whiteSpace: "nowrap",
        lineHeight: 1.1,
      }}
    >
      {descriptor}
    </span>
  );
  // top: outward→inward is descriptor, symbol, leader (leader touches term)
  // bottom: leader, symbol, descriptor
  const stack =
    pos === "top"
      ? [descriptorEl, symbolEl, leader]
      : [leader, symbolEl, descriptorEl];
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        verticalAlign: "baseline",
      }}
    >
      <M tex={tex} size={size} color={color} />
      {floating && (
      <span
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          ...(pos === "top" ? { bottom: "100%" } : { top: "100%" }),
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          paddingBottom: pos === "top" ? 2 : 0,
          paddingTop: pos === "bottom" ? 2 : 0,
        }}
      >
        {stack.map((el, i) => (
          <span key={i} style={{ display: "flex" }}>
            {el}
          </span>
        ))}
      </span>
      )}
    </span>
  );
}

const Plain = ({ tex, size = 22 }: { tex: string; size?: number }) => (
  <span style={{ display: "inline-block", verticalAlign: "baseline" }}>
    <M tex={tex} size={size} />
  </span>
);

// --- per-frame bodies -----------------------------------------------------

function Frame1() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 26,
      }}
    >
      <M
        tex={String.raw`p(y;\varphi)\;=\;\varphi^{\,y}\,(1-\varphi)^{\,1-y}`}
        display
        size={24}
      />
      <div
        style={{
          display: "flex",
          gap: 34,
          fontStyle: "italic",
          opacity: 0.6,
        }}
      >
        <M
          tex={String.raw`y=1:\ \ \varphi^{1}(1-\varphi)^{0}=\varphi`}
          size={14}
        />
        <M
          tex={String.raw`y=0:\ \ \varphi^{0}(1-\varphi)^{1}=1-\varphi`}
          size={14}
        />
      </div>
    </div>
  );
}

function Frame2({ dimmed = false }: { dimmed?: boolean }) {
  const size = dimmed ? 17 : 20;
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: dimmed ? 0.4 : 1,
      }}
    >
      <div
        style={{
          textAlign: "center",
          whiteSpace: "nowrap",
          lineHeight: 1,
          // reserve vertical room for the absolutely-positioned float labels
          padding: dimmed ? 0 : "56px 0",
        }}
      >
        <Plain tex={String.raw`p(y;\varphi)=\exp\!\Big(`} size={size} />
        <Term
          tex={String.raw`\log\tfrac{\varphi}{1-\varphi}`}
          size={size}
          color={ETA}
          symbol="η"
          descriptor="natural parameter"
          pos="top"
          floating={!dimmed}
        />
        <Plain tex={String.raw`\cdot`} size={size} />
        <Term
          tex={String.raw`y`}
          size={size}
          color={T}
          symbol="T(y) = y"
          descriptor="sufficient statistic"
          pos="bottom"
          floating={!dimmed}
        />
        <Plain tex={String.raw`+`} size={size} />
        <Term
          tex={String.raw`\log(1-\varphi)`}
          size={size}
          color={A}
          symbol="−a(η)"
          descriptor="log-partition"
          pos="top"
          floating={!dimmed}
        />
        <Plain tex={String.raw`\Big)`} size={size} />
      </div>
      {!dimmed && (
        <div
          style={{
            position: "absolute",
            left: "calc(100% + 12px)",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 12,
            opacity: 0.5,
            fontStyle: "italic",
            whiteSpace: "nowrap",
            textAlign: "center",
          }}
        >
          <M tex={String.raw`b(y)=1`} size={13} />
          <br />
          base measure
        </div>
      )}
    </div>
  );
}

function Frame3() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
      }}
    >
      <Frame2 dimmed />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            display: "inline-block",
            border: `1.8px solid ${ETA}`,
            borderRadius: 8,
            padding: "10px 16px",
          }}
        >
          <M tex={String.raw`\eta=\log\tfrac{\varphi}{1-\varphi}`} size={18} color={ETA} />
        </span>
        <span
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <span style={{ fontSize: 11, opacity: 0.55, fontStyle: "italic" }}>
            solve for φ
          </span>
          <svg viewBox="0 0 64 12" width="64" height="12" aria-hidden="true">
            <line
              x1="2"
              y1="6"
              x2="56"
              y2="6"
              stroke={ETA}
              strokeWidth="1.6"
            />
            <path
              d="M56 6 L49 2.5 L49 9.5 Z"
              fill={ETA}
            />
          </svg>
        </span>
        <span
          style={{
            display: "inline-block",
            border: `1.8px solid ${ETA}`,
            borderRadius: 8,
            padding: "10px 16px",
          }}
        >
          <M
            tex={String.raw`\varphi=\tfrac{1}{1+e^{-\eta}}=\sigma(\eta)`}
            size={18}
            color={ETA}
          />
        </span>
      </div>
      <div
        style={{
          fontSize: 13,
          fontStyle: "italic",
          opacity: 0.7,
          textAlign: "center",
          maxWidth: 520,
        }}
      >
        the logit is the natural parameter; the sigmoid is its inverse
      </div>
    </div>
  );
}

// --- shell ----------------------------------------------------------------

export default function BernoulliExpFamSteps({
  frame = 1,
}: {
  frame?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 660,
        minHeight: 384,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxSizing: "border-box",
        padding: "4px 8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Badge n={frame} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{TITLES[frame]}</span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "26px 0",
        }}
      >
        {frame === 1 && <Frame1 />}
        {frame === 2 && <Frame2 />}
        {frame === 3 && <Frame3 />}
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: 12.5,
            fontStyle: "italic",
            opacity: 0.6,
            lineHeight: 1.4,
            textAlign: "center",
            maxWidth: 560,
          }}
        >
          {GLOSS[frame]}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 22,
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid currentColor",
          borderTopColor: "rgba(128,128,128,0.25)",
          flexWrap: "wrap",
        }}
      >
        <Chip color={ETA} label={<>η = log φ/(1−φ), natural parameter</>} />
        <Chip color={T} label={<>T(y) = y, sufficient statistic</>} />
        <Chip color={A} label={<>−a(η) = log(1−φ), log-partition</>} />
      </div>
    </div>
  );
}
