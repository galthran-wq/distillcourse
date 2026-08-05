import { M } from "../M";
import { ACCENT, SUPPORT } from "../palette";

/**
 * BerryLoop — Berry's paradox as an executable loop, the non-computability of
 * Kolmogorov complexity K.
 *
 * A short program R (blue listing box, ~10^6 bits) walks the strings in order,
 * computes K(x) via a hypothetical subroutine Q, and prints the first x whose
 * K exceeds 10^9. An arrow leads to that output x^*. Two boxed deductions then
 * collide across a bold amber "contradiction" bar: printing x^* makes it
 * describable in ~10^6 bits, yet line 3's own test certifies K(x^*) > 10^9.
 * Both cannot hold — so the only assumption, the subroutine Q that computes K,
 * cannot exist.
 *
 * Color roles: blue = the program listing; amber = the contradiction marking
 * (the "don't"). currentColor = text. One idea: a small program would name a
 * string whose complexity it certifies to be huge.
 *
 * Recreated after Shen, Uspensky & Vereshchagin ch. 1 (idea only, house style).
 */

const RED = ACCENT; // amber plays the "contradiction / cannot hold" role

function CodeLine({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
      <span
        style={{
          color: SUPPORT,
          opacity: 0.7,
          fontVariantNumeric: "tabular-nums",
          width: 10,
          flexShrink: 0,
        }}
      >
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}

export default function BerryLoop() {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 22,
        maxWidth: 640,
      }}
    >
      {/* top row: program listing → output token */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {/* the program R (blue) */}
        <div
          style={{
            border: `1.7px solid ${SUPPORT}`,
            borderRadius: 10,
            padding: "12px 16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          <div style={{ marginBottom: 5, fontSize: 13 }}>
            <M
              tex={String.raw`\textcolor{${SUPPORT}}{R}`}
              size={14}
            />{" "}
            <span style={{ opacity: 0.75 }}>
              — total length <M tex={String.raw`\approx 10^{6}`} size={12} />{" "}
              bits
            </span>
          </div>
          <div
            style={{
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              fontSize: 12.5,
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <CodeLine n={1}>
              for each string <M tex="x" size={12} /> (in order):
            </CodeLine>
            <CodeLine n={2}>
              <span style={{ paddingLeft: 16 }}>
                k = <M tex={String.raw`K(x)`} size={12} />
                <span style={{ opacity: 0.5, marginLeft: 10 }}>
                  {"// calls "}
                  <M tex="Q" size={12} />,{" "}
                  <M tex={String.raw`10^{6}`} size={11} /> bits
                </span>
              </span>
            </CodeLine>
            <CodeLine n={3}>
              <span style={{ paddingLeft: 16 }}>
                if <M tex={String.raw`k > 10^{9}`} size={12} />: print{" "}
                <M tex="x" size={12} />; halt
              </span>
            </CodeLine>
          </div>
        </div>

        {/* arrow → x^* */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <svg width="70" height="26" viewBox="0 0 70 26" aria-hidden="true">
            <line
              x1="4"
              y1="13"
              x2="60"
              y2="13"
              stroke="currentColor"
              strokeOpacity="0.7"
              strokeWidth="1.6"
            />
            <path
              d="M66 13 l -9 -4.2 l 0 8.4 Z"
              fill="currentColor"
              fillOpacity="0.7"
            />
          </svg>
        </div>

        {/* output token */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            maxWidth: 172,
          }}
        >
          <div
            style={{
              fontFamily: "ui-monospace, Menlo, Consolas, monospace",
              border: "1.3px solid currentColor",
              borderRadius: 6,
              padding: "3px 12px",
              opacity: 0.95,
            }}
          >
            <M tex={String.raw`x^{*}`} size={15} />
          </div>
          <div
            style={{
              fontSize: 11.5,
              opacity: 0.6,
              textAlign: "center",
              lineHeight: 1.35,
            }}
          >
            first string with{" "}
            <M tex={String.raw`K(x^{*}) > 10^{9}`} size={11} />
          </div>
        </div>
      </div>

      {/* the collision: two boxed deductions joined by the amber bar */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 18,
          }}
        >
          {/* left deduction */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11.5, opacity: 0.7, textAlign: "center" }}>
              <M tex={String.raw`\textcolor{${SUPPORT}}{R}`} size={12} /> prints{" "}
              <M tex={String.raw`x^{*}`} size={12} />{" "}
              <M tex={String.raw`\Rightarrow`} size={12} />
            </div>
            <div
              style={{
                border: "1.4px solid currentColor",
                borderRadius: 7,
                padding: "6px 12px",
              }}
            >
              <M tex={String.raw`K(x^{*}) \le 10^{6} + c`} size={14} />
            </div>
          </div>

          {/* amber contradiction bar */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "stretch",
              paddingTop: 18,
            }}
          >
            <span
              style={{
                color: RED,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: "uppercase",
                marginBottom: 3,
              }}
            >
              contradiction
            </span>
            <div
              style={{
                width: 7,
                flex: 1,
                minHeight: 42,
                background: RED,
                borderRadius: 4,
              }}
            />
          </div>

          {/* right deduction */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div style={{ fontSize: 11.5, opacity: 0.7, textAlign: "center" }}>
              line 3 test <M tex={String.raw`\Rightarrow`} size={12} />
            </div>
            <div
              style={{
                border: "1.4px solid currentColor",
                borderRadius: 7,
                padding: "6px 12px",
              }}
            >
              <M tex={String.raw`K(x^{*}) > 10^{9}`} size={14} />
            </div>
          </div>
        </div>

        {/* verdict, in the contradiction color */}
        <div style={{ textAlign: "center", marginTop: 2 }}>
          <span style={{ color: RED, fontWeight: 600, fontSize: 12.5 }}>
            both cannot hold — no program computes{" "}
            <M tex={String.raw`\textcolor{${RED}}{K}`} size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
