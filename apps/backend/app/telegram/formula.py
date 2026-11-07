"""Formulas as images, for a medium that renders no LaTeX.

matplotlib's mathtext rather than KaTeX: KaTeX writes HTML, which needs a
browser to become an image, and mathtext needs neither a browser nor a TeX
install. With the `cm` fontset it reads close to the site's math. What it
cannot parse — `aligned`, `pmatrix` — comes back as the parser's message, for
the model to restate the formula another way.
"""

import io

from matplotlib.figure import Figure
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


class FormulaError(ValueError):
    pass


_parser = MathTextParser("path")


def _math(line: str) -> str:
    # A model writing LaTeX often brings its own delimiters; doubled, they
    # would close the math where it opens.
    return f"${line.strip().strip('$')}$"


def render(lines: list[str]) -> bytes:
    """`lines` typeset one under another, left-aligned, as a PNG."""
    if not 1 <= len(lines) <= MAX_LINES:
        raise FormulaError(f"a formula is 1 to {MAX_LINES} lines")
    maths = [_math(line) for line in lines]
    # Parsed one by one first, so the error names the line it is about; the
    # same failure at draw time names none.
    for number, math in enumerate(maths, start=1):
        try:
            _parser.parse(math)
        except ValueError as exc:
            raise FormulaError(f"line {number}: {exc}") from exc
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
        out, format="png", dpi=DPI, bbox_inches="tight", pad_inches=0.2, facecolor=PAPER
    )
    return out.getvalue()
