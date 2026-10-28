"""Builds one lab: executes the reference solution, writes its artifacts.

Runs inside the lab's own uv environment against the committed uv.lock, with
the working directory a throwaway copy of the lesson directory — so executing
author code never writes into content/. `scripts/build-labs.ts` invokes it with
a JSON config and reads back the `lab-build:` line every failure ends with.

Artifacts: the student notebook and the public manifest (what the learner and
their client may see) and the private artifact (expected outputs, secret
labels, rubrics — what the checkpoint API compares against).
"""

from __future__ import annotations

import ast
import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path, PurePosixPath
from typing import Any

import jupytext
import nbclient
import nbformat
import yaml

try:
    import tomllib
except ModuleNotFoundError as exc:  # pyproject/uv.lock parsing has no fallback
    raise SystemExit("lab-build: a lab's requires-python must be >= 3.11") from exc

SOLUTION = "solution.py"
CHALLENGES = "challenges.yaml"
CAPTURED = "captured.json"

BLANK = "# YOUR CODE HERE"
REVIEW_PLACEHOLDER = "YOUR ANSWER HERE"
SOLUTION_SPAN = re.compile(
    r"^([ \t]*)# BEGIN SOLUTION[ \t]*\n.*?^[ \t]*# END SOLUTION[ \t]*\n?",
    re.S | re.M,
)
# What the notebook is checked for after cutting: the span regex is exact, so
# any typo in a marker leaves it — and the solution under it — in the cell.
MARKERS = ("BEGIN SOLUTION", "END SOLUTION")
CHECKPOINT_CALL = re.compile(
    r"distill\.(?:check|submit_predictions|submit_review)\(\s*[\"']([A-Za-z0-9_-]+)[\"']"
)

# Calls that only make sense while capturing reference data; the generated
# header opens the learner's session, pairs it and there is nothing to dump
# client-side.
CAPTURE_ONLY = {"dump", "login", "open_lab"}

KERNELSPEC = {"name": "python3", "display_name": "Python 3", "language": "python"}

# Whitelist, never a blacklist: a key nobody anticipated in challenges.yaml
# must not reach the learner just because it was added upstream.
PUBLIC_FIELDS = {
    "exact": ("seed", "inputs_code", "atol"),
    "metric": ("metric", "threshold", "holdout"),
    "review": (),
}


class LabBuildError(Exception):
    """A failure the lab's author must fix; the message becomes the diagnostic."""


def content_version() -> str:
    digest = hashlib.sha256()
    for name in (SOLUTION, CHALLENGES):
        digest.update(Path(name).read_bytes())
    return digest.hexdigest()


def load_challenges() -> dict[str, dict[str, Any]]:
    checkpoints = yaml.safe_load(Path(CHALLENGES).read_text())["checkpoints"]
    for cid, spec in checkpoints.items():
        if spec.get("kind") not in PUBLIC_FIELDS:
            raise LabBuildError(f'checkpoint "{cid}": unknown kind {spec.get("kind")!r}')
        holdout = spec.get("holdout")
        if holdout is None:
            continue
        if not holdout.startswith("data/"):
            raise LabBuildError(
                f'checkpoint "{cid}": holdout {holdout} must live under data/ — '
                "only data/ is published to the mirror"
            )
        if not Path(holdout).exists():
            raise LabBuildError(f'checkpoint "{cid}": holdout {holdout} does not exist')
    return checkpoints


def data_files() -> list[str]:
    root = Path("data")
    if not root.is_dir():
        return []
    return sorted(p.as_posix() for p in root.rglob("*") if p.is_file())


def locked_deps() -> list[str]:
    declared = tomllib.loads(Path("pyproject.toml").read_text())["project"]
    locked = {
        _normalize(pkg["name"]): pkg["version"]
        for pkg in tomllib.loads(Path("uv.lock").read_text())["package"]
    }
    pinned = []
    for spec in declared.get("dependencies", []):
        name = re.split(r"[<>=!~\[;\s]", spec, maxsplit=1)[0]
        version = locked.get(_normalize(name))
        if version is None:
            raise LabBuildError(f"{name} is in pyproject.toml but not in uv.lock — run `uv lock`")
        pinned.append(f"{name}=={version}")
    return pinned


def _normalize(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def _cut(source: str, filler: list[str]) -> str:
    def replace(match: re.Match[str]) -> str:
        return "".join(f"{match.group(1)}{line}\n" for line in filler)

    return SOLUTION_SPAN.sub(replace, source)


def cut_solutions(source: str) -> str:
    cut = _cut(source, [BLANK])
    try:
        ast.parse(cut)
        return cut
    except SyntaxError:
        pass
    # The span was the whole body: the learner needs a statement, not a comment.
    cut = _cut(source, [BLANK, "raise NotImplementedError"])
    try:
        ast.parse(cut)
    except SyntaxError as exc:
        raise LabBuildError(f"cutting a solution span left unparsable code: {exc}") from exc
    return cut


def _distill_call(node: ast.stmt) -> str | None:
    if not isinstance(node, ast.Expr) or not isinstance(node.value, ast.Call):
        return None
    func = node.value.func
    if not isinstance(func, ast.Attribute) or not isinstance(func.value, ast.Name):
        return None
    return func.attr if func.value.id == "distill" else None


def _review_call(node: ast.Expr) -> str:
    call = node.value
    assert isinstance(call, ast.Call)
    first = call.args[0] if call.args else None
    if not isinstance(first, ast.Constant) or not isinstance(first.value, str):
        raise LabBuildError(
            "distill.submit_review needs its checkpoint id as a string literal"
        )
    indent = " " * node.col_offset
    return f'{indent}distill.submit_review("{first.value}", "{REVIEW_PLACEHOLDER}")'


def student_cell(source: str) -> str | None:
    """The learner's version of one code cell; None when nothing is left of it."""
    cut = SOLUTION_SPAN.search(source) is not None
    if cut:
        source = cut_solutions(source)
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        raise LabBuildError(f"{SOLUTION} has an unparsable cell: {exc}") from exc

    dropped: set[int] = set()
    rewritten: dict[int, str] = {}
    for node in tree.body:
        name = _distill_call(node)
        if name not in CAPTURE_ONLY and name != "submit_review":
            continue
        assert isinstance(node, ast.Expr) and node.end_lineno is not None
        dropped.update(range(node.lineno, node.end_lineno + 1))
        if name == "submit_review":
            rewritten[node.lineno] = _review_call(node)

    kept = [
        rewritten.get(number, line)
        for number, line in enumerate(source.split("\n"), start=1)
        if number not in dropped or number in rewritten
    ]
    # Only a cell that was nothing but capture calls disappears. A cell whose
    # whole body was a solution span is now nothing but the blank — and the
    # blank is the task.
    if not cut and all(not line.strip() or line.lstrip().startswith("#") for line in kept):
        return None
    return "\n".join(kept).strip("\n")


def header_cells(config: dict[str, Any], deps: list[str], files: list[str]) -> list[Any]:
    """Two cells the learner runs before anything they wrote: setup, then
    pairing. Separate because they fail for unrelated reasons and are re-run on
    unrelated occasions — setup once per kernel, pairing again whenever the
    approval expired or the pairing was revoked."""
    badge = "https://colab.research.google.com/assets/colab-badge.svg"
    intro = (
        f"[![Open In Colab]({badge})]({config['colab_url']})\n\n"
        "Run the two cells below once per session. The first installs the "
        "lab's pinned dependencies and the `distill` client, fetches the data "
        "files, and reads what this lab asks for. The second pairs this "
        "kernel with your account so the checkpoints you submit count: it "
        "prints a link — open it in the browser you are signed in on and "
        "press **Approve**."
    )
    setup = [f'%pip install -q {" ".join(deps)} "{config["client_install"]}"']
    if files:
        folders = sorted({str(PurePosixPath(f).parent) for f in files})
        setup.append(f'!mkdir -p {" ".join(folders)}')
        setup += [f'!wget -q -O {f} {config["raw_url_base"]}/{f}' for f in files]
    setup += ["", "import distill", "", f'distill.open_lab("{config["lab"]}")']
    login = [
        "# Prints a link; approve this notebook from your signed-in browser.",
        '# No browser session anywhere? distill.login("<code>") takes the code',
        "# the lesson page issues instead.",
        "distill.login()",
    ]
    return [
        nbformat.v4.new_markdown_cell(intro),
        nbformat.v4.new_code_cell("\n".join(setup)),
        nbformat.v4.new_code_cell("\n".join(login)),
    ]


def student_notebook(
    source: str, config: dict[str, Any], deps: list[str], files: list[str]
) -> Any:
    notebook = jupytext.reads(source, fmt="py:percent")
    cells = []
    for index, cell in enumerate(notebook.cells):
        if cell.cell_type == "code":
            student = student_cell(cell.source)
            if student is None:
                continue
            cell.source = student
            cell.outputs = []
            cell.execution_count = None
        # The notebook is published: a marker that survived means the solution
        # under it survived too, so this is a build failure, not a blemish.
        if any(marker in cell.source for marker in MARKERS):
            raise LabBuildError(
                f"cell {index} still carries a solution marker after cutting — "
                "each marker must read exactly `# BEGIN SOLUTION` / "
                "`# END SOLUTION` on a line of its own"
            )
        cell.metadata = {}
        cells.append(cell)
    notebook.cells = header_cells(config, deps, files) + cells
    # Deterministic ids: nbformat invents random ones, and the mirror is
    # force-pushed on every build.
    for index, cell in enumerate(notebook.cells):
        cell.id = f"c{index:03d}"
    notebook.metadata = {"kernelspec": KERNELSPEC, "language_info": {"name": "python"}}
    notebook.nbformat, notebook.nbformat_minor = 4, 5
    return notebook


def execute(source: str, timeout: int) -> dict[str, Any]:
    notebook = jupytext.reads(source, fmt="py:percent")
    notebook.metadata["kernelspec"] = KERNELSPEC
    client = nbclient.NotebookClient(
        notebook,
        timeout=timeout,
        kernel_name="python3",
        resources={"metadata": {"path": os.getcwd()}},
    )
    try:
        client.execute()
    except nbclient.exceptions.CellExecutionError as exc:
        raise LabBuildError(_failing_cell(notebook, exc)) from exc
    if not Path(CAPTURED).exists():
        raise LabBuildError(f"{SOLUTION} ran but never called distill.dump()")
    return json.loads(Path(CAPTURED).read_text())


def _failing_cell(notebook: Any, exc: nbclient.exceptions.CellExecutionError) -> str:
    reason = f"{exc.ename}: {exc.evalue}".splitlines()[0]
    for index, cell in enumerate(notebook.cells):
        if not any(out.get("output_type") == "error" for out in cell.get("outputs", [])):
            continue
        declared = CHECKPOINT_CALL.search(cell.source)
        where = f'checkpoint "{declared.group(1)}"' if declared else f"cell {index}"
        return f"{where} failed — {reason}"
    return reason


def published_fields(spec: dict[str, Any]) -> dict[str, Any]:
    return {k: spec[k] for k in PUBLIC_FIELDS[spec["kind"]] if k in spec}


def public_manifest(
    challenges: dict[str, dict[str, Any]], version: str, config: dict[str, Any]
) -> dict[str, Any]:
    checkpoints = {
        cid: {"kind": spec["kind"], **published_fields(spec)}
        for cid, spec in challenges.items()
    }
    return {"lab": config["lab"], "content_version": version, "checkpoints": checkpoints}


def private_artifact(
    captured: dict[str, dict[str, Any]],
    challenges: dict[str, dict[str, Any]],
    version: str,
    config: dict[str, Any],
    source: str,
) -> dict[str, Any]:
    # The answer key and, under `public`, the same half the manifest above
    # publishes — one file, because the checkpoint API serves the manifest
    # itself and the inputs a learner computes on must come from the build that
    # captured the outputs they are compared against.
    #
    # The model answer is left out of both answer keys: the judge grades
    # against the rubric rather than against the author's wording.
    #
    # The reference solution rides along whole, for the tutor of a lab chat to
    # read: the API reaches content only through what is ingested, and this
    # artifact is the lab's half of that. It is not secret — the repository is
    # public — but it stays out of the public half all the same: the notebook
    # is the exercise, and the mirror is what the learner opens.
    checkpoints = {
        cid: {
            **{key: value for key, value in record.items() if key != "model_answer"},
            "public": published_fields(challenges[cid]),
        }
        for cid, record in captured.items()
    }
    return {
        "lab": config["lab"],
        "content_version": version,
        "checkpoints": checkpoints,
        "solution": source,
    }


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n")


def main() -> int:
    config = json.loads(Path(sys.argv[1]).read_text())
    source = Path(SOLUTION).read_text()
    try:
        challenges = load_challenges()
        files = data_files()
        notebook = student_notebook(source, config, locked_deps(), files)
        version = content_version()
        print(f"[build] {config['lab']}: executing {SOLUTION}", flush=True)
        captured = execute(source, config["cell_timeout"])
    except LabBuildError as err:
        if err.__cause__ is not None:
            print(err.__cause__, file=sys.stderr)
        print(f"lab-build: {err}", file=sys.stderr)
        return 1

    public = Path(config["public_dir"])
    shutil.rmtree(public, ignore_errors=True)
    public.mkdir(parents=True)
    nbformat.write(notebook, str(public / "lab.ipynb"))
    write_json(public / "manifest.json", public_manifest(challenges, version, config))
    if files:
        shutil.copytree("data", public / "data")
    write_json(
        Path(config["private_path"]),
        private_artifact(captured, challenges, version, config, source),
    )
    print(f"[build] {config['lab']}: {len(captured)} checkpoints green")
    return 0


if __name__ == "__main__":
    sys.exit(main())
