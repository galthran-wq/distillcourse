import type { Course } from "@/lib/content/schema";

const AMBER = "#e2903a";
const BLUE = "#4c8dd6";

/** Node roles: which spine steps carry the institutions engine (amber) and
 * which are external tests (blue); everything else is currentColor. */
const ENGINE = new Set([2, 5, 7, 10, 13]);
const TESTS = new Set([4, 9, 12]);

interface Box {
  x: number;
  y: number;
  w: number;
}

/**
 * The us-history argument as a causal diagram: a main column of moves, the
 * slavery contradiction branching out beside the early republic and
 * converging into the price of self-correction. Geometry is custom to this
 * course; the text comes from course.yaml's spine (label/years/step).
 */
export default function UsHistoryMap({ spine }: { spine: Course["spine"] }) {
  if (spine.length !== 15) return null; // geometry is built for this spine

  const H = 40;
  const pitch = 54;
  const main = { x: 150, w: 330 };
  const cx = main.x + main.w / 2;
  const boxes: Box[] = [];
  // steps 1-8 (idx 0-7): main column
  for (let i = 0; i < 8; i++) boxes.push({ x: main.x, y: 16 + i * pitch, w: main.w });
  // step 9 (idx 8): the contradiction, branched beside steps 7-8
  boxes.push({ x: 505, y: 16 + 6.5 * pitch, w: 168 });
  // step 10 (idx 9): convergence, wide
  boxes.push({ x: main.x, y: 16 + 8 * pitch + 14, w: 430 });
  // steps 11-15 (idx 10-14): main column
  for (let i = 0; i < 5; i++)
    boxes.push({ x: main.x, y: 16 + (9 + i) * pitch + 28, w: main.w });
  const total = boxes[14].y + H + 16;

  const color = (i: number) =>
    ENGINE.has(i) ? AMBER : TESTS.has(i) ? BLUE : "currentColor";

  const arrow = (x1: number, y1: number, x2: number, y2: number, key: string) => (
    <path
      key={key}
      d={
        x1 === x2
          ? `M ${x1} ${y1} L ${x2} ${y2}`
          : `M ${x1} ${y1} H ${x2} V ${y2}`
      }
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      opacity="0.45"
      markerEnd="url(#us-map-arrow)"
    />
  );

  return (
    <svg
      viewBox={`0 0 690 ${total}`}
      role="img"
      aria-label="The course argument as a causal chain: from the emptied continent through the settler engine, the constitutional design and its tests, the slavery contradiction converging into the price of self-correction, to the industrial leap, the world-war test, and the American order"
      style={{ width: "100%", maxWidth: 690, height: "auto" }}
      font-family="system-ui, sans-serif"
    >
      <defs>
        <marker id="us-map-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="currentColor" opacity="0.45" />
        </marker>
      </defs>

      {/* main flow arrows */}
      {boxes.slice(0, 7).map((b, i) => arrow(cx, b.y + H, cx, boxes[i + 1].y, `m${i}`))}
      {/* branch: the design carries a contradiction */}
      {arrow(boxes[5].x + boxes[5].w, boxes[5].y + H / 2, boxes[8].x + boxes[8].w / 2, boxes[8].y, "branch")}
      {/* convergence into the price of self-correction */}
      {arrow(cx, boxes[7].y + H, cx, boxes[9].y, "conv-main")}
      {arrow(boxes[8].x + boxes[8].w / 2, boxes[8].y + H, boxes[8].x + boxes[8].w / 2, boxes[9].y, "conv-branch")}
      {/* tail */}
      {arrow(cx, boxes[9].y + H, cx, boxes[10].y, "t0")}
      {boxes.slice(10, 14).map((b, i) => arrow(cx, b.y + H, cx, boxes[11 + i].y, `t${i + 1}`))}

      <text x={boxes[8].x + boxes[8].w / 2} y={boxes[8].y - 8} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.55">
        the design carries a contradiction
      </text>

      {boxes.map((b, i) => {
        const step = spine[i];
        const c = color(i);
        return (
          <g key={i}>
            <title>{step.step}</title>
            <rect
              x={b.x}
              y={b.y}
              width={b.w}
              height={H}
              rx="5"
              fill="none"
              stroke={c}
              strokeWidth={c === "currentColor" ? 1 : 1.5}
              opacity={c === "currentColor" ? 0.5 : 0.9}
              strokeDasharray={i === 8 ? "4 3" : undefined}
            />
            <text x={b.x + 12} y={b.y + 17} fontSize="12.5" fontWeight="600" fill={c === "currentColor" ? "currentColor" : c}>
              {`${String(i + 1).padStart(2, "0")}  ${step.label ?? step.step.slice(0, 40)}`}
            </text>
            <text x={b.x + 12} y={b.y + 32} fontSize="10.5" fill="currentColor" opacity="0.55">
              {step.years ?? ""}
            </text>
          </g>
        );
      })}

      {/* legend */}
      <g fontSize="10.5" opacity="0.8">
        <rect x={505} y={16} width={10} height={10} rx="2" fill="none" stroke={AMBER} strokeWidth="1.5" />
        <text x={521} y={25} fill="currentColor" opacity="0.7">the institutions engine</text>
        <rect x={505} y={34} width={10} height={10} rx="2" fill="none" stroke={BLUE} strokeWidth="1.5" />
        <text x={521} y={43} fill="currentColor" opacity="0.7">external tests</text>
      </g>
    </svg>
  );
}
