import { ACCENT } from "../palette";
import {
  CLUSTERS,
  EDGES,
  MODULES,
  THESES,
  type Grade,
  type Postulate,
  type Thesis,
  type Verdict,
} from "./DoctrineDerivationMap.data";

/**
 * DoctrineDerivationMap — the-doctrine's primary figure: what rests on what.
 * Three columns read left to right as the derivation runs: the verdicts the
 * course reached, grouped by module; the seventeen postulates in their five
 * clusters, with the two common-ground aims of §0 beneath them; the nine
 * theses. Lines are "rests on", drawn from the one EDGES table.
 *
 * The brief draws the three as bands top to bottom. The figure is composed
 * for the 42rem lesson column, where seventeen labelled postulates cannot
 * share one row; as columns every label is set in full and horizontal.
 *
 * Selection is hook-free: every node is a radio in one group (so arrow keys
 * step through it), and `:has(:checked)` rules generated from the edge table
 * dim what the selection does not touch and show its panel. T2 is checked on
 * arrival.
 *
 * Color roles: currentColor for everything; amber only for the selection and
 * the lines it lights. Grades are glyphs, never colour.
 */

// ── geometry ─────────────────────────────────────────────────────────────
const W = 672;
const HEAD = 24;
const V_W = 210;
const P_X = 252;
const P_W = 198;
const T_X = 494;
const T_W = W - T_X;
const ROW = 15;
const GROUP_GAP = 6;
const P_H = 42;
const CL_H = 15;
const T_H = 50;

const DIM = 0.28;
const EDGE = "currentColor";
const FRAME = "var(--frame, #8a9099)";
const PAPER = "var(--paper, #fff)";
const ACCENT_FILL = `color-mix(in srgb, ${ACCENT} 14%, var(--paper, #fff))`;

interface Placed {
  id: string;
  y: number; // centre
}

const vPlaced: (Verdict & Placed & { n: number; first: boolean; top: number })[] = [];
{
  let top = HEAD;
  MODULES.forEach((m, mi) => {
    if (mi > 0) top += GROUP_GAP;
    m.verdicts.forEach((v, i) => {
      vPlaced.push({ ...v, n: m.n, first: i === 0, top, y: top + ROW / 2 });
      top += ROW;
    });
  });
}
const H = vPlaced[vPlaced.length - 1].top + ROW + 4;

// Postulates spread evenly down the same height, each cluster under its head.
const pPlaced: (Postulate & Placed & { top: number; head?: string })[] = [];
{
  const count = CLUSTERS.reduce((s, c) => s + c.postulates.length, 0);
  const gaps = count - 1;
  const gap = (H - HEAD - count * P_H - CLUSTERS.length * CL_H) / gaps;
  let top = HEAD;
  CLUSTERS.forEach((c, ci) => {
    c.postulates.forEach((p, i) => {
      if (i === 0) top += CL_H;
      pPlaced.push({ ...p, top, y: top + P_H / 2, head: i === 0 ? c.label : undefined });
      top += P_H + gap;
      void ci;
    });
  });
}

const tPlaced: (Thesis & Placed & { top: number })[] = [];
{
  const gap = (H - HEAD - THESES.length * T_H) / (THESES.length - 1);
  THESES.forEach((t, i) => {
    const top = HEAD + i * (T_H + gap);
    tPlaced.push({ ...t, top, y: top + T_H / 2 });
  });
}

const yOf = new Map<string, number>([
  ...vPlaced.map((n) => [n.id, n.y] as const),
  ...pPlaced.map((n) => [n.id, n.y] as const),
  ...tPlaced.map((n) => [n.id, n.y] as const),
]);

// ── the relation: what each selection lights ─────────────────────────────
const column = new Map<string, "v" | "p" | "t">([
  ...vPlaced.map((n) => [n.id, "v"] as const),
  ...pPlaced.map((n) => [n.id, "p"] as const),
  ...tPlaced.map((n) => [n.id, "t"] as const),
]);
for (const [a, b] of EDGES)
  if (!column.has(a) || !column.has(b)) throw new Error(`DoctrineDerivationMap: edge ${a} → ${b} names no node`);

type Edge = { from: string; to: string; x1: number; x2: number; direct: boolean };
const edges: Edge[] = EDGES.map(([from, to]) => {
  if (column.get(from) === "p") return { from, to, x1: P_X + P_W, x2: T_X, direct: false };
  const direct = column.get(to) === "t";
  return { from, to, x1: V_W, x2: direct ? T_X : P_X, direct };
});

const onto = (id: string) => EDGES.filter(([, b]) => b === id).map(([a]) => a);
const outOf = (id: string) => EDGES.filter(([a]) => a === id).map(([, b]) => b);
const isPremise = (id: string) => column.get(id) === "p";
const thesesOn = outOf;
const premisesOf = (t: string) => onto(t).filter(isPremise);

/** Every node a selection keeps lit, the selection included. */
const lit = new Map<string, Set<string>>();
for (const t of tPlaced) {
  const s = new Set([t.id, ...onto(t.id)]);
  for (const p of premisesOf(t.id)) onto(p).forEach((v) => s.add(v));
  lit.set(t.id, s);
}
for (const p of pPlaced) lit.set(p.id, new Set([p.id, ...outOf(p.id), ...onto(p.id)]));
for (const v of vPlaced) {
  const s = new Set([v.id, ...outOf(v.id)]);
  for (const g of outOf(v.id)) if (isPremise(g)) outOf(g).forEach((t) => s.add(t));
  lit.set(v.id, s);
}

/** An edge is lit when both its ends are, and it lies on the selection's path. */
function edgeLitBy(e: Edge): string[] {
  const out: string[] = [];
  for (const [sel, s] of lit) {
    if (!s.has(e.from) || !s.has(e.to)) continue;
    // A postulate lights only its own lines: a verdict that grounds it and
    // also a thesis on it directly is a second path, not this one.
    if (isPremise(sel) && e.from !== sel && e.to !== sel) continue;
    out.push(sel);
  }
  return out;
}

const rClass = (ids: Iterable<string>) => [...ids].map((i) => `ddm-r-${i}`).join(" ");
const nodeLitBy = (id: string) => [...lit].filter(([, s]) => s.has(id)).map(([sel]) => sel);

const CSS = [
  ".ddm-in{position:absolute;opacity:0;width:1px;height:1px;margin:0;pointer-events:none}",
  ".ddm-n{cursor:pointer}",
  ".ddm-box>*{transition:opacity var(--motion-fast,120ms)}",
  ".ddm-e{transition:opacity var(--motion-fast,120ms)}",
  ".ddm-pn{display:none}",
  `.ddm-n:has(.ddm-in:checked) .ddm-box{border-color:${ACCENT};background:${ACCENT_FILL}}`,
  `.ddm-n:has(.ddm-in:focus-visible){outline:2px solid ${ACCENT};outline-offset:1px}`,
  ...[...lit.keys()].flatMap((id) => {
    const on = `.ddm:has(#ddm-${id}:checked)`;
    return [
      // The box keeps its paper fill so lines stay behind it; only ink dims.
      `${on} .ddm-n:not(.ddm-r-${id}) .ddm-box>*{opacity:${DIM}}`,
      `${on} .ddm-n:not(.ddm-r-${id}) .ddm-box{border-color:color-mix(in srgb, ${FRAME} 45%, transparent)}`,
      `${on} .ddm-n.ddm-r-${id} .ddm-box{border-color:currentColor}`,
      `${on} .ddm-e:not(.ddm-r-${id}){opacity:0.05}`,
      `${on} .ddm-e.ddm-r-${id}{stroke:${ACCENT};stroke-width:1.4;opacity:1}`,
      `${on} .ddm-pn-${id}{display:block}`,
    ];
  }),
].join("\n");

// ── pieces ───────────────────────────────────────────────────────────────
function GradeMark({ grade, size = 9 }: { grade: Grade; size?: number }) {
  const c = "currentColor";
  const s = size;
  const r = s / 2 - 0.75;
  let shape: React.ReactNode;
  if (grade === "established")
    shape = <rect x={0.75} y={0.75} width={s - 1.5} height={s - 1.5} fill={c} stroke={c} strokeWidth={1} />;
  else if (grade === "strong") shape = <circle cx={s / 2} cy={s / 2} r={r} fill={c} stroke={c} strokeWidth={1} />;
  else if (grade === "on balance")
    shape = (
      <>
        <path d={`M${s / 2} ${s / 2 - r} A${r} ${r} 0 0 0 ${s / 2} ${s / 2 + r} Z`} fill={c} />
        <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={c} strokeWidth={1} />
      </>
    );
  else if (grade === "open") shape = <circle cx={s / 2} cy={s / 2} r={r} fill="none" stroke={c} strokeWidth={1} />;
  else
    shape = (
      <path
        d={`M${s / 2} 0.6 L${s - 0.6} ${s / 2} L${s / 2} ${s - 0.6} L0.6 ${s / 2} Z`}
        fill="none"
        stroke={c}
        strokeWidth={1}
      />
    );
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ flex: "none", display: "block" }} aria-hidden>
      {shape}
    </svg>
  );
}

const GRADES: Grade[] = ["established", "strong", "on balance", "open", "argued"];

function Node({
  id,
  label,
  style,
  children,
}: {
  id: string;
  label: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <label className={`ddm-n ${rClass(nodeLitBy(id))}`} style={{ position: "absolute", ...style }}>
      <input
        className="ddm-in"
        type="radio"
        name="ddm-select"
        id={`ddm-${id}`}
        defaultChecked={id === "T2"}
        aria-label={label}
      />
      {children}
    </label>
  );
}

const colHead: React.CSSProperties = {
  position: "absolute",
  top: 0,
  fontSize: 11,
  fontVariant: "all-small-caps",
  letterSpacing: "0.06em",
  fontWeight: 600,
  opacity: 0.7,
};

const boxBase: React.CSSProperties = {
  boxSizing: "border-box",
  height: "100%",
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "0 7px",
  borderRadius: 3,
  background: PAPER,
  lineHeight: 1.15,
};

function codeOf(id: string) {
  return <span style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums", flex: "none" }}>{id}</span>;
}

function Panel({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className={`ddm-pn ddm-pn-${id}`} aria-live="polite">
      {children}
    </div>
  );
}

const pnHead: React.CSSProperties = { display: "flex", alignItems: "center", gap: 7, fontSize: 13, marginBottom: 4 };
const pnKey: React.CSSProperties = { fontVariant: "all-small-caps", letterSpacing: "0.05em", fontWeight: 600, opacity: 0.7 };
const pnLine: React.CSSProperties = { margin: "3px 0 0" };

function Head({ kind, id, grade }: { kind: string; id: string; grade: Grade }) {
  return (
    <div style={pnHead}>
      <span style={{ fontWeight: 700 }}>
        {kind} {id.replace(/^[PTA]/, "")}
      </span>
      <GradeMark grade={grade} size={10} />
      <span style={{ opacity: 0.75 }}>{grade}</span>
    </div>
  );
}

const labelOf = new Map<string, string>([
  ...vPlaced.map((v) => [v.id, v.label] as const),
  ...pPlaced.map((p) => [p.id, p.short] as const),
  ...tPlaced.map((t) => [t.id, t.short] as const),
]);

// A reader who has not met the numbering reads the panel, so every node it
// names carries its words, one per line, never a bare run of codes.
function Named({ ids }: { ids: string[] }) {
  return (
    <ul style={{ margin: "2px 0 0", padding: 0, listStyle: "none" }}>
      {ids.map((id) => (
        <li key={id}>
          {column.get(id) !== "v" && <span style={{ fontWeight: 700, marginRight: 6 }}>{id}</span>}
          {labelOf.get(id)}
        </li>
      ))}
    </ul>
  );
}

const lessonHref = (slug: string) => `/courses/political-philosophy/lessons/${slug}`;

// ── figure ───────────────────────────────────────────────────────────────
export default function DoctrineDerivationMap() {
  return (
    <div className="ddm" style={{ fontFamily: "system-ui, sans-serif", fontSize: 11, lineHeight: 1.3 }}>
      <style>{CSS}</style>
      <div style={{ overflowX: "auto", contain: "inline-size" }}>
        <div style={{ position: "relative", width: W, height: H, margin: "0 auto" }}>
          <div style={{ ...colHead, left: 0 }}>Verdicts, by module</div>
          <div style={{ ...colHead, left: P_X }}>Postulates</div>
          <div style={{ ...colHead, left: T_X }}>Theses</div>

          <svg
            width={W}
            height={H}
            viewBox={`0 0 ${W} ${H}`}
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
            aria-hidden
          >
            {edges.map((e) => {
              const y1 = yOf.get(e.from)!;
              const y2 = yOf.get(e.to)!;
              const mx1 = e.direct ? e.x1 + 40 : (e.x1 + e.x2) / 2;
              const mx2 = e.direct ? e.x2 - 40 : (e.x1 + e.x2) / 2;
              return (
                <path
                  key={`${e.from}-${e.to}`}
                  className={`ddm-e ${rClass(edgeLitBy(e))}`}
                  d={`M${e.x1} ${y1} C${mx1} ${y1} ${mx2} ${y2} ${e.x2} ${y2}`}
                  fill="none"
                  stroke={EDGE}
                  strokeWidth={0.7}
                  strokeDasharray={e.direct ? "3 2.5" : undefined}
                  opacity={0.22}
                />
              );
            })}
          </svg>

          {/* verdicts */}
          {vPlaced.map((v) => (
            <Node key={v.id} id={v.id} label={`Verdict: ${v.label}, ${v.grade}`} style={{ left: 0, top: v.top, width: V_W, height: ROW }}>
              <span className="ddm-box" style={{ ...boxBase, padding: "0 3px 0 0", gap: 4, border: "1px solid transparent", fontSize: 10.5, whiteSpace: "nowrap" }}>
                <span style={{ width: 13, flex: "none", textAlign: "right", opacity: 0.55, fontVariantNumeric: "tabular-nums" }}>
                  {v.first ? v.n : ""}
                </span>
                <GradeMark grade={v.grade} size={8} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{v.label}</span>
              </span>
            </Node>
          ))}

          {/* postulates */}
          {pPlaced.map((p) => (
            <div key={p.id}>
              {p.head !== undefined && (
                <div style={{ ...colHead, top: p.top - CL_H, left: P_X + 1, fontSize: 10, opacity: 0.55 }}>{p.head}</div>
              )}
              <Node id={p.id} label={`${p.id}: ${p.statement} ${p.grade}`} style={{ left: P_X, top: p.top, width: P_W, height: P_H }}>
                <span
                  className="ddm-box"
                  style={{ ...boxBase, border: `1px ${thesesOn(p.id).length > 0 ? "solid" : "dashed"} ${FRAME}` }}
                >
                  <GradeMark grade={p.grade} />
                  {codeOf(p.id)}
                  <span>{p.short}</span>
                </span>
              </Node>
            </div>
          ))}

          {/* theses */}
          {tPlaced.map((t) => (
            <Node key={t.id} id={t.id} label={`${t.id}: ${t.statement} ${t.grade}`} style={{ left: T_X, top: t.top, width: T_W, height: T_H }}>
              <span className="ddm-box" style={{ ...boxBase, border: `1.5px solid ${FRAME}`, fontSize: 11.5 }}>
                <GradeMark grade={t.grade} />
                {codeOf(t.id)}
                <span>{t.short}</span>
              </span>
            </Node>
          ))}
        </div>
      </div>

      {/* legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          columnGap: 16,
          rowGap: 4,
          marginTop: 12,
          fontSize: 11,
          opacity: 0.85,
        }}
      >
        {GRADES.map((g) => (
          <span key={g} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <GradeMark grade={g} />
            {g}
          </span>
        ))}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <svg width={22} height={6} aria-hidden>
            <line x1={0} y1={3} x2={22} y2={3} stroke="currentColor" strokeWidth={1} strokeDasharray="3 2.5" />
          </svg>
          a verdict grounding a thesis directly
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 18, height: 9, border: `1px dashed ${FRAME}`, borderRadius: 2 }} />
          background: no thesis rests on it
        </span>
      </div>

      {/* panel */}
      <div
        style={{
          maxWidth: W,
          margin: "14px auto 0",
          paddingTop: 10,
          paddingBottom: 10,
          // The map is taller than a screen: the panel stays pinned to the
          // bottom of the viewport so a selection near the top is read in view.
          position: "sticky",
          bottom: 0,
          background: "var(--paper)",
          borderTop: `1px solid ${FRAME}`,
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {tPlaced.map((t) => (
          <Panel key={t.id} id={t.id}>
            <Head kind="Thesis" id={t.id} grade={t.grade} />
            <p style={{ margin: 0 }}>{t.statement}</p>
            <div style={pnLine}>
              <span style={pnKey}>rests on</span>
              <Named ids={premisesOf(t.id)} />
            </div>
            {onto(t.id).some((x) => !isPremise(x)) && (
              <div style={pnLine}>
                <span style={pnKey}>and directly on the verdicts</span>
                <Named ids={onto(t.id).filter((x) => !isPremise(x))} />
              </div>
            )}
            <p style={pnLine}>
              <span style={pnKey}>weakest premise</span> {t.weakest}
            </p>
          </Panel>
        ))}
        {pPlaced.map((p) => (
          <Panel key={p.id} id={p.id}>
            <Head kind={p.id.startsWith("A") ? "Common aim" : "Postulate"} id={p.id} grade={p.grade} />
            <p style={{ margin: 0 }}>{p.statement}</p>
            <p style={pnLine}>
              <span style={pnKey}>grounds</span> {p.grounds}
            </p>
            <p style={pnLine}>
              <span style={pnKey}>overturned by</span> {p.overturnedBy}
            </p>
            {thesesOn(p.id).length > 0 ? (
              <div style={pnLine}>
                <span style={pnKey}>if overturned, these theses lose a premise</span>
                <Named ids={thesesOn(p.id)} />
              </div>
            ) : (
              <p style={pnLine}>
                <span style={pnKey}>if overturned</span> no thesis loses a premise: it is background, the
                record the others are read against.
              </p>
            )}
          </Panel>
        ))}
        {vPlaced.map((v) => (
          <Panel key={v.id} id={v.id}>
            <div style={pnHead}>
              <span style={{ fontWeight: 700 }}>Verdict: {v.label}</span>
              <GradeMark grade={v.grade} size={10} />
              <span style={{ opacity: 0.75 }}>{v.grade}</span>
            </div>
            <p style={{ margin: 0 }}>
              Reached in the lesson{" "}
              <a href={lessonHref(v.lesson)} style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 2 }}>
                {v.title}
              </a>{" "}
              (module {v.n}).
            </p>
            <div style={pnLine}>
              <span style={pnKey}>supports</span>
              <Named ids={outOf(v.id)} />
            </div>
            {(() => {
              const via = tPlaced.map((t) => t.id).filter((t) => lit.get(v.id)!.has(t) && !outOf(v.id).includes(t));
              return via.length > 0 ? (
                <div style={pnLine}>
                  <span style={pnKey}>and through them the theses</span>
                  <Named ids={via} />
                </div>
              ) : null;
            })()}
          </Panel>
        ))}
      </div>
    </div>
  );
}
