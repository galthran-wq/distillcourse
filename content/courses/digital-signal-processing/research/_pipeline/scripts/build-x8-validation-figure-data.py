#!/usr/bin/env python3
"""Build the pinned, typed data module for X8ValidationDiagnostics.

This is a projection step only: it verifies the audited inputs, preserves every
validation row and file boundary, and copies already-computed metrics. It does
not fit a model, recompute a metric, smooth a trace, or resample observations.
"""

from __future__ import annotations

import csv
import hashlib
import json
from pathlib import Path
from typing import Any


SCRIPT_PATH = Path(__file__).resolve()
REPO_ROOT = SCRIPT_PATH.parents[6]
RESEARCH_DIR = SCRIPT_PATH.parents[2]
DATASET_DIR = RESEARCH_DIR / "data" / "skywalker-x8-v1"
PREDICTIONS_PATH = DATASET_DIR / "derived" / "validation-predictions.csv"
SUMMARY_PATH = DATASET_DIR / "results" / "validation-summary.json"
BUILD_MANIFEST_PATH = DATASET_DIR / "results" / "build-manifest.json"
OUTPUT_PATH = (
    REPO_ROOT
    / "components"
    / "figures"
    / "digital-signal-processing"
    / "X8ValidationDiagnostics.data.ts"
)

PINNED_SHA256 = {
    PREDICTIONS_PATH: "5aa7ec5fdf0d16c3b735595c53ce5efdfa65181e55551030279518db9d75bddc",
    SUMMARY_PATH: "a8f1c9cae1a538438276a021ec0a0234d78d157364f46aa2bac850734c9c920d",
    BUILD_MANIFEST_PATH: "d8b043cc62ad3d1e49c8c9180f05d0dcf0da9fb02372fb083ff5857438c6a61d",
}
PINNED_ARTIFACT_SET_SHA256 = (
    "7aee6d229999e99ff4ce8bdedb9f599c38f696adf3dc0165f6a322f976b0de82"
)
EXPECTED_PROTOCOL_SHA256 = (
    "3750f7e43cd49d21aa4d401884f826cf561303f720b263e2f8c50efb20c71e3f"
)
EXPECTED_SCRIPT_SHA256 = (
    "631a8c65b35ee9fdb55ca5923d775c84e02db3d71b64d1d04ef6e557573fd126"
)
EXPECTED_FILES = (
    ("longitudinal_3211_5.csv", "3211_5", "3211", 414),
    ("longitudinal_doublet_4.csv", "doublet_4", "doublet", 460),
)
TRACE_COLUMNS = (
    "t_s",
    "arx_one_step_residual_rad_s",
    "ar2_one_step_residual_rad_s",
    "arx_free_run_error_rad_s",
    "ar2_free_run_error_rad_s",
)


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def verify_pins_before_parse() -> None:
    for path, expected in PINNED_SHA256.items():
        actual = sha256_path(path)
        if actual != expected:
            raise ValueError(
                f"Pinned input hash mismatch for {path}: {actual} != {expected}"
            )


def float_string(value: Any) -> str:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise TypeError(f"Expected JSON number, got {value!r}")
    return repr(float(value))


def metric_projection(block: dict[str, Any]) -> dict[str, str]:
    return {
        "rmseRadS": float_string(block["rmse_rad_s"]),
        "nrmse": float_string(block["nrmse"]),
    }


def build_payload() -> dict[str, Any]:
    verify_pins_before_parse()

    build_manifest = json.loads(BUILD_MANIFEST_PATH.read_text(encoding="utf-8"))
    summary = json.loads(SUMMARY_PATH.read_text(encoding="utf-8"))

    if build_manifest["artifact_set_sha256"] != PINNED_ARTIFACT_SET_SHA256:
        raise ValueError("Pinned artifact-set hash mismatch")
    if build_manifest["protocol_sha256"] != EXPECTED_PROTOCOL_SHA256:
        raise ValueError("Protocol hash mismatch in build manifest")
    if build_manifest["script_sha256"] != EXPECTED_SCRIPT_SHA256:
        raise ValueError("Analysis-script hash mismatch in build manifest")
    if build_manifest["privacy_projection_verified"] is not True:
        raise ValueError("Build manifest does not verify privacy projection")

    manifest_artifacts = build_manifest["artifacts"]
    prediction_key = "data/skywalker-x8-v1/derived/validation-predictions.csv"
    summary_key = "data/skywalker-x8-v1/results/validation-summary.json"
    if manifest_artifacts[prediction_key]["sha256"] != PINNED_SHA256[PREDICTIONS_PATH]:
        raise ValueError("Prediction hash disagrees with build manifest")
    if manifest_artifacts[summary_key]["sha256"] != PINNED_SHA256[SUMMARY_PATH]:
        raise ValueError("Summary hash disagrees with build manifest")

    dataset = summary["dataset"]
    if dataset != {
        "doi": "https://doi.org/10.18710/U4TLYV",
        "id": "ntnu-skywalker-x8-system-identification-v1",
        "license": "CC0-1.0",
        "version": "1.0",
    }:
        raise ValueError("Unexpected dataset identity in validation summary")
    if summary["decision"]["adequacy_modifier"] != (
        "predictively better but structurally incomplete"
    ):
        raise ValueError("Unexpected adequacy wording")
    if summary["residual_diagnostics"]["band_interpretation"] != (
        "Plot the descriptive approximate band +/-1.96/sqrt(M) per file. "
        "Because lags are correlated and twenty comparisons are made, crossings "
        "are diagnostic flags, not a formal proof of non-whiteness."
    ):
        raise ValueError("Unexpected residual-band interpretation")

    rows_by_file: dict[str, list[dict[str, str]]] = {
        file_name: [] for file_name, _, _, _ in EXPECTED_FILES
    }
    seen_file_order: list[str] = []
    with PREDICTIONS_PATH.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None or any(
            column not in reader.fieldnames for column in TRACE_COLUMNS
        ):
            raise ValueError("Prediction CSV is missing a required trace column")
        for row_number, row in enumerate(reader, start=2):
            file_name = row["file"]
            if file_name not in rows_by_file:
                raise ValueError(f"Unexpected file at CSV row {row_number}: {file_name}")
            if not seen_file_order or seen_file_order[-1] != file_name:
                if file_name in seen_file_order:
                    raise ValueError(f"Non-contiguous file block for {file_name}")
                seen_file_order.append(file_name)
            if row["split"] != "validation":
                raise ValueError(f"Unexpected split at CSV row {row_number}")
            for column in TRACE_COLUMNS:
                try:
                    float(row[column])
                except ValueError as exc:
                    raise ValueError(
                        f"Non-numeric {column} at CSV row {row_number}"
                    ) from exc
            rows_by_file[file_name].append(row)

    expected_order = [item[0] for item in EXPECTED_FILES]
    if seen_file_order != expected_order:
        raise ValueError(f"File order mismatch: {seen_file_order} != {expected_order}")
    if sum(len(rows) for rows in rows_by_file.values()) != 874:
        raise ValueError("Expected exactly 874 scored validation rows")

    per_file_summary = summary["metrics"]["per_file"]
    display = summary["display_rounded_per_protocol"]
    residuals = summary["residual_diagnostics"]["per_file"]
    maneuvers: list[dict[str, Any]] = []
    for file_name, short_name, maneuver_name, expected_m in EXPECTED_FILES:
        rows = rows_by_file[file_name]
        if len(rows) != expected_m:
            raise ValueError(f"Unexpected scored count for {file_name}")
        if any(row["maneuver"] != maneuver_name for row in rows):
            raise ValueError(f"Unexpected maneuver label in {file_name}")
        expected_n = list(range(2, expected_m + 2))
        actual_n = [int(row["n"]) for row in rows]
        if actual_n != expected_n:
            raise ValueError(f"Non-contiguous sample indices in {file_name}")

        file_summary = per_file_summary[file_name]
        if file_summary["scored_samples_M"] != expected_m:
            raise ValueError(f"Summary count mismatch for {file_name}")
        acf = residuals[file_name]
        if len(acf["acf_lags_1_to_20"]) != 20:
            raise ValueError(f"Expected 20 ACF lags for {file_name}")

        maneuvers.append(
            {
                "key": short_name,
                "file": file_name,
                "maneuver": maneuver_name,
                "scoredSamples": expected_m,
                "md5": file_summary["md5"],
                "display": {
                    "oneStepNrmse": {
                        "ar2": display[file_name]["ar2"]["one_step"]["nrmse_3dp"],
                        "arx": display[file_name]["arx"]["one_step"]["nrmse_3dp"],
                    },
                    "freeRunNrmse": {
                        "ar2": display[file_name]["ar2"]["free_run"]["nrmse_3dp"],
                        "arx": display[file_name]["arx"]["free_run"]["nrmse_3dp"],
                    },
                    "acfBand": f"{acf['descriptive_reference_band_plus_minus']:.4f}",
                    "lag1Acf": f"{acf['acf_lags_1_to_20'][0]:.4f}",
                },
                "metrics": {
                    model: {
                        mode: metric_projection(file_summary["models"][model][mode])
                        for mode in ("one_step", "free_run")
                    }
                    for model in ("ar2", "arx")
                },
                "acf": {
                    "lagsSamples": [str(value) for value in range(1, 21)],
                    "values": [
                        float_string(value) for value in acf["acf_lags_1_to_20"]
                    ],
                    "descriptiveBand": float_string(
                        acf["descriptive_reference_band_plus_minus"]
                    ),
                    "crossingLags": [
                        str(value) for value in acf["lags_crossing_descriptive_band"]
                    ],
                },
                "traces": {
                    column: [row[column] for row in rows] for column in TRACE_COLUMNS
                },
            }
        )

    return {
        "dataset": {
            "id": dataset["id"],
            "version": dataset["version"],
            "license": dataset["license"],
            "doi": dataset["doi"],
        },
        "provenance": {
            "predictionSha256": PINNED_SHA256[PREDICTIONS_PATH],
            "validationSummarySha256": PINNED_SHA256[SUMMARY_PATH],
            "buildManifestSha256": PINNED_SHA256[BUILD_MANIFEST_PATH],
            "artifactSetSha256": PINNED_ARTIFACT_SET_SHA256,
            "protocolSha256": EXPECTED_PROTOCOL_SHA256,
            "analysisScriptSha256": EXPECTED_SCRIPT_SHA256,
            "sourceManifestSha256": build_manifest["source_manifest_sha256"],
            "sourceProvenanceSha256": build_manifest["source_provenance_sha256"],
        },
        "axes": {
            "timeS": ["0", "12"],
            "oneStepResidualRadS": ["-0.55", "0.55"],
            "freeRunErrorRadS": ["-3.5", "3.5"],
            "acf": ["-0.6", "0.6"],
            "acfLagSamples": ["1", "20"],
        },
        "macro": {
            "oneStepNrmseEffectPercent": float_string(
                summary["metrics"]["effect_size_percent"]["one_step"]
            ),
            "freeRunNrmseEffectPercent": float_string(
                summary["metrics"]["effect_size_percent"]["free_run"]
            ),
            "displayOneStepPercent": display["effect_size_percent_1dp"]["one_step"],
            "displayFreeRunPercent": display["effect_size_percent_1dp"]["free_run"],
            "adequacy": summary["decision"]["adequacy_modifier"],
            "bandInterpretation": summary["residual_diagnostics"][
                "band_interpretation"
            ],
        },
        "maneuvers": maneuvers,
        "totalScoredRows": 874,
    }


def typescript_bytes(payload: dict[str, Any]) -> bytes:
    relative_script = SCRIPT_PATH.relative_to(REPO_ROOT).as_posix()
    lines = [
        "// Generated file. Do not edit by hand.",
        f"// Generator: {relative_script}",
        f"// validation-predictions.csv sha256: {PINNED_SHA256[PREDICTIONS_PATH]}",
        f"// validation-summary.json sha256: {PINNED_SHA256[SUMMARY_PATH]}",
        f"// build-manifest.json sha256: {PINNED_SHA256[BUILD_MANIFEST_PATH]}",
        f"// artifact-set sha256: {PINNED_ARTIFACT_SET_SHA256}",
        "",
        "export const X8_VALIDATION_DIAGNOSTICS =",
        json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
        + " as const;",
        "",
        "export type X8ValidationDiagnosticsData =",
        "  typeof X8_VALIDATION_DIAGNOSTICS;",
        "export type X8ValidationManeuver =",
        "  X8ValidationDiagnosticsData[\"maneuvers\"][number];",
        "",
    ]
    return "\n".join(lines).encode("utf-8")


def main() -> None:
    payload = build_payload()
    output = typescript_bytes(payload)
    if output != typescript_bytes(payload):
        raise AssertionError("TypeScript serialization is not deterministic")
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_bytes(output)
    print(
        json.dumps(
            {
                "output": str(OUTPUT_PATH),
                "rows": payload["totalScoredRows"],
                "bytes": len(output),
                "sha256": hashlib.sha256(output).hexdigest(),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
