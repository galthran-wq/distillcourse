import struct

import pytest

from app.telegram import formula

PNG = b"\x89PNG"


def height(png: bytes) -> int:
    """The image height, from the IHDR chunk every PNG opens with."""
    value: int = struct.unpack(">I", png[20:24])[0]
    return value


@pytest.mark.parametrize(
    "line",
    [
        r"\mathbb{E}[(y-\hat f)^2]=\mathrm{Bias}[\hat f]^2+\mathrm{Var}[\hat f]+\sigma^2",
        r"H(X) = -\sum_{x} p(x) \log_2 p(x)",
        r"\frac{\partial L}{\partial w} = X^\top (Xw - y)",
        r"\sqrt{\left(\frac{a}{b}\right)}",
        # Delimiters a model brings along are its own business, not an error.
        r"$x^2$",
    ],
)
def test_the_formulas_mathtext_handles_render(line: str) -> None:
    assert formula.render([line])[:4] == PNG


def test_lines_are_set_one_under_another() -> None:
    one = formula.render([r"a = b"])
    three = formula.render([r"a = b", r"= c", r"= d"])

    assert height(three) > 1.5 * height(one)


@pytest.mark.parametrize(
    "line",
    [
        r"\begin{pmatrix} a & b \\ c & d \end{pmatrix}",
        r"\begin{aligned} a &= b \end{aligned}",
    ],
)
def test_an_environment_raises_the_parsers_message(line: str) -> None:
    with pytest.raises(formula.FormulaError, match=r"(?s)line 2: .*Unknown symbol"):
        formula.render(["a = b", line])


@pytest.mark.parametrize("count", [0, formula.MAX_LINES + 1])
def test_a_formula_is_one_to_six_lines(count: int) -> None:
    with pytest.raises(formula.FormulaError):
        formula.render(["x"] * count)
