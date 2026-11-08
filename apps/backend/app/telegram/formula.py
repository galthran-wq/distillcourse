"""Formulas as images, for a medium that renders no LaTeX.

matplotlib's mathtext rather than KaTeX: KaTeX writes HTML, which needs a
browser to become an image, and mathtext needs neither a browser nor a TeX
install. With the `cm` fontset it reads close to the site's math. What it
cannot parse — `aligned`, `pmatrix` — comes back as the parser's message, for
the model to restate the formula another way.
"""

import io

from matplotlib.figure import Figure
from matplotlib.font_manager import FontProperties
from matplotlib.mathtext import MathTextParser
from matplotlib.offsetbox import AnchoredOffsetbox, TextArea, VPacker

MAX_LINES = 6
DPI = 200
FONT_SIZE = 16
# Points between two lines, on top of each line's own height.
LINE_GAP = 6
# The light theme's --ink (apps/frontend/app/globals.css), on white.
INK = "#15171a"
PAPER = "white"
# Telegram refuses a photo longer than 20 times its other side. The extents
# the parser reports are a little tighter than the drawn image, so the
# estimate overstates the ratio and errs toward refusing.
MAX_RATIO = 20
PAD_INCHES = 0.2


class FormulaError(ValueError):
    pass


_parser = MathTextParser("path")


def _math(line: str) -> str:
    # A model writing LaTeX often brings its own delimiters; doubled, they
    # would close the math where it opens.
    return f"${line.strip().strip('$')}$"


def check(lines: list[str]) -> list[str]:
    """`lines` as the math `render` draws, or FormulaError saying why it
    cannot: a line that does not parse, or a shape Telegram would refuse."""
    if not 1 <= len(lines) <= MAX_LINES:
        raise FormulaError(f"a formula is 1 to {MAX_LINES} lines")
    maths = [_math(line) for line in lines]
    prop = FontProperties(size=FONT_SIZE, math_fontfamily="cm")
    # Parsed one by one, so the error names the line it is about; the same
    # failure at draw time names none.
    extents = []
    for number, math in enumerate(maths, start=1):
        try:
            extents.append(_parser.parse(math, dpi=72, prop=prop))
        except ValueError as exc:
            raise FormulaError(f"line {number}: {exc}") from exc
    pad = 2 * PAD_INCHES * 72
    width = max(extent.width for extent in extents) + pad
    height = (
        sum(extent.height for extent in extents) + LINE_GAP * (len(maths) - 1) + pad
    )
    if width > MAX_RATIO * height:
        raise FormulaError("too wide for one image: split it over more lines")
    return maths


def render(lines: list[str]) -> bytes:
    """`lines` typeset one under another, left-aligned, as a PNG."""
    maths = check(lines)
    figure = Figure(facecolor=PAPER)
    column = VPacker(
        children=[
            TextArea(
                math,
                textprops={
                    "fontsize": FONT_SIZE,
                    "math_fontfamily": "cm",
                    "color": INK,
                },
            )
            for math in maths
        ],
        align="left",
        pad=0,
        sep=LINE_GAP,
    )
    figure.add_artist(
        AnchoredOffsetbox(
            loc="center",
            child=column,
            frameon=False,
            bbox_to_anchor=(0.5, 0.5),
            bbox_transform=figure.transFigure,
        )
    )
    out = io.BytesIO()
    figure.savefig(
        out,
        format="png",
        dpi=DPI,
        bbox_inches="tight",
        pad_inches=PAD_INCHES,
        facecolor=PAPER,
    )
    return out.getvalue()
