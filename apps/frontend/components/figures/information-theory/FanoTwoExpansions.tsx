import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * FanoTwoExpansions — Fano's inequality as a picture of its algebra.
 *
 * FigureSequence, 4 frames. One quantity H(E, X | X-hat) at the top expands
 * two ways: X-first (upper slot) and E-first (lower slot), the two slots
 * gathered at the left by a brace. Frame 1 introduces the error indicator E;
 * frame 2 fills the X-first slot, whose second term is struck to zero;
 * frame 3 fills the E-first slot, whose two survivors carry the bounds
 * H_2(P_e) and P_e log(M-1); frame 4 joins the slots with an equals sign and
 * reads off the inequality, with the lesson's four-key instance
 * 1.357 <= 0.881 + 0.475 beneath it.
 *
 * Color roles: amber = the leftover uncertainty H(X | X-hat) being bounded
 * (the subject), blue = the error indicator E and every term it produces.
 * After Cover & Thomas §2.10 (the algebra recreated as a picture, not copied).
 */

const W = 800;
const HGT = 448;

const A = ACCENT;
const B = SUPPORT;

// --- anchor geometry -----------------------------------------------------
const TOP_CX = 400; // top quantity center x
const TOP_BOT = 50; // bottom of the top quantity box

const BRACE_TIP = 150; // x of the brace's left-pointing tip
const TIE_X = 112; // column the tether runs down, clear of the brace
const BRACE_Y0 = 100;
const BRACE_Y1 = 330;
const BRACE_YM = (BRACE_Y0 + BRACE_Y1) / 2;

const SLOT_X = 228; // left edge of both expansion slots
const LABEL_A_Y = 100; // "X first"
const SLOT_A_Y = 120;
const EQ_Y = 198; // equals sign joining the two slots
const LABEL_B_Y = 212; // "E first"
const SLOT_B_Y = 232;

const RULE_Y = 352;
const CONC_Y = 366;
const NUM_Y = 408;

// --- TeX fragments -------------------------------------------------------
const TOP = String.raw`H(E,\,X \mid \hat{X})`;

const DEF = String.raw`\textcolor{${B}}{E \;=\; \mathbf{1}\{\hat{X} \ne X\}}`;
const DEF_PROB = String.raw`\textcolor{${B}}{\Pr[E = 1] \;=\; P_e}`;

const KEEP = String.raw`\textcolor{${A}}{H(X \mid \hat{X})}`;
const ZERO_TERM = String.raw`\underbrace{\textcolor{${B}}{\cancel{H(E \mid X, \hat{X})}}}_{\textcolor{${B}}{=\;0}}`;
const BOUND_1 = String.raw`\underbrace{\textcolor{${B}}{H(E \mid \hat{X})}}_{\textcolor{${B}}{\le\; H_2(P_e)}}`;
const BOUND_2 = String.raw`\underbrace{\textcolor{${B}}{H(X \mid E, \hat{X})}}_{\textcolor{${B}}{\le\; P_e \log_2 (M-1)}}`;

const CONCLUSION = String.raw`\textcolor{${A}}{H(X \mid \hat{X})}\;\le\;\textcolor{${B}}{H_2(P_e)}\;+\;\textcolor{${B}}{P_e \log_2 (M-1)}`;
const NUMERIC = String.raw`\textcolor{${A}}{1.357}\;\le\;\textcolor{${B}}{0.881}\;+\;\textcolor{${B}}{0.475}\;=\;1.357`;

const SLOT_SIZE = 16;

// --- primitives ----------------------------------------------------------
function Centered({
  cx,
  top,
  children,
}: {
  cx: number;
  top: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: cx,
        top,
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </div>
  );
}

function At({
  x,
  top,
  children,
}: {
  x: number;
  top: number;
  children: React.ReactNode;
}) {
  return (
    <div style={{ position: "absolute", left: x, top, whiteSpace: "nowrap" }}>
      {children}
    </div>
  );
}

/** A term with its underbraced bound, and the reason for it in prose below. */
function Term({
  tex,
  glossWidth,
  tint,
  children,
}: {
  tex: string;
  glossWidth: number;
  tint?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <M tex={tex} size={SLOT_SIZE} />
      <div
        style={{
          fontSize: 11.5,
          lineHeight: 1.35,
          color: tint,
          opacity: tint ? 0.95 : 0.55,
          textAlign: "center",
          whiteSpace: "normal",
          maxWidth: glossWidth,
          marginTop: 3,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Slot label ("X first" / "E first"): small, muted, spaced small caps. */
function SlotLabel({ top, children }: { top: number; children: string }) {
  return (
    <At x={SLOT_X} top={top}>
      <span
        style={{
          fontSize: 11.5,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.5,
        }}
      >
        {children}
      </span>
    </At>
  );
}

/** Dashed placeholder standing in for a slot that is not filled yet. */
function EmptySlot({
  top,
  width,
  height,
}: {
  top: number;
  width: number;
  height: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: SLOT_X,
        top,
        width,
        height,
        border: "1.3px dashed currentColor",
        borderRadius: 6,
        opacity: 0.22,
      }}
    />
  );
}

/** A left curly brace: tip points left at (tip, ym), arms reach right. */
function bracePath(tip: number, y0: number, y1: number) {
  const spine = tip + 8;
  const arm = tip + 17;
  const ym = (y0 + y1) / 2;
  const q = 13;
  return [
    `M ${arm} ${y0}`,
    `Q ${spine} ${y0} ${spine} ${y0 + q}`,
    `L ${spine} ${ym - q}`,
    `Q ${spine} ${ym} ${tip} ${ym}`,
    `Q ${spine} ${ym} ${spine} ${ym + q}`,
    `L ${spine} ${y1 - q}`,
    `Q ${spine} ${y1} ${arm} ${y1}`,
  ].join(" ");
}

export default function FanoTwoExpansions({ frame = 1 }: { frame?: number }) {
  const showA = frame >= 2; // X-first expansion filled
  const showB = frame >= 3; // E-first expansion filled
  const showEnd = frame >= 4; // equals sign + conclusion

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
      {/* graphics: the gathering brace + its tether to the top quantity */}
      <svg
        width={W}
        height={HGT}
        viewBox={`0 0 ${W} ${HGT}`}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <path
          d={[
            `M ${TOP_CX - 34} ${TOP_BOT + 2}`,
            `C ${TOP_CX - 140} ${TOP_BOT + 42} ${TIE_X + 4} ${TOP_BOT + 26} ${TIE_X} ${TOP_BOT + 70}`,
            `L ${TIE_X} ${BRACE_YM - 10}`,
            `Q ${TIE_X} ${BRACE_YM} ${TIE_X + 10} ${BRACE_YM}`,
            `L ${BRACE_TIP - 4} ${BRACE_YM}`,
          ].join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.1"
          strokeDasharray="3 3"
          opacity="0.45"
        />
        <path
          d={bracePath(BRACE_TIP, BRACE_Y0, BRACE_Y1)}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          opacity="0.5"
        />
      </svg>

      {/* the one quantity, expanded two ways */}
      <Centered cx={TOP_CX} top={6}>
        <span
          style={{
            display: "inline-block",
            border: "1.5px solid currentColor",
            borderRadius: 7,
            padding: "5px 16px",
          }}
        >
          <M tex={TOP} size={18} />
        </span>
      </Centered>

      {/* the error indicator: what E is */}
      <div
        style={{
          position: "absolute",
          right: 4,
          top: 6,
          border: `1.3px solid ${B}`,
          borderRadius: 7,
          padding: "8px 14px",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        <M tex={DEF} size={15} />
        <div style={{ fontSize: 11.5, opacity: 0.6, margin: "5px 0 6px" }}>
          1 if the guess missed, 0 if it hit
        </div>
        <M tex={DEF_PROB} size={14} />
      </div>

      {/* X-first expansion: the second term is determined, so it is zero */}
      <SlotLabel top={LABEL_A_Y}>X first</SlotLabel>
      {showA ? (
        <At x={SLOT_X} top={SLOT_A_Y}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <Term tex={KEEP} glossWidth={150} tint={A}>
              the leftover uncertainty
            </Term>
            <M tex={"+"} size={SLOT_SIZE} />
            <Term tex={ZERO_TERM} glossWidth={210}>
              <M tex="E" size={11.5} /> is a function of <M tex="X" size={11.5} />{" "}
              and <M tex={String.raw`\hat{X}`} size={11.5} />
            </Term>
          </div>
        </At>
      ) : (
        <EmptySlot top={SLOT_A_Y} width={324} height={70} />
      )}

      {/* both orders count the same quantity (frame 4) */}
      {showEnd && (
        <At x={SLOT_X - 46} top={EQ_Y}>
          <M tex={"="} size={20} />
        </At>
      )}

      {/* E-first expansion: two survivors, each with a bound */}
      <SlotLabel top={LABEL_B_Y}>E first</SlotLabel>
      {showB ? (
        <At x={SLOT_X} top={SLOT_B_Y}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <Term tex={BOUND_1} glossWidth={185}>
              conditioning reduces entropy
            </Term>
            <M tex={"+"} size={SLOT_SIZE} />
            <Term tex={BOUND_2} glossWidth={215}>
              given an error, <M tex="X" size={11.5} /> is one of the other{" "}
              <M tex="M-1" size={11.5} /> symbols
            </Term>
          </div>
        </At>
      ) : (
        <EmptySlot top={SLOT_B_Y} width={378} height={92} />
      )}

      {/* what the two orders together say (frame 4) */}
      {showEnd && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: RULE_Y,
              borderTop: "1px solid currentColor",
              opacity: 0.18,
            }}
          />
          <Centered cx={TOP_CX} top={CONC_Y}>
            <M tex={CONCLUSION} size={17} />
          </Centered>
          <Centered cx={TOP_CX} top={NUM_Y}>
            <span style={{ fontSize: 11.5, opacity: 0.55, fontStyle: "italic" }}>
              the four-key channel of this lesson:&nbsp;
            </span>
            <span style={{ opacity: 0.85 }}>
              <M tex={NUMERIC} size={14} />
            </span>
          </Centered>
        </>
      )}
    </div>
  );
}
