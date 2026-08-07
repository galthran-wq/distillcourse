import { Fragment } from "react";
import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * SpamPosteriorSteps — the full naive-Bayes spam computation on one shared
 * two-panel layout, run as a FigureSequence of 4 frames (FIGURE PLAN item 2).
 * Left panel is the SPAM class (amber), right panel the HAM class (blue);
 * the panels stay put while one region changes per frame:
 *
 *   1  the six-message corpus (token lists, labelled) and the two 1/2 priors
 *   2  the corpus collapses into count tables; each count / class total (9, 7)
 *      becomes a phi table — the binding win: 3 -> 3/9 is highlighted
 *   3  test message "win money now": under each class the product is assembled
 *      factor by factor, every factor color-linked to its phi cell
 *   4  normalization bar (amber 0.738 / blue 0.262) + boxed SPAM verdict
 *
 * Tables are geometry-identical across frames 2-4; only the highlight overlay
 * and the bottom band change. After Ng CS229 §2 / naive-Bayes worked example,
 * recreated in house style.
 */

type Cfg = {
  key: string;
  label: string;
  color: string;
  bg: string;
  border: string;
  cell: string;
  priorTex: string;
  total: number;
  messages: string[][];
  rows: [string, number][];
  product: string; // colored product tex, ends in "= score"
};

const SPAM: Cfg = {
  key: "spam",
  label: "SPAM",
  color: ACCENT,
  bg: "rgba(226,144,58,0.09)",
  border: "rgba(226,144,58,0.45)",
  cell: "rgba(226,144,58,0.22)",
  priorTex: String.raw`p(\text{spam})=\tfrac12`,
  total: 9,
  messages: [
    ["win", "money", "prize"],
    ["win", "prize", "now"],
    ["win", "money", "now"],
  ],
  rows: [
    ["win", 3],
    ["money", 2],
    ["prize", 2],
    ["now", 2],
  ],
  product: String.raw`\textcolor{${ACCENT}}{\tfrac12\cdot\tfrac{3}{9}\cdot\tfrac{2}{9}\cdot\tfrac{2}{9}=0.00823}`,
};

const HAM: Cfg = {
  key: "ham",
  label: "HAM",
  color: SUPPORT,
  bg: "rgba(76,141,214,0.09)",
  border: "rgba(76,141,214,0.45)",
  cell: "rgba(76,141,214,0.22)",
  priorTex: String.raw`p(\text{ham})=\tfrac12`,
  total: 7,
  messages: [
    ["meeting", "report", "now"],
    ["meeting", "win"],
    ["money", "now"],
  ],
  rows: [
    ["meeting", 2],
    ["report", 1],
    ["now", 2],
    ["win", 1],
    ["money", 1],
  ],
  product: String.raw`\textcolor{${SUPPORT}}{\tfrac12\cdot\tfrac{1}{7}\cdot\tfrac{1}{7}\cdot\tfrac{2}{7}=0.00292}`,
};

const TEST = ["win", "money", "now"];

// fraction tex per (class,word), for the phi column
const PHI: Record<string, string> = {
  "spam:win": String.raw`\tfrac{3}{9}`,
  "spam:money": String.raw`\tfrac{2}{9}`,
  "spam:prize": String.raw`\tfrac{2}{9}`,
  "spam:now": String.raw`\tfrac{2}{9}`,
  "ham:meeting": String.raw`\tfrac{2}{7}`,
  "ham:report": String.raw`\tfrac{1}{7}`,
  "ham:now": String.raw`\tfrac{2}{7}`,
  "ham:win": String.raw`\tfrac{1}{7}`,
  "ham:money": String.raw`\tfrac{1}{7}`,
};

const hairline = "1px solid rgba(128,128,128,0.3)";

const TITLES: Record<number, string> = {
  1: "The corpus: six labelled messages",
  2: "Counts become probabilities",
  3: "Score the test message, factor by factor",
  4: "Normalize to a posterior",
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
      step {n} / 4
    </span>
  );
}

function Token({
  word,
  color,
  muted = false,
}: {
  word: string;
  color: string;
  muted?: boolean;
}) {
  return (
    <span
      style={{
        border: `1.2px solid ${muted ? "rgba(128,128,128,0.5)" : color}`,
        borderRadius: 5,
        padding: "1px 7px",
        fontSize: 12.5,
        whiteSpace: "nowrap",
      }}
    >
      {word}
    </span>
  );
}

function MessageList({ cfg }: { cfg: Cfg }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {cfg.messages.map((m, i) => (
        <div
          key={i}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <span style={{ fontSize: 11, opacity: 0.45, width: 12 }}>
            {i + 1}
          </span>
          {m.map((w, j) => (
            <Token key={j} word={w} color={cfg.color} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PhiTable({ cfg, frame }: { cfg: Cfg; frame: number }) {
  const headCell: React.CSSProperties = {
    fontSize: 11.5,
    opacity: 0.55,
    paddingBottom: 6,
    borderBottom: hairline,
  };
  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 34px 18px auto",
          columnGap: 9,
          rowGap: 5,
          alignItems: "center",
        }}
      >
        <div style={headCell}>word</div>
        <div style={{ ...headCell, textAlign: "center" }}>count</div>
        <div style={headCell} />
        <div style={{ ...headCell, textAlign: "center" }}>
          <M tex={String.raw`\varphi`} size={12} />
        </div>

        {cfg.rows.map(([word, count]) => {
          const bound = frame === 2 && cfg.key === "spam" && word === "win";
          const linked = frame >= 3 && TEST.includes(word);
          const hi = bound || linked;
          const phiCell: React.CSSProperties = {
            textAlign: "center",
            borderRadius: 5,
            padding: "1px 5px",
            background: hi ? cfg.cell : "transparent",
            border: bound
              ? `1.4px solid ${cfg.color}`
              : "1.4px solid transparent",
          };
          return (
            <Fragment key={word}>
              <div>
                <Token word={word} color={cfg.color} />
              </div>
              <div
                style={{
                  textAlign: "center",
                  fontWeight: 600,
                  fontVariantNumeric: "tabular-nums",
                  color: hi ? cfg.color : undefined,
                }}
              >
                {count}
              </div>
              <div style={{ textAlign: "center", opacity: 0.4 }}>→</div>
              <div style={phiCell}>
                <M tex={PHI[`${cfg.key}:${word}`]} size={14} />
              </div>
            </Fragment>
          );
        })}
      </div>
      <div style={{ marginTop: 8, fontSize: 11.5, opacity: 0.55 }}>
        class total = {cfg.total} tokens
      </div>
    </div>
  );
}

function Panel({ cfg, frame }: { cfg: Cfg; frame: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: cfg.bg,
        border: `1.4px solid ${cfg.border}`,
        borderRadius: 10,
        padding: "12px 14px 14px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            letterSpacing: "0.06em",
            color: cfg.color,
            border: `1.4px solid ${cfg.color}`,
            borderRadius: 6,
            padding: "1px 8px",
          }}
        >
          {cfg.label}
        </span>
        <M tex={cfg.priorTex} size={13} />
      </div>
      {frame === 1 ? (
        <MessageList cfg={cfg} />
      ) : (
        <PhiTable cfg={cfg} frame={frame} />
      )}
    </div>
  );
}

function ClassTag({ cfg }: { cfg: Cfg }) {
  return (
    <span
      style={{
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: "0.05em",
        color: cfg.color,
        whiteSpace: "nowrap",
        width: 46,
      }}
    >
      {cfg.label}
    </span>
  );
}

function BottomBand({ frame }: { frame: number }) {
  if (frame < 3) return null;
  return (
    <div
      style={{
        marginTop: 16,
        paddingTop: 14,
        borderTop: hairline,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      {/* test message — persists in frames 3 and 4 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 12.5, opacity: 0.6 }}>test message</span>
        {TEST.map((w) => (
          <Token key={w} word={w} color="" muted />
        ))}
      </div>

      {frame === 3 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          {[SPAM, HAM].map((cfg) => (
            <div
              key={cfg.key}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <ClassTag cfg={cfg} />
              <M
                tex={String.raw`p(\text{${cfg.key}}\mid x)\;\propto\;${cfg.product}`}
                size={16}
              />
            </div>
          ))}
        </div>
      ) : (
        <Frame4 />
      )}
    </div>
  );
}

function Frame4() {
  const amber = ACCENT;
  const blue = SUPPORT;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}
    >
      <M
        tex={String.raw`p(\text{spam}\mid x)=\dfrac{\textcolor{${amber}}{0.00823}}{\textcolor{${amber}}{0.00823}+\textcolor{${blue}}{0.00292}}=\textcolor{${amber}}{0.738}`}
        display
        size={17}
      />

      {/* posterior bar */}
      <div style={{ width: 520 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11.5,
            marginBottom: 4,
          }}
        >
          <span style={{ color: amber, fontWeight: 600 }}>spam</span>
          <span style={{ color: blue, fontWeight: 600 }}>ham</span>
        </div>
        <div
          style={{
            display: "flex",
            height: 34,
            borderRadius: 6,
            overflow: "hidden",
            border: "1px solid rgba(128,128,128,0.35)",
          }}
        >
          <div
            style={{
              flex: 0.738,
              background: amber,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            0.738
          </div>
          <div
            style={{
              flex: 0.262,
              background: blue,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            0.262
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: `2px solid ${amber}`,
          borderRadius: 8,
          padding: "6px 18px",
        }}
      >
        <span style={{ fontSize: 11.5, opacity: 0.6, letterSpacing: "0.05em" }}>
          VERDICT
        </span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "0.08em",
            color: amber,
          }}
        >
          SPAM
        </span>
      </div>
    </div>
  );
}

export default function SpamPosteriorSteps({ frame = 1 }: { frame?: number }) {
  return (
    <div
      style={{
        width: 720,
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        boxSizing: "border-box",
        padding: "4px 8px",
      }}
    >
      {/* chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <Badge n={frame} />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{TITLES[frame]}</span>
      </div>

      {/* two class panels */}
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <Panel cfg={SPAM} frame={frame} />
        <Panel cfg={HAM} frame={frame} />
      </div>

      {/* binding annotation — frame 2 only */}
      {frame === 2 && (
        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 12.5,
            fontStyle: "italic",
            opacity: 0.65,
          }}
        >
          each count ÷ class total → <M tex={String.raw`\varphi`} size={12.5} />
          {"  "}·{"  "}
          <M tex={String.raw`\text{win}: 3 \to \tfrac{3}{9}`} size={13} />
        </div>
      )}

      <BottomBand frame={frame} />
    </div>
  );
}
