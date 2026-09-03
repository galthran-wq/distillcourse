# Generates this lesson's SVG figures. Numbers are computed, not invented:
# the noise-correlation frames use the best halfspace found by a 720-direction
# sweep on the fixed 14-point set, the stability panels use exact no-intercept
# ridge fits, beta-measured.svg runs the replace-one experiment of
# exercise 6 (seed 7, 50 paired replacement draws shared across lambdas),
# identity-measured.svg runs a 200,000-draw Monte Carlo check of the
# replace-one identity on cubic least squares, and dimension-free.svg
# evaluates the VC and ball bounds at n = 3,065.
# Re-run: python3 gen_figs.py (writes into cwd).
# Glyph discipline: subscripts are tspans (dy shifts), norms are "||" - no
# codepoints outside common font coverage.
import math
import random

AMBER = "#e2903a"
BLUE = "#4c8dd6"
GREEN = "#5aa46a"

PTS = [(3.7, 4.16), (6.71, 3.59), (4.05, 4.32), (1.98, 3.87), (4.83, 5.56),
       (1.4, 2.62), (1.38, 5.66), (5.24, 1.05), (7.09, 6.59), (4.99, 4.49),
       (1.81, 0.89), (4.18, 1.16), (2.02, 2.25), (0.99, 3.58)]

DRAWS = [
    ([-1, 1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, -1, 1], (0.00, 1.00), 3.10, 1, 0.43),
    ([1, 1, 1, 1, -1, -1, 1, -1, 1, -1, -1, -1, -1, -1], (0.51, 0.86), 3.96, 1, 0.71),
    ([1, 1, 1, 1, -1, 1, 1, 1, -1, 1, 1, 1, -1, 1], (0.31, 0.95), 6.30, -1, 0.86),
]


def sub(s):
    return f'<tspan dy="3" font-size="9">{s}</tspan><tspan dy="-3" font-size="9">&#8203;</tspan>'


def sup(s):
    return f'<tspan dy="-4" font-size="9">{s}</tspan><tspan dy="4" font-size="9">&#8203;</tspan>'


def panel_map(x0):
    def f(x, y):
        px = x0 + (x - 0.5) / 7.1 * 264
        py = 288 - (y - 0.4) / 6.7 * 240
        return px, py
    return f


def line_endpoints(w, th, m):
    pts = []
    for x in (0.5, 7.6):
        if abs(w[1]) > 1e-9:
            y = (th - w[0] * x) / w[1]
            if 0.4 <= y <= 7.1:
                pts.append((x, y))
    for y in (0.4, 7.1):
        if abs(w[0]) > 1e-9:
            x = (th - w[1] * y) / w[0]
            if 0.5 <= x <= 7.6:
                pts.append((x, y))
    return [m(*p) for p in pts[:2]]


def noise_frames():
    for k, (sig, w, th, s, corr) in enumerate(DRAWS, 1):
        L = panel_map(36)
        out = [
            '<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
            f'<text x="16" y="20" font-size="13" fill="currentColor">noise draw {k} of 3: same 14 points, fresh random signs</text>',
            f'<circle cx="452" cy="16" r="4" fill="{AMBER}"/><text x="460" y="20" font-size="11" fill="currentColor">sign +1</text>',
            f'<circle cx="530" cy="16" r="4" fill="{BLUE}"/><text x="538" y="20" font-size="11" fill="currentColor">sign &#8722;1</text>',
            '<text x="168" y="42" font-size="12" fill="currentColor" text-anchor="middle">halfspaces</text>',
            '<text x="488" y="42" font-size="12" fill="currentColor" text-anchor="middle">memorizer (tiny-bandwidth RBF ball)</text>',
        ]
        for x0 in (36, 356):
            out.append(f'<rect x="{x0}" y="48" width="264" height="240" rx="6" fill="none" stroke="currentColor" opacity="0.35"/>')
        (ax, ay), (bx, by) = line_endpoints(w, th, L)
        out.append(f'<line x1="{ax:.1f}" y1="{ay:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="currentColor" stroke-width="1.8"/>')
        mx, my = (ax + bx) / 2, (ay + by) / 2
        dx, dy = s * w[0] * 18, -s * w[1] * 18
        out.append(f'<text x="{mx + dx:.1f}" y="{my + dy + 5:.1f}" font-size="16" font-weight="bold" fill="{AMBER}" text-anchor="middle">+</text>')
        R = panel_map(356)
        for (x, y), t in zip(PTS, sig):
            for m in (L, R):
                px, py = m(x, y)
                color = AMBER if t > 0 else BLUE
                out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="{color}"/>')
                if m is R and t > 0:
                    out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="10" fill="none" stroke="{AMBER}" stroke-dasharray="3 3" opacity="0.7"/>')
        out.append(f'<text x="36" y="308" font-size="12" fill="currentColor">best correlation with the signs:</text>')
        out.append(f'<text x="228" y="308" font-size="12" font-weight="bold" fill="currentColor">{corr:.2f}</text>')
        out.append('<text x="356" y="308" font-size="12" fill="currentColor">best correlation:</text>')
        out.append('<text x="462" y="308" font-size="12" font-weight="bold" fill="currentColor">1.00 (every draw)</text>')
        out.append('</svg>')
        with open(f'noise-correlation-{k}.svg', 'w') as f:
            f.write('\n'.join(out))


def rulers():
    rows = [
        ("finite class (2.6&#215;10&#8313; trees)", "ln|H| &#8776; 21.7", "&#8804; 31", "&#8730;(2 ln|H| / n)", (True, True, True)),
        ("halfspaces, d features", "&#8734;", "d + 1", "&#8730;(2d ln(en/d) / n)", (False, True, True)),
        ("norm ball ||w|| &#8804; &#923;, d = 10&#8310;", "&#8734;", "d (vacuous: d &#8811; n)", "r&#923;/&#8730;n &#8212; no d", (False, False, True)),
        ("RBF ball ||f|| &#8804; &#923;", "&#8734;", "&#8734;", "&#923;&#8730;(Tr[K])/n", (False, False, True)),
    ]
    out = ['<svg viewBox="0 0 640 312" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
           '<text x="16" y="22" font-size="13" fill="currentColor">three rulers over the module&#8217;s classes</text>']
    cols = [(232, "|H| (finite-class bound)"), (368, "VC dimension"), (494, "Rademacher complexity")]
    out.append(f'<rect x="444" y="30" width="188" height="252" rx="6" fill="{AMBER}" opacity="0.12"/>')
    for cx, name in cols:
        out.append(f'<text x="{cx + 66}" y="46" font-size="11.5" fill="currentColor" text-anchor="middle" font-weight="bold">{name}</text>')
    y = 76
    for name, a, b, c, ok in rows:
        out.append(f'<text x="16" y="{y}" font-size="12" fill="currentColor">{name}</text>')
        for (cx, _), val, fin in zip(cols, (a, b, c), ok):
            color = GREEN if fin else "currentColor"
            op = '' if fin else ' opacity="0.55"'
            out.append(f'<text x="{cx + 66}" y="{y}" font-size="12" fill="{color}"{op} text-anchor="middle">{val}</text>')
        y += 44
    out.append(f'<line x1="16" y1="{y - 22}" x2="624" y2="{y - 22}" stroke="currentColor" opacity="0.3"/>')
    out.append(f'<text x="16" y="{y + 4}" font-size="12" fill="currentColor">the fitted algorithm (ridge at &#955;, SVM at C)</text>')
    out.append(f'<text x="378" y="{y + 4}" font-size="12" fill="currentColor" opacity="0.55" text-anchor="middle">invisible to every ruler</text>')
    out.append(f'<text x="570" y="{y + 4}" font-size="12" fill="{AMBER}" text-anchor="middle">&#8594; stability</text>')
    out.append('</svg>')
    with open('three-rulers.svg', 'w') as f:
        f.write('\n'.join(out))


def beta_measured():
    # The experiment of exercise 6: n = 100, y = 0.6x + eps, no-intercept ridge
    # minimizing (1/n)sum (y - wx)^2 + lam w^2, 50 replace-one refits per lam
    # (same 50 replacement draws for every lam), worst max-prediction-change
    # recorded. Closed form: w = sum(xy) / (sum(x^2) + n*lam).
    random.seed(7)
    n = 100
    xs = [random.uniform(0, 10) for _ in range(n)]
    ys = [0.6 * x + random.gauss(0, 1) for x in xs]
    sxx = sum(x * x for x in xs)
    sxy = sum(x * y for x, y in zip(xs, ys))
    xbar2 = sxx / n
    repls = [(random.randrange(n), random.uniform(0, 10)) for _ in range(50)]
    repls = [(i, xn, 0.6 * xn + random.gauss(0, 1)) for (i, xn) in repls]
    lams = [10 ** (e / 2) for e in range(-4, 7)]  # 0.01 ... 1000
    meas = []
    for lam in lams:
        w0 = sxy / (sxx + n * lam)
        mx = 0.0
        for (i, xn, yn) in repls:
            w1 = (sxy - xs[i] * ys[i] + xn * yn) / (sxx - xs[i] ** 2 + xn ** 2 + n * lam)
            mx = max(mx, abs(w1 - w0) * 10)  # max over x in [0,10] is at x = 10
        meas.append(mx)
    ols = meas[0]

    x0, x1p, y0, y1p = 70, 600, 264, 44  # plot box (y0 bottom, y1p top)

    def px(lam):
        return x0 + (math.log10(lam) + 2) / 5 * (x1p - x0)

    def py(v):
        lo, hi = math.log10(0.005), math.log10(0.3)
        return y0 - (math.log10(v) - lo) / (hi - lo) * (y0 - y1p)

    out = ['<svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
           '<text x="16" y="20" font-size="13" fill="currentColor">'
           'max prediction change after replacing one point, 50 refits per &#955; (log&#8211;log)</text>',
           f'<rect x="{x0}" y="{y1p}" width="{x1p - x0}" height="{y0 - y1p}" rx="4" fill="none" stroke="currentColor" opacity="0.35"/>']
    for lam in (0.01, 0.1, 1, 10, 100, 1000):
        lab = f"{lam:g}"
        out.append(f'<line x1="{px(lam):.1f}" y1="{y0}" x2="{px(lam):.1f}" y2="{y0 + 5}" stroke="currentColor" opacity="0.55"/>')
        out.append(f'<text x="{px(lam):.1f}" y="{y0 + 19}" font-size="11" fill="currentColor" opacity="0.55" text-anchor="middle">{lab}</text>')
    for v in (0.01, 0.03, 0.1, 0.3):
        out.append(f'<line x1="{x0 - 5}" y1="{py(v):.1f}" x2="{x0}" y2="{py(v):.1f}" stroke="currentColor" opacity="0.55"/>')
        out.append(f'<text x="{x0 - 9}" y="{py(v) + 4:.1f}" font-size="11" fill="currentColor" opacity="0.55" text-anchor="end">{v:g}</text>')
    out.append(f'<text x="{(x0 + x1p) / 2:.0f}" y="{y0 + 38}" font-size="12" fill="currentColor" text-anchor="middle">&#955;</text>')

    # bound shape: 1/lambda through the last measured point, clipped to the box
    cnst = meas[-1] * lams[-1]
    lam_top = cnst / 0.3
    out.append(f'<line x1="{px(lam_top):.1f}" y1="{py(0.3):.1f}" x2="{px(lams[-1]):.1f}" y2="{py(meas[-1]):.1f}" '
               'stroke="currentColor" stroke-dasharray="4 3" opacity="0.6" stroke-width="1.5"/>')
    out.append(f'<text x="{px(lam_top) + 10:.1f}" y="{py(0.3) + 30:.1f}" font-size="11.5" fill="currentColor">'
               'the bound&#8217;s shape: c&#178;r&#178;/(n&#955;) &#8733; 1/&#955;</text>')

    # OLS saturation guide
    out.append(f'<line x1="{x0}" y1="{py(ols):.1f}" x2="{px(30):.1f}" y2="{py(ols):.1f}" '
               'stroke="currentColor" stroke-dasharray="3 3" opacity="0.45"/>')
    out.append(f'<text x="{x0 + 6}" y="{py(ols) - 8:.1f}" font-size="11.5" fill="currentColor" opacity="0.55">'
               f'OLS (&#955; = 0) sensitivity &#8776; {ols:.2f}</text>')

    # crossover marker
    out.append(f'<line x1="{px(33):.1f}" y1="{y1p}" x2="{px(33):.1f}" y2="{y0}" '
               f'stroke="{BLUE}" stroke-dasharray="4 3" opacity="0.8"/>')
    out.append(f'<text x="{px(33) - 6:.1f}" y="{y1p + 16}" font-size="11.5" fill="{BLUE}" text-anchor="end">crossover: &#955; &#8776; mean x&#178; &#8776; 33</text>')

    # measured curve
    pts = ' '.join(f'{px(l):.1f},{py(v):.1f}' for l, v in zip(lams, meas))
    out.append(f'<polyline points="{pts}" fill="none" stroke="{AMBER}" stroke-width="2"/>')
    for l, v in zip(lams, meas):
        out.append(f'<circle cx="{px(l):.1f}" cy="{py(v):.1f}" r="3.5" fill="{AMBER}"/>')
    out.append(f'<text x="{px(0.05):.1f}" y="{py(ols) + 24:.1f}" font-size="11.5" fill="{AMBER}">measured (ridge, n = 100)</text>')
    out.append('</svg>')
    with open('beta-measured.svg', 'w') as f:
        f.write('\n'.join(out))
    print('beta-measured:', [(round(l, 2), round(v, 4)) for l, v in zip(lams, meas)], 'xbar2 =', round(xbar2, 2))


def stability_panels():
    xs = [4.9, 4.05, 1.82, 8.73, 0.56, 5.28, 9.03, 1.27, 5.77, 6.36, 0.89, 4.1]
    ys = [2.72, 1.69, 1.03, 4.84, 0.36, 3.5, 3.83, 0.7, 2.44, 3.17, -0.33, 3.23]
    irep, ynew = 6, -3.17
    panels = [(36, "0.1", 0.5115, 0.3163, "1.95"), (356, "100", 0.1088, 0.0673, "0.42")]
    out = ['<svg viewBox="0 0 640 318" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">']

    def m(x0):
        def f(x, y):
            return x0 + x / 10.5 * 264, 258 - (y + 4.2) / 10.2 * 220
        return f

    for x0, lam, w1, w2, gap in panels:
        f = m(x0)
        out.append(f'<rect x="{x0}" y="30" width="264" height="236" rx="6" fill="none" stroke="currentColor" opacity="0.35"/>')
        out.append(f'<text x="{x0 + 132}" y="22" font-size="13" fill="currentColor" text-anchor="middle">&#955; = {lam}</text>')
        ax0, ay0 = f(0, 0)
        for w, color in ((w1, AMBER), (w2, BLUE)):
            bx, by = f(10.3, w * 10.3)
            out.append(f'<line x1="{ax0:.1f}" y1="{ay0:.1f}" x2="{bx:.1f}" y2="{by:.1f}" stroke="{color}" stroke-width="2"/>')
        for j, (x, y) in enumerate(zip(xs, ys)):
            px, py = f(x, y)
            if j == irep:
                out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.5" fill="none" stroke="{AMBER}" stroke-width="1.5"/>')
                qx, qy = f(x, ynew)
                out.append(f'<line x1="{px:.1f}" y1="{py + 6:.1f}" x2="{qx:.1f}" y2="{qy - 7:.1f}" stroke="currentColor" stroke-dasharray="3 3" opacity="0.5"/>')
                out.append(f'<circle cx="{qx:.1f}" cy="{qy:.1f}" r="4.5" fill="{BLUE}"/>')
            else:
                out.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4" fill="currentColor" opacity="0.6"/>')
        out.append(f'<text x="{x0 + 196}" y="286" font-size="12" fill="currentColor" text-anchor="end">max prediction change:</text>')
        out.append(f'<text x="{x0 + 202}" y="286" font-size="12" font-weight="bold" fill="currentColor">{gap}</text>')
    out.append(f'<line x1="180" y1="306" x2="204" y2="306" stroke="{AMBER}" stroke-width="2"/>')
    out.append('<text x="210" y="310" font-size="11.5" fill="currentColor">fit on S</text>')
    out.append(f'<line x1="290" y1="306" x2="314" y2="306" stroke="{BLUE}" stroke-width="2"/>')
    out.append('<text x="320" y="310" font-size="11.5" fill="currentColor">fit on S with one point replaced</text>')
    out.append('</svg>')
    with open('stability-mechanism.svg', 'w') as f:
        f.write('\n'.join(out))


def norm_ball_alignment():
    # Left: eight signed vectors sigma_i x_i chained tip to tail, resultant u.
    # Right: the ball ||w|| <= Lambda with the best response aligned with u.
    steps = [(1.8, 0.4), (-0.9, 1.3), (1.2, -1.1), (1.5, 0.9),
             (-1.7, 0.3), (0.6, 1.6), (1.1, -0.5), (-0.4, -1.2)]
    scale = 34.0
    ox, oy = 52.0, 226.0

    def px(x, y):
        return ox + x * scale, oy - y * scale

    path_len = sum(math.hypot(a, b) for a, b in steps)
    ux = sum(a for a, _ in steps)
    uy = sum(b for _, b in steps)
    ulen = math.hypot(ux, uy)
    dxn, dyn = ux / ulen, uy / ulen

    out = ['<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
           '<text x="16" y="20" font-size="13" fill="currentColor">'
           'the supremum over the ball, for one draw of signs</text>']
    # chain (muted), joints as small dots
    cx, cy = 0.0, 0.0
    for k, (a, b) in enumerate(steps):
        x1, y1 = px(cx, cy)
        cx, cy = cx + a, cy + b
        x2, y2 = px(cx, cy)
        out.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                   'stroke="currentColor" stroke-width="1.4" opacity="0.4"/>')
        out.append(f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="2.5" fill="currentColor" opacity="0.4"/>')
        if k == 0:
            out.append(f'<text x="{(x1 + x2) / 2:.1f}" y="{(y1 + y2) / 2 + 16:.1f}" font-size="11" '
                       f'fill="currentColor" opacity="0.55" text-anchor="middle">&#963;{sub("1")}x{sub("1")}</text>')
    # resultant u (amber arrow)
    tx, ty = px(ux, uy)
    hx, hy = px(ux - 0.33 * dxn, uy - 0.33 * dyn)
    perp = (-dyn * 5, -dxn * 5)
    out.append(f'<line x1="{ox}" y1="{oy}" x2="{tx:.1f}" y2="{ty:.1f}" stroke="{AMBER}" stroke-width="2.4"/>')
    out.append(f'<path d="M {tx:.1f} {ty:.1f} L {hx + perp[0]:.1f} {hy + perp[1]:.1f} '
               f'L {hx - perp[0]:.1f} {hy - perp[1]:.1f} Z" fill="{AMBER}"/>')
    out.append(f'<text x="{tx + 8:.1f}" y="{ty + 4:.1f}" font-size="13" font-weight="bold" fill="{AMBER}">u</text>')
    out.append(f'<text x="30" y="262" font-size="11.5"><tspan fill="{AMBER}">u = &#931;{sub("i")} '
               f'&#963;{sub("i")}x{sub("i")}</tspan><tspan fill="currentColor" opacity="0.55">: eight signed '
               'points, tip to tail.</tspan></text>')
    out.append('<text x="30" y="278" font-size="11.5" fill="currentColor" opacity="0.55">'
               f'{path_len:.1f} of steps &#8594; ||u|| = {ulen:.1f}. Signs cancel.</text>')

    # right panel: the ball and its best response
    bx, by, r_px = 448.0, 186.0, 62.0
    out.append('<text x="448" y="70" font-size="13.5" fill="currentColor" font-weight="bold" '
               'text-anchor="middle">sup &#9001;w, u&#9002; = &#923;||u||</text>')
    out.append('<text x="448" y="90" font-size="11.5" fill="currentColor" opacity="0.55" '
               'text-anchor="middle">the ball&#8217;s best hypothesis aligns with u</text>')
    out.append(f'<circle cx="{bx}" cy="{by}" r="{r_px}" fill="none" stroke="currentColor" opacity="0.5"/>')
    out.append(f'<text x="{bx:.0f}" y="{by + r_px + 20:.1f}" font-size="11.5" fill="currentColor" '
               'opacity="0.55" text-anchor="middle">||w|| &#8804; &#923;</text>')
    # u direction, extending past the ball
    ax2, ay2 = bx + 108 * dxn, by - 108 * dyn
    hx2, hy2 = bx + 97 * dxn, by - 97 * dyn
    out.append(f'<line x1="{bx}" y1="{by}" x2="{ax2:.1f}" y2="{ay2:.1f}" stroke="{AMBER}" stroke-width="2.2"/>')
    out.append(f'<path d="M {ax2:.1f} {ay2:.1f} L {hx2 - dyn * 5:.1f} {hy2 - dxn * 5:.1f} '
               f'L {hx2 + dyn * 5:.1f} {hy2 + dxn * 5:.1f} Z" fill="{AMBER}"/>')
    out.append(f'<text x="{ax2 + 8:.1f}" y="{ay2 + 4:.1f}" font-size="12.5" fill="{AMBER}">u</text>')
    # best w on the boundary
    wx, wy = bx + r_px * dxn, by - r_px * dyn
    out.append(f'<line x1="{bx}" y1="{by}" x2="{wx:.1f}" y2="{wy:.1f}" stroke="{BLUE}" stroke-width="2.6"/>')
    out.append(f'<circle cx="{wx:.1f}" cy="{wy:.1f}" r="4" fill="{BLUE}"/>')
    out.append(f'<text x="{wx + 2:.1f}" y="{wy + 20:.1f}" font-size="12" fill="{BLUE}">'
               'best w = &#923;u/||u||</text>')
    # a suboptimal w on the ball
    ang = math.radians(205)
    sx, sy = bx + r_px * math.cos(ang), by - r_px * math.sin(ang)
    out.append(f'<line x1="{bx}" y1="{by}" x2="{sx:.1f}" y2="{sy:.1f}" stroke="currentColor" '
               'stroke-width="1.6" opacity="0.45"/>')
    out.append(f'<circle cx="{sx:.1f}" cy="{sy:.1f}" r="3.5" fill="currentColor" opacity="0.45"/>')
    out.append(f'<text x="{sx - 6:.1f}" y="{sy + 16:.1f}" font-size="11" fill="currentColor" opacity="0.55" '
               'text-anchor="end">any other w: smaller &#9001;w, u&#9002;</text>')
    out.append('</svg>')
    with open('norm-ball-alignment.svg', 'w') as f:
        f.write('\n'.join(out))
    print('alignment: path', round(path_len, 1), '|u| =', round(ulen, 2))


def dimension_free():
    # Capacity term vs ambient dimension at n = 3,065 (the spam sample):
    # VC route sqrt(2 d ln(en/d) / n) for halfspaces in R^d, ball r*Lam/sqrt(n).
    n = 3065
    r, lam_budget = 1.0, 10.0
    ball = r * lam_budget / math.sqrt(n)

    x0, x1p, y0, y1p = 70, 600, 240, 40  # y0 bottom, y1p top
    ymax = 1.25

    def px(d):
        return x0 + math.log10(d) / 6 * (x1p - x0)

    def py(v):
        return y0 - v / ymax * (y0 - y1p)

    def vc(d):
        return math.sqrt(2 * d * math.log(math.e * n / d) / n)

    out = ['<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
           '<text x="16" y="20" font-size="13" fill="currentColor">'
           'two capacity terms for the same ball, n = 3,065, as the ambient dimension grows</text>',
           f'<rect x="{x0}" y="{y1p}" width="{x1p - x0}" height="{y0 - y1p}" rx="4" fill="none" stroke="currentColor" opacity="0.35"/>']
    # vacuous band above 1
    out.append(f'<rect x="{x0}" y="{py(ymax)}" width="{x1p - x0}" height="{py(1) - py(ymax):.1f}" '
               'fill="currentColor" opacity="0.07"/>')
    out.append(f'<line x1="{x0}" y1="{py(1):.1f}" x2="{x1p}" y2="{py(1):.1f}" '
               'stroke="currentColor" stroke-dasharray="3 3" opacity="0.5"/>')
    out.append(f'<text x="{x1p - 8}" y="{py(1) - 7:.1f}" font-size="11" fill="currentColor" opacity="0.55" '
               'text-anchor="end">vacuous: bound &#8805; loss range</text>')
    # axes ticks
    for e in range(0, 7):
        d = 10 ** e
        lab = "1" if e == 0 else ("10" if e == 1 else f'10{sup(str(e))}')
        out.append(f'<line x1="{px(d):.1f}" y1="{y0}" x2="{px(d):.1f}" y2="{y0 + 5}" stroke="currentColor" opacity="0.55"/>')
        out.append(f'<text x="{px(d):.1f}" y="{y0 + 19}" font-size="11" fill="currentColor" opacity="0.55" '
                   f'text-anchor="middle">{lab}</text>')
    for v in (0, 0.5, 1):
        out.append(f'<line x1="{x0 - 5}" y1="{py(v):.1f}" x2="{x0}" y2="{py(v):.1f}" stroke="currentColor" opacity="0.55"/>')
        out.append(f'<text x="{x0 - 9}" y="{py(v) + 4:.1f}" font-size="11" fill="currentColor" opacity="0.55" '
                   f'text-anchor="end">{v:g}</text>')
    out.append(f'<text x="{(x0 + x1p) / 2:.0f}" y="{y0 + 38}" font-size="12" fill="currentColor" '
               'text-anchor="middle">feature dimension d (log scale)</text>')
    # VC curve (blue), until it exits the top of the box
    pts = []
    d = 1.0
    while d <= 10 ** 6:
        v = vc(d)
        if v > ymax:
            break
        pts.append((d, v))
        d *= 1.15
    poly = ' '.join(f'{px(d):.1f},{py(v):.1f}' for d, v in pts)
    out.append(f'<polyline points="{poly}" fill="none" stroke="{BLUE}" stroke-width="2"/>')
    # vacuity crossing
    lo, hi = 100.0, 3000.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if vc(mid) < 1 else (lo, mid)
    dvac = (lo + hi) / 2
    out.append(f'<line x1="{px(dvac):.1f}" y1="{py(1):.1f}" x2="{px(dvac):.1f}" y2="{y0}" '
               f'stroke="{BLUE}" stroke-dasharray="4 3" opacity="0.6"/>')
    out.append(f'<text x="{px(dvac) + 6:.1f}" y="{y0 - 10}" font-size="11.5" fill="{BLUE}">'
               f'VC vacuous past d &#8776; {int(round(dvac / 10) * 10)}</text>')
    out.append(f'<text x="{px(2):.1f}" y="{py(0.82):.1f}" font-size="12" fill="{BLUE}">'
               '&#8730;(2d ln(en/d)/n)</text>')
    out.append(f'<text x="{px(2):.1f}" y="{py(0.72):.1f}" font-size="12" fill="{BLUE}">grows with d</text>')
    # ball bound (amber, flat)
    out.append(f'<line x1="{px(2):.1f}" y1="{py(ball):.1f}" x2="{px(10 ** 6):.1f}" y2="{py(ball):.1f}" '
               f'stroke="{AMBER}" stroke-width="2.4"/>')
    for d in (2, 10 ** 6):
        out.append(f'<circle cx="{px(d):.1f}" cy="{py(ball):.1f}" r="3.5" fill="{AMBER}"/>')
    out.append(f'<text x="{px(2000):.1f}" y="{py(ball) - 10:.1f}" font-size="12" fill="{AMBER}" '
               f'text-anchor="middle">r&#923;/&#8730;n = {ball:.2f} at every d  (r = 1, &#923; = 10)</text>')
    out.append('</svg>')
    with open('dimension-free.svg', 'w') as f:
        f.write('\n'.join(out))
    print('dimension-free: ball =', round(ball, 3), 'vacuous at d ~', round(dvac))


def _gauss_solve(A, b):
    n = len(b)
    M = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            for k in range(c, n + 1):
                M[r][k] -= f * M[c][k]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (M[r][n] - sum(M[r][k] * x[k] for k in range(r + 1, n))) / M[r][r]
    return x


def _normal_eqs(ts, ys):
    # normal equations of least squares over {1, t, t^2, t^3} (1e-8 for numerics)
    pw = [[1.0, t, t * t, t ** 3, t ** 4, t ** 5, t ** 6] for t in ts]
    A = [[sum(p[j + k] for p in pw) + (1e-8 if j == k else 0.0) for k in range(4)] for j in range(4)]
    b = [sum(y * p[j] for p, y in zip(pw, ys)) for j in range(4)]
    return A, b


def _cubic_fit(ts, ys):
    A, b = _normal_eqs(ts, ys)
    return _gauss_solve(A, b)


def _replace_refit(A, b, t_old, y_old, t_new, y_new):
    # normal equations after swapping one point: subtract the old row's
    # contribution, add the new one's, re-solve
    po = [1.0, t_old, t_old * t_old, t_old ** 3, t_old ** 4, t_old ** 5, t_old ** 6]
    pn = [1.0, t_new, t_new * t_new, t_new ** 3, t_new ** 4, t_new ** 5, t_new ** 6]
    A2 = [[A[j][k] - po[j + k] + pn[j + k] for k in range(4)] for j in range(4)]
    b2 = [b[j] - y_old * po[j] + y_new * pn[j] for j in range(4)]
    return _gauss_solve(A2, b2)


def _poly(a, t):
    return a[0] + a[1] * t + a[2] * t * t + a[3] * t ** 3


def _true_risk(a):
    # E over t ~ U[0,1] of (poly(t) - 6t)^2 + 1  (y = 6t + N(0,1))
    c = [a[0], a[1] - 6.0, a[2], a[3]]
    return sum(c[j] * c[k] / (j + k + 1) for j in range(4) for k in range(4)) + 1.0


def identity_measured():
    # Monte Carlo check of SSBD Thm 13.2 for cubic least squares on n = 20
    # points of y = 6t + eps, t ~ U[0,1]: the expected generalization gap
    # (true risk in closed form) vs the expected replace-one gap, the latter
    # averaged over 6 random replacements per draw for variance.
    random.seed(11)
    n, reps, k_rep = 20, 200000, 8
    g_gen = g_rep = 0.0
    for _ in range(reps):
        ts = [random.random() for _ in range(n)]
        ys = [6 * t + random.gauss(0, 1) for t in ts]
        A, b = _normal_eqs(ts, ys)
        a = _gauss_solve(A, b)
        emp = sum((y - _poly(a, t)) ** 2 for t, y in zip(ts, ys)) / n
        g_gen += _true_risk(a) - emp
        acc = 0.0
        for _k in range(k_rep):
            i = random.randrange(n)
            tp = random.random()
            yp = 6 * tp + random.gauss(0, 1)
            a2 = _replace_refit(A, b, ts[i], ys[i], tp, yp)
            acc += (ys[i] - _poly(a2, ts[i])) ** 2 - (ys[i] - _poly(a, ts[i])) ** 2
        g_rep += acc / k_rep
    g_gen /= reps
    g_rep /= reps

    # display draw: one dataset, one replacement per i
    random.seed(23)
    ts = [random.random() for _ in range(n)]
    ys = [6 * t + random.gauss(0, 1) for t in ts]
    A, b = _normal_eqs(ts, ys)
    a = _gauss_solve(A, b)
    pairs = []
    for i in range(n):
        tr_loss = (ys[i] - _poly(a, ts[i])) ** 2
        tp = random.random()
        yp = 6 * tp + random.gauss(0, 1)
        a2 = _replace_refit(A, b, ts[i], ys[i], tp, yp)
        ho_loss = (ys[i] - _poly(a2, ts[i])) ** 2
        pairs.append((tr_loss, ho_loss))
    m_tr = sum(p[0] for p in pairs) / n
    m_ho = sum(p[1] for p in pairs) / n
    print('identity: gen', round(g_gen, 3), 'rep', round(g_rep, 3),
          'display means', round(m_tr, 2), round(m_ho, 2),
          'max', round(max(max(p) for p in pairs), 2))

    x0, x1p, y0, y1p = 60, 484, 232, 40
    vmax = max(3.0, max(max(p) for p in pairs) * 1.08)

    def px(i):
        return x0 + (i + 0.5) / n * (x1p - x0)

    def py(v):
        return y0 - v / vmax * (y0 - y1p)

    out = ['<svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">',
           '<text x="16" y="20" font-size="13" fill="currentColor">'
           f'one cubic fit, n = {n}: the loss at each z<tspan dy="3" font-size="9">i</tspan>'
           '<tspan dy="-3" font-size="9">&#8203;</tspan>, trained on vs held out</text>',
           f'<rect x="{x0}" y="{y1p}" width="{x1p - x0}" height="{y0 - y1p}" rx="4" fill="none" stroke="currentColor" opacity="0.35"/>']
    for v in (0, 1, 2, 3):
        if v <= vmax:
            out.append(f'<line x1="{x0 - 5}" y1="{py(v):.1f}" x2="{x0}" y2="{py(v):.1f}" stroke="currentColor" opacity="0.55"/>')
            out.append(f'<text x="{x0 - 9}" y="{py(v) + 4:.1f}" font-size="11" fill="currentColor" opacity="0.55" '
                       f'text-anchor="end">{v}</text>')
    out.append(f'<text x="{(x0 + x1p) / 2:.0f}" y="{y0 + 20}" font-size="12" fill="currentColor" '
               f'text-anchor="middle">training point i = 1 &#8230; {n}  (squared loss at z'
               '<tspan dy="3" font-size="9">i</tspan><tspan dy="-3" font-size="9">&#8203;</tspan>)</text>')
    # mean lines first (under the dots)
    out.append(f'<line x1="{x0}" y1="{py(m_tr):.1f}" x2="{x1p}" y2="{py(m_tr):.1f}" '
               f'stroke="{AMBER}" stroke-dasharray="4 3" opacity="0.7"/>')
    out.append(f'<line x1="{x0}" y1="{py(m_ho):.1f}" x2="{x1p}" y2="{py(m_ho):.1f}" '
               f'stroke="{BLUE}" stroke-dasharray="4 3" opacity="0.7"/>')
    out.append(f'<text x="{x1p + 8}" y="{py(m_tr) + 10:.1f}" font-size="11" fill="{AMBER}">'
               f'trained-on mean {m_tr:.2f}</text>')
    out.append(f'<text x="{x1p + 8}" y="{py(m_ho) - 2:.1f}" font-size="11" fill="{BLUE}">'
               f'held-out mean {m_ho:.2f}</text>')
    for i, (tr, ho) in enumerate(pairs):
        x = px(i)
        out.append(f'<line x1="{x:.1f}" y1="{py(tr):.1f}" x2="{x:.1f}" y2="{py(ho):.1f}" '
                   'stroke="currentColor" stroke-width="1" opacity="0.35"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{py(tr):.1f}" r="4" fill="{AMBER}"/>')
        out.append(f'<circle cx="{x:.1f}" cy="{py(ho):.1f}" r="4" fill="{BLUE}"/>')
    # legend + the measured identity
    out.append(f'<circle cx="66" cy="262" r="4" fill="{AMBER}"/>')
    out.append('<text x="74" y="266" font-size="11.5" fill="currentColor">loss at z<tspan dy="3" font-size="9">i</tspan>'
               '<tspan dy="-3" font-size="9">&#8203;</tspan>, trained on it</text>')
    out.append(f'<circle cx="250" cy="262" r="4" fill="{BLUE}"/>')
    out.append('<text x="258" y="266" font-size="11.5" fill="currentColor">loss at z<tspan dy="3" font-size="9">i</tspan>'
               '<tspan dy="-3" font-size="9">&#8203;</tspan>, replaced before the fit</text>')
    out.append(f'<text x="16" y="296" font-size="12" fill="currentColor">over {reps:,} fresh draws: '
               f'expected generalization gap {g_gen:.2f}, expected replace-one gap {g_rep:.2f}</text>')
    out.append('</svg>')
    with open('identity-measured.svg', 'w') as f:
        f.write('\n'.join(out))


def triangle():
    out = ['<svg viewBox="0 0 640 320" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">']
    for x1, y1, x2, y2 in [(250, 84, 178, 220), (390, 84, 462, 220), (260, 252, 380, 252)]:
        out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="currentColor" stroke-width="1.4" opacity="0.5"/>')
    boxes = [
        (320, 52, "penalty &#955;||w||&#178;", "module 3: ridge, lasso, SVM&#8217;s C", AMBER),
        (140, 252, "stability &#946; &#8804; c&#178;r&#178;/(n&#955;)", "this lesson: Prop. 14.4", BLUE),
        (500, 252, "generalization", "module 5 measures it; Thm 14.2 proves it", GREEN),
    ]
    for cx, cy, t1, t2, color in boxes:
        out.append(f'<rect x="{cx - 124}" y="{cy - 30}" width="248" height="58" rx="6" fill="none" stroke="{color}" stroke-width="1.8"/>')
        out.append(f'<text x="{cx}" y="{cy - 8}" font-size="13" fill="currentColor" text-anchor="middle" font-weight="bold">{t1}</text>')
        out.append(f'<text x="{cx}" y="{cy + 14}" font-size="10.5" fill="currentColor" opacity="0.65" text-anchor="middle">{t2}</text>')
    labels = [
        (160, 148, "strong convexity:", "&#955; buys insensitivity to any one point"),
        (320, 292, "McDiarmid + the identity:", "insensitivity is the expected gap"),
        (523, 140, "cross-validation picks &#955;:", "the loop closes in practice"),
    ]
    for x, y, l1, l2 in labels:
        out.append(f'<text x="{x}" y="{y}" font-size="11.5" fill="currentColor" text-anchor="middle" font-weight="bold">{l1}</text>')
        out.append(f'<text x="{x}" y="{y + 15}" font-size="11.5" fill="currentColor" opacity="0.65" text-anchor="middle">{l2}</text>')
    out.append('</svg>')
    with open('reg-stab-gen.svg', 'w') as f:
        f.write('\n'.join(out))


noise_frames()
rulers()
beta_measured()
stability_panels()
norm_ball_alignment()
dimension_free()
identity_measured()
triangle()
print("done")
