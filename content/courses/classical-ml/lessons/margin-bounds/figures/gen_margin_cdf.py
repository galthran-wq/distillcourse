# Generates margin-cdf-march.svg from the AdaBoost lesson's actual run.
# Numbers are computed, not invented: the boost below reproduces that lesson's
# chi-squared-10 experiment exactly (numpy default_rng(0), 2,000 train /
# 10,000 test, depth-4 gini trees, the lesson's alpha formula) — training
# error hits zero at round 105, test error 38.3%/23.1%/11.1% at T=1/10/100,
# min normalized margin 0.039 at T=200 and 0.080 at T=1000, matching the
# figures quoted in both lessons. Snapshots of the normalized margins at
# rounds 5/200/1000 become the three empirical CDFs.
# Re-run: uv run --with numpy,scikit-learn python gen_margin_cdf.py
# (writes into cwd; pass a JSON path to reuse a cached run: {round: [margins]}).
import json
import sys

import numpy as np

AMBER = "#e2903a"
BLUE = "#4c8dd6"
GREEN = "#5aa46a"

SNAP_ROUNDS = (5, 200, 1000)
RHO = 0.05


def boost():
    from sklearn.tree import DecisionTreeClassifier

    rng = np.random.default_rng(0)
    x = rng.standard_normal((2000, 10))
    y = np.where((x**2).sum(1) > 9.34, 1, -1)
    n = len(y)
    w = np.full(n, 1 / n)
    f = np.zeros(n)
    alpha_sum = 0.0
    snaps = {}
    for t in range(1, max(SNAP_ROUNDS) + 1):
        tree = DecisionTreeClassifier(max_depth=4, random_state=0)
        tree.fit(x, y, sample_weight=w)
        h = tree.predict(x)
        eps = w[h != y].sum()
        alpha = 0.5 * np.log((1 - eps) / eps)
        w = w * np.exp(-alpha * y * h)
        w /= w.sum()
        f += alpha * h
        alpha_sum += alpha
        if t in SNAP_ROUNDS:
            snaps[t] = np.sort(y * f / alpha_sum)
    return snaps


# axes: u in [-0.4, 0.6] -> x = 70 + (u + 0.4) * 530 ; F in [0, 1] -> y = 270 - 210 F
def px(u):
    return 70 + (u + 0.4) * 530


def py(frac):
    return 270 - 210 * frac


def cdf_path(margins):
    # exact staircase where the ECDF is chunky (few rounds -> few distinct
    # sums), dense polyline otherwise — visually identical, small file
    n = len(margins)
    vals, counts = np.unique(np.round(margins, 6), return_counts=True)
    pts = []
    if len(vals) < 60:
        frac = 0.0
        pts.append((-0.4, float((margins <= -0.4).mean())))
        for v, c in zip(vals, counts):
            frac += c / n
            if v < -0.4:
                continue
            if v > 0.6:
                break
            pts.append((v, pts[-1][1]))
            pts.append((v, frac))
        pts.append((0.6, pts[-1][1]))
    else:
        for u in np.linspace(-0.4, 0.6, 220):
            pts.append((float(u), float((margins <= u).mean())))
    return "M " + " L ".join(f"{px(u):.1f} {py(f):.1f}" for u, f in pts)


def main():
    if len(sys.argv) > 1:
        snaps = {int(k): np.array(v) for k, v in json.load(open(sys.argv[1])).items()}
    else:
        snaps = boost()
    heights = {t: float((snaps[t] <= RHO).mean()) for t in SNAP_ROUNDS}
    print("heights at rho:", heights)
    print("train err:", {t: float((snaps[t] <= 0).mean()) for t in SNAP_ROUNDS})
    print("medians:", {t: float(np.median(snaps[t])) for t in SNAP_ROUNDS})

    rho_x = px(RHO)
    parts = [
        '<svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif" font-size="12">',
        "  <style>",
        "    .label { fill: currentColor; font-size: 12px; }",
        "    .small { fill: currentColor; opacity: 0.55; font-size: 11px; }",
        "    .axis  { stroke: currentColor; stroke-opacity: 0.4; stroke-width: 1.1; fill: none; }",
        "  </style>",
        "",
        '  <line class="axis" x1="60" y1="270" x2="610" y2="270"/>',
        '  <line class="axis" x1="70" y1="278" x2="70" y2="52"/>',
        '  <text class="small" x="380" y="300">normalized margin y·f&#772;(x)</text>',
        '  <text class="small" x="84" y="56">fraction of training points with margin &#8804; u</text>',
    ]
    for u in (-0.2, 0.0, 0.2, 0.4, 0.6):
        parts += [
            f'  <line class="axis" x1="{px(u):.0f}" y1="270" x2="{px(u):.0f}" y2="275"/>',
            f'  <text class="small" x="{px(u):.0f}" y="288" text-anchor="middle">{u:g}</text>',
        ]
    parts += [
        '  <line class="axis" x1="66" y1="60" x2="74" y2="60"/>',
        '  <text class="small" x="58" y="64" text-anchor="end">1</text>',
        '  <line class="axis" x1="66" y1="165" x2="74" y2="165"/>',
        '  <text class="small" x="58" y="169" text-anchor="end">0.5</text>',
        "",
        f'  <line x1="{rho_x:.1f}" y1="270" x2="{rho_x:.1f}" y2="74" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.2" stroke-dasharray="4 3"/>',
        f'  <text class="label" x="{rho_x:.1f}" y="88" text-anchor="middle" font-weight="bold">&#961; = 0.05</text>',
    ]

    colors = {5: BLUE, 200: GREEN, 1000: AMBER}
    for t in SNAP_ROUNDS:
        wide = ' stroke-width="2.4"' if t == 1000 else ' stroke-width="2"'
        parts.append(f'  <path d="{cdf_path(snaps[t])}" fill="none" stroke="{colors[t]}"{wide}/>')

    # dots where the bound reads the curves: the CDF height at rho
    for t, (dx, dy, anchor) in {
        5: (17, -10, "start"),
        200: (-9, -12, "end"),
        1000: (10, 12, "start"),
    }.items():
        y = py(heights[t])
        parts += [
            f'  <circle cx="{rho_x:.1f}" cy="{y:.1f}" r="3.5" fill="{colors[t]}"/>',
            f'  <text x="{rho_x + dx:.1f}" y="{y + dy:.1f}" font-size="11" fill="{colors[t]}" text-anchor="{anchor}">{heights[t]:.2f}</text>',
        ]

    parts += [
        f'  <text x="150" y="212" font-size="11" fill="{BLUE}">round 5</text>',
        f'  <text x="394" y="122" font-size="11" fill="{GREEN}">round 200</text>',
        f'  <text x="296" y="112" font-size="12" fill="{AMBER}" font-weight="bold" text-anchor="end">round 1000</text>',
        f'  <line x1="302" y1="108" x2="354" y2="103" stroke="{AMBER}" stroke-width="1.2" stroke-opacity="0.8"/>',
        '  <line x1="348" y1="252" x2="384" y2="252" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4"/>',
        '  <polygon points="384,252 374,247 374,257" fill="currentColor" opacity="0.45"/>',
        '  <text class="small" x="390" y="256">the low tail marches right</text>',
        "</svg>",
    ]
    with open("margin-cdf-march.svg", "w") as fh:
        fh.write("\n".join(parts) + "\n")


main()
