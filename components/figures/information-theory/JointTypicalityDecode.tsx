import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * JointTypicalityDecode — why joint-typicality decoding works below capacity.
 *
 * FigureSequence, 4 frames. The outer rounded rectangle (currentColor) is the
 * space of typical inputs, ≈2^{nH(X)}. A dashed amber blob inside is the set of
 * inputs jointly typical with the received y^n, ≈2^{nH(X|Y)} — a small fraction
 * of the space.
 *
 *   Frame 1: only the true codeword x^n(w), an amber dot inside the blob.
 *   Frame 2: add one blue wrong codeword, far outside the blob.
 *   Frame 3: the full 2^{nR} codebook — many blue dots scattered outside, one
 *            grazing the boundary; union bound 2^{nR}·2^{-nI} = 2^{-n(I-R)}.
 *   Frame 4: larger n shrinks the blob, every wrong codeword now clear of it;
 *            conclusion boxed in amber, R < C ⇒ error → 0.
 *
 * Color roles: amber = the received output's typicality region + true codeword,
 * blue = wrong codewords, currentColor = the sequence space. One element
 * changes per frame. After MacKay, ITILA ch. 10 (recreated, not copied).
 */

const W = 640;
const HGT = 430;

// outer frame = typical inputs
const FX = 30;
const FY = 34;
const FW = 580;
const FH = 300; // bottom at 334

// amber blob (jointly typical with y^n)
const BCX = 300;
const BCY = 168;
const BIG = { rx: 100, ry: 64 };
const SMALL = { rx: 66, ry: 42 };

// true codeword (amber), inside the blob
const TRUE = { x: 276, y: 194 };

// frame-2 lone wrong codeword, far outside the blob
const LONE = { x: 128, y: 296 };

// frame-3/4 codebook scatter — all outside the BIG blob, one grazing the top
const SCATTER: Array<[number, number]> = [
  [110, 108],
  [200, 70],
  [400, 66],
  [500, 90],
  [565, 128],
  [575, 210],
  [540, 296],
  [430, 314],
  [320, 316],
  [200, 312],
  [128, 296], // = LONE, carried over from frame 2
  [70, 200],
  [75, 128],
  [500, 150],
  [300, 100], // grazes the blob boundary (top)
];

const AMBER_TEX = (s: string) => String.raw`\textcolor{${ACCENT}}{${s}}`;
const BLUE_TEX = (s: string) => String.raw`\textcolor{${SUPPORT}}{${s}}`;

function Blob({ rx, ry }: { rx: number; ry: number }) {
  return (
    <ellipse
      cx={BCX}
      cy={BCY}
      rx={rx}
      ry={ry}
      fill={ACCENT}
      fillOpacity="0.13"
      stroke={ACCENT}
      strokeWidth="1.6"
      strokeDasharray="5 4"
    />
  );
}

export default function JointTypicalityDecode({ frame = 1 }: { frame?: number }) {
  const showTrue = true; // the sent codeword is present in every frame
  const showLone = frame === 2;
  const showScatter = frame >= 3;
  const blob = frame >= 4 ? SMALL : BIG;

  return (
    <div
      style={{
        position: "relative",
        width: W,
        height: HGT,
        fontFamily: "system-ui, sans-serif",
        fontSize: 13,
      }}
    >
      <svg width={W} height={HGT} viewBox={`0 0 ${W} ${HGT}`} aria-hidden="true">
        {/* outer frame: the space of typical inputs */}
        <rect
          x={FX}
          y={FY}
          width={FW}
          height={FH}
          rx="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />

        {/* amber blob: inputs jointly typical with the received y^n */}
        <Blob rx={blob.rx} ry={blob.ry} />

        {/* the 2^{nR} codebook (frames 3–4): blue wrong codewords */}
        {showScatter &&
          SCATTER.map(([x, y], i) => (
            <circle key={`s${i}`} cx={x} cy={y} r="3.6" fill={SUPPORT} />
          ))}

        {/* frame-2 lone wrong codeword */}
        {showLone && (
          <>
            <circle cx={LONE.x} cy={LONE.y} r="4.5" fill={SUPPORT} />
            <line
              x1={LONE.x}
              y1={LONE.y - 4.5}
              x2={LONE.x + 18}
              y2={LONE.y - 26}
              stroke={SUPPORT}
              strokeWidth="1.1"
              opacity="0.75"
            />
          </>
        )}

        {/* the true (sent) codeword, inside the blob */}
        {showTrue && <circle cx={TRUE.x} cy={TRUE.y} r="5" fill={ACCENT} />}
      </svg>

      {/* outer-frame label: size of the typical-input space */}
      <div style={{ position: "absolute", left: FX + 14, top: FY + 8 }}>
        <span style={{ opacity: 0.7 }}>typical inputs:&nbsp;</span>
        <M tex={String.raw`\approx 2^{nH(X)}`} size={13} />
      </div>

      {/* blob region label, inside the blob's upper interior. The wordy two-line
          form fits the large blob (frames 1–3); frame 4's shrunken blob keeps
          only the compact size formula so the dashed boundary stays clear. */}
      {frame < 4 ? (
        <div
          style={{
            position: "absolute",
            left: BCX,
            top: BCY - 30,
            transform: "translateX(-50%)",
            width: 190,
            textAlign: "center",
            lineHeight: 1.3,
            color: ACCENT,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600 }}>
            jointly typical with&nbsp;
            <M tex={String.raw`y^n`} size={11.5} color={ACCENT} />
          </div>
          <M tex={String.raw`\approx 2^{nH(X\mid Y)}`} size={12} color={ACCENT} />
        </div>
      ) : (
        <div
          style={{
            position: "absolute",
            left: BCX,
            top: BCY - 24,
            transform: "translateX(-50%)",
            textAlign: "center",
            color: ACCENT,
          }}
        >
          <M tex={String.raw`\approx 2^{nH(X\mid Y)}`} size={11.5} color={ACCENT} />
        </div>
      )}

      {/* true-codeword dot label (inside blob, next to the amber dot) */}
      <div
        style={{
          position: "absolute",
          left: TRUE.x + 9,
          top: TRUE.y - 9,
        }}
      >
        <M tex={AMBER_TEX(String.raw`x^n(w)`)} size={12.5} />
      </div>

      {/* frame-2 lone wrong-codeword label */}
      {showLone && (
        <div
          style={{
            position: "absolute",
            left: LONE.x + 22,
            top: LONE.y - 44,
            color: SUPPORT,
            fontSize: 11.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          wrong codeword
        </div>
      )}

      {/* frame-3 codebook label */}
      {frame === 3 && (
        <div
          style={{
            position: "absolute",
            left: 470,
            top: 320,
            color: SUPPORT,
            fontSize: 11.5,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          <M tex={BLUE_TEX(String.raw`2^{nR}`)} size={12} /> codewords
        </div>
      )}

      {/* caption slot under the rectangle */}
      <div
        style={{
          position: "absolute",
          left: FX,
          top: FY + FH + 20,
          width: FW,
          minHeight: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        {frame === 1 && (
          <span style={{ opacity: 0.75, fontSize: 12.5 }}>
            the sent codeword is jointly typical with the output w.h.p.
          </span>
        )}
        {frame === 2 && (
          <span style={{ fontSize: 12.5 }}>
            <span style={{ opacity: 0.75 }}>
              an independent codeword hits the blob with probability&nbsp;
            </span>
            <M tex={String.raw`\approx 2^{-nI(X;Y)}`} size={13} />
          </span>
        )}
        {frame === 3 && (
          <span style={{ fontSize: 13 }}>
            <span style={{ opacity: 0.65, fontStyle: "italic", fontSize: 12 }}>
              union bound:&nbsp;&nbsp;
            </span>
            <M
              tex={String.raw`\underbrace{${BLUE_TEX("2^{nR}")}}_{\text{codewords}}\cdot\, 2^{-nI} \;=\; 2^{-n(I-R)}`}
              size={14}
            />
          </span>
        )}
        {frame === 4 && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              border: `1.8px solid ${ACCENT}`,
              borderRadius: 8,
              padding: "8px 18px",
            }}
          >
            <M
              tex={String.raw`${AMBER_TEX("R < C")}:\quad P_{\text{err}} \to 0`}
              size={15}
            />
          </span>
        )}
      </div>
    </div>
  );
}
