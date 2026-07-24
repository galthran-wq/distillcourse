import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * FeasibleSetSimplex — the geometric picture of the maximum-entropy principle.
 *
 * The 2-simplex (triangle) is the set of all pmfs over 3 outcomes; its vertices
 * are the point masses (1,0,0), (0,1,0), (0,0,1). Nested closed contours are
 * entropy level sets: entropy is maximal at the centroid (the uniform pmf) and
 * increases inward. A blue straight line is a linear constraint <f> = alpha — a
 * hyperplane — whose intersection with the simplex is the feasible set. The
 * amber max-entropy point p* is where the highest (innermost) entropy contour
 * that still meets the constraint touches it: the contour tangent to the line.
 *
 * One idea: constraints select a SET of distributions; entropy selects one
 * POINT of it. Component tier — HTML/KaTeX labels over an inline-SVG geometry.
 */

const W = 690;
const H = 486;

// triangle (2-simplex over 3 outcomes)
const E1 = { x: 130, y: 405 }; // (1,0,0)
const E2 = { x: 530, y: 405 }; // (0,1,0)
const E3 = { x: 330, y: 55 }; //  (0,0,1)
const C = { x: 330, y: 288 }; // centroid = uniform pmf

// entropy contours (circles centred on the uniform pmf); amber one is tangent.
const R_TANGENT = 72; // = distance from centroid to the constraint line
const FAINT_R = [30, 51, 93];

// constraint line: tangent to the amber contour at p*, cutting the simplex.
const PSTAR = { x: 386.74, y: 243.67 }; // foot of perpendicular from C
const A = { x: 291.7, y: 122.0 }; // chord ∩ left edge
const B = { x: 512.8, y: 405.0 }; // chord ∩ bottom edge
const A_EXT = { x: 272.84, y: 97.87 }; // hyperplane beyond the simplex
const B_EXT = { x: 522.4, y: 417.4 };

// anchor on the feasible segment for the "feasible set" gloss
const FEAS = { x: 438, y: 310.3 };

export default function FeasibleSetSimplex() {
  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: H,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <defs>
          <marker
            id="fss-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="currentColor" />
          </marker>
        </defs>

        {/* the 2-simplex: all pmfs over 3 outcomes */}
        <polygon
          points={`${E1.x},${E1.y} ${E2.x},${E2.y} ${E3.x},${E3.y}`}
          fill="currentColor"
          fillOpacity="0.03"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* entropy level sets (faint), increasing inward */}
        {FAINT_R.map((r) => (
          <circle
            key={r}
            cx={C.x}
            cy={C.y}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            opacity="0.16"
          />
        ))}

        {/* the hyperplane <f> = alpha, extended outside the simplex (dashed) */}
        <line
          x1={A_EXT.x}
          y1={A_EXT.y}
          x2={A.x}
          y2={A.y}
          stroke={SUPPORT}
          strokeWidth="1.6"
          strokeDasharray="5 5"
          opacity="0.5"
        />
        <line
          x1={B.x}
          y1={B.y}
          x2={B_EXT.x}
          y2={B_EXT.y}
          stroke={SUPPORT}
          strokeWidth="1.6"
          strokeDasharray="5 5"
          opacity="0.5"
        />

        {/* the feasible set: the constraint line inside the simplex (solid) */}
        <line
          x1={A.x}
          y1={A.y}
          x2={B.x}
          y2={B.y}
          stroke={SUPPORT}
          strokeWidth="2.6"
        />

        {/* the highest entropy contour that meets the constraint: tangent */}
        <circle
          cx={C.x}
          cy={C.y}
          r={R_TANGENT}
          fill="none"
          stroke={ACCENT}
          strokeWidth="2.4"
        />

        {/* the uniform pmf (max entropy) */}
        <circle cx={C.x} cy={C.y} r="3.6" fill="currentColor" />
        <line
          x1={C.x}
          y1={C.y + 4}
          x2={C.x}
          y2={352}
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.45"
        />

        {/* the max-entropy point p*: tangency of contour and constraint */}
        <circle cx={PSTAR.x} cy={PSTAR.y} r="5" fill={ACCENT} />

        {/* leader: p* to its right-margin annotation */}
        <line
          x1={PSTAR.x + 5}
          y1={PSTAR.y - 3}
          x2={554}
          y2={182}
          stroke={ACCENT}
          strokeWidth="1.1"
          opacity="0.8"
        />

        {/* leader: feasible-set gloss to the blue segment */}
        <line
          x1={FEAS.x}
          y1={FEAS.y}
          x2={528}
          y2={303}
          stroke={SUPPORT}
          strokeWidth="1.1"
          opacity="0.8"
        />
        <circle cx={FEAS.x} cy={FEAS.y} r="2.4" fill={SUPPORT} />

        {/* "H increases inward" arrow, pointing toward the centroid */}
        <g color="currentColor" opacity="0.6">
          <line
            x1={182}
            y1={368}
            x2={258}
            y2={322}
            stroke="currentColor"
            strokeWidth="1.3"
            markerEnd="url(#fss-arrow)"
          />
        </g>
      </svg>

      {/* vertex point masses (KaTeX) */}
      <Label x={330} y={26} w={90} align="center">
        <M tex={String.raw`(0,0,1)`} size={13.5} />
      </Label>
      <Label x={78} y={412} w={90} align="center">
        <M tex={String.raw`(1,0,0)`} size={13.5} />
      </Label>
      <Label x={538} y={420} w={90} align="center">
        <M tex={String.raw`(0,1,0)`} size={13.5} />
      </Label>

      {/* uniform pmf label under the centroid */}
      <Label x={330} y={356} w={168} align="center">
        <span style={{ opacity: 0.85 }}>
          uniform: <M tex={String.raw`H`} size={13} /> max
        </span>
      </Label>

      {/* H increases inward */}
      <Label x={92} y={382} w={130} align="left">
        <span style={{ opacity: 0.62, fontStyle: "italic" }}>
          <M tex={String.raw`H`} size={12.5} /> increases inward
        </span>
      </Label>

      {/* the constraint hyperplane (blue) */}
      <div
        style={{
          position: "absolute",
          left: 40,
          top: 62,
          width: 210,
          color: SUPPORT,
          lineHeight: 1.45,
        }}
      >
        <div style={{ fontWeight: 600 }}>
          constraint <M tex={String.raw`\langle f \rangle = \alpha`} size={13} />
        </div>
        <div style={{ fontSize: 12.5, opacity: 0.9 }}>a hyperplane</div>
      </div>
      {/* short blue leader from the label to the dashed hyperplane */}
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
        aria-hidden="true"
      >
        <line
          x1={168}
          y1={98}
          x2={A_EXT.x - 2}
          y2={A_EXT.y + 2}
          stroke={SUPPORT}
          strokeWidth="1.1"
          opacity="0.7"
        />
      </svg>

      {/* feasible-set gloss (blue) */}
      <Label x={532} y={293} w={150} align="left">
        <span style={{ color: SUPPORT, fontWeight: 600 }}>feasible set</span>
      </Label>

      {/* p* annotation (amber) */}
      <Label x={396} y={218} w={30} align="left">
        <M tex={String.raw`\textcolor{${ACCENT}}{p^{\ast}}`} size={14} />
      </Label>
      <div
        style={{
          position: "absolute",
          left: 548,
          top: 150,
          width: 138,
          color: ACCENT,
          lineHeight: 1.4,
        }}
      >
        <div style={{ fontWeight: 600 }}>max-entropy point</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          highest contour that meets the constraint
        </div>
      </div>

      {/* color-matched legend */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 456,
          width: W,
          display: "flex",
          gap: 26,
          justifyContent: "center",
          fontSize: 12.5,
        }}
      >
        <LegendItem color={SUPPORT} label="constraint / feasible set" />
        <LegendItem
          color={ACCENT}
          label="max-entropy solution"
          math={String.raw`\textcolor{${ACCENT}}{p^{\ast}}`}
        />
      </div>
    </div>
  );
}

function Label({
  x,
  y,
  w,
  align,
  children,
}: {
  x: number;
  y: number;
  w: number;
  align: "left" | "center";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - w / 2 : x,
        top: y,
        width: w,
        textAlign: align,
      }}
    >
      {children}
    </div>
  );
}

function LegendItem({
  color,
  label,
  math,
}: {
  color: string;
  label: string;
  math?: string;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span
        style={{
          width: 20,
          height: 3,
          borderRadius: 2,
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ opacity: 0.85 }}>
        {label}
        {math ? (
          <>
            {" "}
            <M tex={math} size={12.5} />
          </>
        ) : null}
      </span>
    </span>
  );
}
