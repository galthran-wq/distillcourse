import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * DpiProofTwoWays — the data-processing inequality proof as a picture.
 *
 * FigureSequence, 3 frames. One quantity I(Y; X,T) at the top expands two
 * ways: X-first (frame 1) and T-first (frame 2). In frame 3 the Markov term
 * I(Y;T|X) is struck to zero, and nonnegativity of the surviving residual
 * I(Y;X|T) reads off the inequality I(T;Y) <= I(X;Y), with the numeric
 * instance from the lesson table (0.811 = 0.467 + 0.344).
 *
 * Color roles: amber = information X carries about Y, blue = information T
 * carries. After Cover & Thomas §2.8 (recreated, not copied).
 */

const W = 720;
const HGT = 320;

// anchor geometry
const TOP_CX = 360; // top quantity center x
const TOP_BOT = 56; // bottom of the top box (arrows leave from here)
const SLOT_TOP = 108; // top of the two expansion slots
const A_CX = 194; // X-first slot center x
const B_CX = 526; // T-first slot center x

const A = ACCENT;
const B = SUPPORT;

// --- TeX fragments -------------------------------------------------------
const TOP = String.raw`I(Y;\,X,T)`;

// X-first expansion (frames 1–2)
const SLOT_A = String.raw`\underbrace{\textcolor{${A}}{I(Y;X)}}_{\textcolor{${A}}{\text{what }X\text{ tells}}}\;+\;\underbrace{\textcolor{${B}}{I(Y;T\mid X)}}_{\textcolor{${B}}{\text{what }T\text{ adds given }X}}`;

// X-first expansion with the Markov term zeroed (frame 3)
const SLOT_A_ZERO = String.raw`\underbrace{\textcolor{${A}}{I(Y;X)}}_{\textcolor{${A}}{\text{what }X\text{ tells}}}\;+\;\underbrace{\cancel{\textcolor{${B}}{I(Y;T\mid X)}}}_{=\,0\ \text{(Markov)}}`;

// T-first expansion (frames 2–3)
const SLOT_B = String.raw`\underbrace{\textcolor{${B}}{I(Y;T)}}_{\textcolor{${B}}{\text{what }T\text{ tells}}}\;+\;\underbrace{\textcolor{${A}}{I(Y;X\mid T)}}_{\textcolor{${A}}{\text{what }X\text{ adds given }T}}`;

const CONCLUSION = String.raw`\textcolor{${A}}{I(Y;X)}\;=\;\textcolor{${B}}{I(Y;T)}\;+\;\underbrace{\textcolor{${A}}{I(Y;X\mid T)}}_{\ge\,0}\;\;\Longrightarrow\;\;\textcolor{${B}}{I(T;Y)}\;\le\;\textcolor{${A}}{I(X;Y)}`;

const NUMERIC = String.raw`\textcolor{${A}}{0.811}\;=\;\textcolor{${B}}{0.467}\;+\;\textcolor{${A}}{0.344}`;

function Centered({
  cx,
  top,
  children,
  opacity = 1,
}: {
  cx: number;
  top: number;
  children: React.ReactNode;
  opacity?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top,
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        opacity,
      }}
    >
      {children}
    </div>
  );
}

/** Thin flow arrow from (x1,y1) to (x2,y2) with a small filled head. */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  muted = false,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  muted?: boolean;
}) {
  const op = muted ? 0.25 : 0.6;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hl = 7;
  const hw = 3.2;
  const bx = x2 - hl * Math.cos(ang);
  const by = y2 - hl * Math.sin(ang);
  const px = -Math.sin(ang);
  const py = Math.cos(ang);
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={bx}
        y2={by}
        stroke="currentColor"
        strokeWidth="1.1"
        opacity={op}
      />
      <path
        d={`M ${x2} ${y2} L ${bx + px * hw} ${by + py * hw} L ${bx - px * hw} ${by - py * hw} Z`}
        fill="currentColor"
        opacity={op}
      />
    </g>
  );
}

export default function DpiProofTwoWays({ frame = 1 }: { frame?: number }) {
  const showB = frame >= 2; // T-first expansion visible
  const showConclusion = frame >= 3;

  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      {/* overlay: fan arrows + "expands to" labels */}
      <svg
        width={W}
        height={HGT}
        viewBox={`0 0 ${W} ${HGT}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <Arrow x1={TOP_CX - 40} y1={TOP_BOT} x2={A_CX} y2={SLOT_TOP - 6} />
        <Arrow
          x1={TOP_CX + 40}
          y1={TOP_BOT}
          x2={B_CX}
          y2={SLOT_TOP - 6}
          muted={!showB}
        />
      </svg>

      {/* top quantity */}
      <Centered cx={TOP_CX} top={8}>
        <span
          style={{
            display: "inline-block",
            border: "1.5px solid currentColor",
            borderRadius: 7,
            padding: "6px 16px",
          }}
        >
          <M tex={TOP} size={18} />
        </span>
      </Centered>

      {/* "expands to" arrow labels */}
      <Centered cx={251} top={74}>
        <span style={{ fontStyle: "italic", fontSize: 11.5, opacity: 0.55 }}>
          expands to
        </span>
      </Centered>
      <Centered cx={469} top={74} opacity={showB ? 1 : 0.3}>
        <span style={{ fontStyle: "italic", fontSize: 11.5, opacity: 0.55 }}>
          expands to
        </span>
      </Centered>

      {/* X-first slot */}
      <Centered cx={A_CX} top={SLOT_TOP}>
        <M tex={showConclusion ? SLOT_A_ZERO : SLOT_A} size={15} />
      </Centered>

      {/* equals sign joining the two expansions through the top quantity */}
      {showB && (
        <Centered cx={TOP_CX} top={SLOT_TOP + 8}>
          <M tex={String.raw`=`} size={20} />
        </Centered>
      )}

      {/* T-first slot (frame 2+), muted dashed placeholder in frame 1 */}
      {showB ? (
        <Centered cx={B_CX} top={SLOT_TOP}>
          <M tex={SLOT_B} size={15} />
        </Centered>
      ) : (
        <div
          style={{
            position: "absolute",
            left: B_CX,
            top: SLOT_TOP + 2,
            transform: "translateX(-50%)",
            width: 250,
            height: 30,
            border: "1.3px dashed currentColor",
            borderRadius: 6,
            opacity: 0.25,
          }}
        />
      )}

      {/* conclusion (frame 3) */}
      {showConclusion && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 196,
              borderTop: "1px solid currentColor",
              opacity: 0.18,
            }}
          />
          <Centered cx={TOP_CX} top={216}>
            <M tex={CONCLUSION} size={16} />
          </Centered>
          <Centered cx={TOP_CX} top={266}>
            <span style={{ fontSize: 11.5, opacity: 0.55, fontStyle: "italic" }}>
              on the lesson&rsquo;s table:&nbsp;
            </span>
            <M tex={NUMERIC} size={15} />
          </Centered>
        </>
      )}
    </div>
  );
}
