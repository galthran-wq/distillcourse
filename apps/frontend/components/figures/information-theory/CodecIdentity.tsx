import type { CSSProperties, ReactNode } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * CodecIdentity — two literatures wrote down one objective.
 *
 * FigureSequence, 4 frames. Shared skeleton, identical in every frame: a
 * title line at the top, one centred display equation anchored at the same
 * y, a one-line muted gloss pinned at the bottom.
 *
 *   1  the negated ELBO (Kingma & Welling 2014, eq. 3), plain
 *   2  the same equation, its two terms named by underbraces
 *   3  the rate-distortion Lagrangian L = R + λD, its two terms named
 *   4  the two stacked and aligned term for term, dotted connectors binding
 *      the KL to R and the reconstruction to λD, each connector annotated
 *      with the hypothesis that makes the identification hold
 *
 * Color roles (rule 1, bound literally in the TeX and on the connectors):
 * amber = the rate term wherever it appears (KL to the prior, R); blue = the
 * distortion term wherever it appears (reconstruction, λD); currentColor =
 * structure. One idea: two literatures, one objective, and the two
 * assumptions that identify them. After Ballé et al. 2018, eq. 3 — the
 * layout is the house's own.
 */

const A = ACCENT; // rate
const S = SUPPORT; // distortion

const W = 740;
const HGT = 326;
const EQ_TOP = 94; // top of the equation block — identical in all four frames
const GLOSS_TOP = 288;

const amber = (tex: string) => String.raw`\textcolor{${A}}{${tex}}`;
const blue = (tex: string) => String.raw`\textcolor{${S}}{${tex}}`;

// ── the pieces, shared between the single-line frames and the stack ──
const T_LHS = String.raw`-\mathcal{L}`;
const T_REC = String.raw`\mathbb{E}_{q}\bigl[-\log p(x \mid z)\bigr]`;
const T_KL = String.raw`D\bigl(q(z \mid x) \,\|\, p(z)\bigr)`;
/** equalises cell heights so the grid's centred rows align on the baseline */
const STRUT = String.raw`\vphantom{\bigl[-\log p\bigr]}`;

const F1 = String.raw`${T_LHS} \;=\; ${T_REC} \;+\; ${T_KL}`;

const F2 = String.raw`${T_LHS} \;=\;
  \underbrace{${blue(T_REC)}}_{${blue(String.raw`\text{reconstruction}`)}}
  \;+\;
  \underbrace{${amber(T_KL)}}_{${amber(String.raw`\text{KL to the prior}`)}}`;

const F3 = String.raw`L \;=\;
  \underbrace{${amber("R")}}_{${amber(String.raw`\text{expected code length}`)}}
  \;+\;
  \underbrace{${blue(String.raw`\lambda D`)}}_{${blue(String.raw`\text{expected fidelity loss}`)}}`;

const TITLE: Record<number, string> = {
  1: "variational autoencoder (Kingma & Welling 2014, eq. 3), negated",
  2: "variational autoencoder (Kingma & Welling 2014, eq. 3), negated",
  3: "rate-distortion (this course, rate-distortion lesson)",
  4: "the same objective, term for term (Ballé et al. 2018, eq. 3)",
};

const titleStyle: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 13.5,
  fontWeight: 600,
  opacity: 0.7,
  letterSpacing: "0.01em",
  textAlign: "center",
};

const glossStyle: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 12.5,
  fontStyle: "italic",
  opacity: 0.6,
  lineHeight: 1.4,
  textAlign: "center",
};

const noteStyle: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  fontSize: 11,
  lineHeight: 1.4,
  opacity: 0.9,
};

/** keeps a KaTeX span from breaking across lines inside a narrow note */
function Nb({ tex }: { tex: string }) {
  return (
    <span style={{ whiteSpace: "nowrap" }}>
      <M tex={tex} size={11} />
    </span>
  );
}

function Row({ top, children }: { top: number; children: ReactNode }) {
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        width: W,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {children}
    </div>
  );
}

/** a dotted vertical connector, centred in its grid column, with a note beside it */
function Connector({
  color,
  side,
  children,
}: {
  color: string;
  side: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div style={{ position: "relative", height: 80 }}>
      <div
        style={{
          width: 0,
          height: 80,
          margin: "0 auto",
          borderLeft: `2px dotted ${color}`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 14,
          width: 198,
          ...(side === "left"
            ? { right: "calc(50% + 13px)", textAlign: "right" }
            : { left: "calc(50% + 13px)", textAlign: "left" }),
          color,
          ...noteStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** frame 4: the two objectives stacked, aligned column by column */
function Stack() {
  const cell = (tex: string, size = 20) => <M tex={tex + STRUT} size={size} />;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto auto auto auto auto",
        columnGap: 11,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* row 1 — the VAE form, its two terms in the order that lines up */}
      <div style={{ textAlign: "center" }}>{cell(T_LHS)}</div>
      <div style={{ textAlign: "center" }}>{cell("=")}</div>
      <div style={{ textAlign: "center" }}>{cell(amber(T_KL))}</div>
      <div style={{ textAlign: "center" }}>{cell("+")}</div>
      <div style={{ textAlign: "center" }}>{cell(blue(T_REC))}</div>
      <div />

      {/* row 2 — the connectors */}
      <div />
      <div />
      <Connector color={A} side="left">
        because <Nb tex={String.raw`\mathbb{E}_{q}[\log q] = 0`} /> for{" "}
        <span style={{ whiteSpace: "nowrap" }}>unit-width uniform noise</span>
      </Connector>
      <div />
      <Connector color={S} side="right">
        because the likelihood is{" "}
        <Nb
          tex={String.raw`\mathcal{N}\bigl(x \mid \tilde x,\, (2\lambda)^{-1} I\bigr)`}
        />
      </Connector>
      <div />

      {/* row 3 — the rate-distortion form, term under term */}
      <div />
      <div style={{ textAlign: "center" }}>{cell("=")}</div>
      <div style={{ textAlign: "center" }}>{cell(amber("R"))}</div>
      <div style={{ textAlign: "center" }}>{cell("+")}</div>
      <div style={{ textAlign: "center" }}>{cell(blue(String.raw`\lambda D`))}</div>
      <div style={{ textAlign: "center", opacity: 0.5, whiteSpace: "nowrap" }}>
        {cell(String.raw`+\;\text{const}`, 16)}
      </div>
    </div>
  );
}

function GLOSS(frame: number): ReactNode {
  if (frame === 1)
    return "minimising this is minimising the divergence to the true posterior";
  if (frame === 2) return "two terms, no compression in sight";
  if (frame === 3)
    return (
      <>
        <M tex={String.raw`\lambda = -R'(D)`} size={12.5} /> selects the point on
        the curve
      </>
    );
  return "one objective — and, on the connectors, the two hypotheses that make the identification hold";
}

export default function CodecIdentity({ frame = 1 }: { frame?: number }) {
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
      <Row top={22}>
        <div style={{ ...titleStyle, maxWidth: 620 }}>{TITLE[frame]}</div>
      </Row>

      <Row top={EQ_TOP}>
        {frame === 1 ? (
          <M tex={F1} size={20} />
        ) : frame === 2 ? (
          <M tex={F2} size={20} />
        ) : frame === 3 ? (
          <M tex={F3} size={20} />
        ) : (
          <Stack />
        )}
      </Row>

      <Row top={GLOSS_TOP}>
        <div style={{ ...glossStyle, maxWidth: 600 }}>{GLOSS(frame)}</div>
      </Row>
    </div>
  );
}
