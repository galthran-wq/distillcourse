import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * ZeroCountRepair — the zero-count catastrophe and its Laplace repair, side by
 * side. FIGURE PLAN item 3 for classical-ml-interview/naive-bayes.
 *
 * One idea: a single unseen word ("voucher") sends one factor to 0/9 and 0/7,
 * zeroing BOTH class products and leaving the posterior 0/0 (undefined). Adding
 * one pseudo-count to every word (Laplace, alpha=1) — the ghost-bar / "prior =
 * fake data" motif from mle-map, here as dashed +1 numerator and +7 denominator
 * ghosts — repairs every factor and yields a defined posterior, 0.64 spam.
 *
 * Layout is identical across the two panels; only the ghost pseudo-counts and
 * the resulting numbers change (the render-and-look delta).
 * Color: amber = spam product, blue = ham product (bound in the product tails
 * and the posterior); amber also flags the offending zero. Priors equal (1/2).
 */

const spam = (t: string) => String.raw`\textcolor{${ACCENT}}{${t}}`;
const ham = (t: string) => String.raw`\textcolor{${SUPPORT}}{${t}}`;

// Dashed "ghost" pseudo-count, reused for every +1 numerator and +7 denominator.
const GHOST_STYLE =
  "color:#e2903a;border:1px dashed #e2903a;border-radius:2px;padding:0 2px;margin-left:2px;font-size:0.78em";
const ghost = (t: string) => String.raw`\htmlStyle{${GHOST_STYLE}}{${t}}`;

const WORDS = ["win", "money", "voucher", "now"] as const;
const UNSEEN = "voucher";

// --- raw counts ---------------------------------------------------------
// spam class: total 9 word tokens; ham class: total 7. "voucher" unseen (0,0).
const SPAM_COUNTS = [3, 2, 0, 2];
const HAM_COUNTS = [1, 1, 0, 2];
const SPAM_TOTAL = 9;
const HAM_TOTAL = 7;
const V = 7; // vocabulary size -> denominator ghost is +7

const PRIOR = String.raw`\tfrac{1}{2}\!\cdot\!`;

// A single product line: prior * f1 * f2 * f3 * f4 = value.
function product(
  counts: number[],
  total: number,
  color: (t: string) => string,
  value: string,
  smoothed: boolean,
): string {
  const factors = counts
    .map((c, i) => {
      const zero = c === 0;
      if (!smoothed) {
        const num = zero ? spam(String.raw`\mathbf{0}`) : String(c);
        return String.raw`\frac{${num}}{${total}}`;
      }
      const num = `${c}\\,${ghost("+1")}`;
      const den = `${total}\\,${ghost(`+${V}`)}`;
      return String.raw`\frac{${num}}{${den}}`;
    })
    .join(String.raw`\,\cdot\,`);
  return String.raw`${PRIOR}\,${factors}\,=\,${color(value)}`;
}

function ClassRow({
  label,
  color,
  tex,
}: {
  label: string;
  color: string;
  tex: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }}>
      <span
        style={{
          flex: "0 0 auto",
          width: 52,
          fontSize: 12.5,
          fontWeight: 600,
          color,
        }}
      >
        {label}
      </span>
      <div style={{ overflowX: "auto", whiteSpace: "nowrap" }}>
        <M tex={tex} size={16} />
      </div>
    </div>
  );
}

function Message() {
  return (
    <div style={{ fontSize: 12.5, opacity: 0.7, marginBottom: 14 }}>
      test message:{" "}
      {WORDS.map((w, i) => (
        <span key={w}>
          <span
            style={
              w === UNSEEN
                ? { color: ACCENT, fontWeight: 700 }
                : { fontWeight: 600 }
            }
          >
            {w}
          </span>
          {i < WORDS.length - 1 ? " " : ""}
        </span>
      ))}
      <span style={{ opacity: 0.85 }}>
        {" "}
        (<span style={{ color: ACCENT, fontWeight: 700 }}>voucher</span> never
        seen in training)
      </span>
    </div>
  );
}

const cardBorder = "1px solid rgba(128,128,128,0.35)";

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: "warn" | "spam";
}) {
  const color = tone === "warn" ? ACCENT : ACCENT;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "2px 9px",
        borderRadius: 999,
        border: `1.4px solid ${color}`,
        color,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 0.2,
        whiteSpace: "nowrap",
      }}
    >
      {tone === "warn" ? "⚠" : ""} {text}
    </span>
  );
}

function Panel({
  title,
  spamTex,
  hamTex,
  posteriorTex,
  badge,
}: {
  title: string;
  spamTex: string;
  hamTex: string;
  posteriorTex: string;
  badge: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: cardBorder,
        borderRadius: 10,
        padding: "14px 16px 16px",
        boxSizing: "border-box",
        minWidth: 300,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>{title}</div>
      <Message />
      <ClassRow label="spam" color={ACCENT} tex={spamTex} />
      <ClassRow label="ham" color={SUPPORT} tex={hamTex} />
      <div
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTop: cardBorder,
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <M tex={posteriorTex} size={14} />
        </div>
        {badge}
      </div>
    </div>
  );
}

function Arrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        margin: "4px 0",
      }}
    >
      <svg viewBox="0 0 24 46" width="22" aria-hidden="true">
        <defs>
          <marker
            id="zc-arrowhead"
            markerWidth="9"
            markerHeight="9"
            refX="4.5"
            refY="6.5"
            orient="auto"
          >
            <path d="M0 0 L4.5 9 L9 0 z" fill={ACCENT} />
          </marker>
        </defs>
        <line
          x1="12"
          y1="4"
          x2="12"
          y2="34"
          stroke={ACCENT}
          strokeWidth="3.5"
          markerEnd="url(#zc-arrowhead)"
        />
      </svg>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          lineHeight: 1.35,
          color: ACCENT,
        }}
      >
        Laplace, <M tex="\alpha = 1" size={12.5} color={ACCENT} />: add one fake
        occurrence of every word
      </div>
    </div>
  );
}

export default function ZeroCountRepair() {
  const leftSpam = product(SPAM_COUNTS, SPAM_TOTAL, spam, "0", false);
  const leftHam = product(HAM_COUNTS, HAM_TOTAL, ham, "0", false);
  const rightSpam = product(
    SPAM_COUNTS,
    SPAM_TOTAL,
    spam,
    String.raw`2.7\times 10^{-4}`,
    true,
  );
  const rightHam = product(
    HAM_COUNTS,
    HAM_TOTAL,
    ham,
    String.raw`1.6\times 10^{-4}`,
    true,
  );

  const leftPost = String.raw`P(\text{spam}\mid m)=\dfrac{${spam("0")}}{${spam("0")}+${ham("0")}}=\dfrac{0}{0}`;
  const rightPost = String.raw`P(\text{spam}\mid m)=\dfrac{${spam("2.7")}}{${spam("2.7")}+${ham("1.6")}}=${spam("0.64")}`;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 13, maxWidth: 720 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          gap: 2,
        }}
      >
        <Panel
          title="unsmoothed MLE"
          spamTex={leftSpam}
          hamTex={leftHam}
          posteriorTex={leftPost}
          badge={<Badge text="undefined" tone="warn" />}
        />
        <Arrow />
        <Panel
          title="smoothed"
          spamTex={rightSpam}
          hamTex={rightHam}
          posteriorTex={rightPost}
          badge={<Badge text="spam" tone="spam" />}
        />
      </div>

      <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 14, lineHeight: 1.5 }}>
        priors equal, <M tex={String.raw`P(\text{spam})=P(\text{ham})=\tfrac12`} size={11.5} />;
        denominators carry <M tex="\alpha V = 7" size={11.5} /> ghost counts (one per
        vocabulary word). Dashed boxes are the hallucinated pseudo-counts.
      </div>
    </div>
  );
}
