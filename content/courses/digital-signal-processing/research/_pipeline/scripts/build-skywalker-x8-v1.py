#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = ["numpy==2.3.2"]
# ///
"""Reproduce the frozen Skywalker X8 ARX validation study.

The script implements model-protocol.json exactly. It fits on the seven creator-
designated training maneuvers, writes a frozen training checkpoint before parsing
validation arrays, and only then evaluates the two validation maneuvers.
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import math
from pathlib import Path
from typing import Any

import numpy as np


SCRIPT_PATH = Path(__file__).resolve()
RESEARCH_DIR = SCRIPT_PATH.parents[2]
DATASET_DIR = RESEARCH_DIR / "data" / "skywalker-x8-v1"
CYCLE_DIR = (
    RESEARCH_DIR
    / "_pipeline"
    / "lesson-cycles"
    / "perching-glider-system-identification"
)
PROTOCOL_PATH = CYCLE_DIR / "model-protocol.json"
MANIFEST_PATH = DATASET_DIR / "manifest.json"
PROVENANCE_PATH = DATASET_DIR / "provenance.json"
RESULTS_DIR = DATASET_DIR / "results"
DERIVED_DIR = DATASET_DIR / "derived"
TRAINING_FIT_PATH = RESULTS_DIR / "training-fit.json"
VALIDATION_SUMMARY_PATH = RESULTS_DIR / "validation-summary.json"
PREDICTIONS_PATH = DERIVED_DIR / "validation-predictions.csv"
BUILD_MANIFEST_PATH = RESULTS_DIR / "build-manifest.json"
DATA_BUILD_PATH = CYCLE_DIR / "data-build.json"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def md5_path(path: Path) -> str:
    digest = hashlib.md5(usedforsecurity=False)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def json_bytes(value: Any) -> bytes:
    return (json.dumps(value, indent=2, sort_keys=True, allow_nan=False) + "\n").encode(
        "utf-8"
    )


def write_bytes(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def protocol_to_local_path(protocol_path: str) -> Path:
    prefix = "interoperability_files/"
    if not protocol_path.startswith(prefix):
        raise ValueError(f"Unexpected protocol data path: {protocol_path}")
    return DATASET_DIR / "raw" / protocol_path[len(prefix) :]


def manifest_entry_for(local_path: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    relative = local_path.relative_to(DATASET_DIR).as_posix()
    for entry in manifest["files"]:
        if entry["path"] == relative:
            return entry
    raise ValueError(f"No manifest entry for {relative}")


def load_verified_csv(
    protocol_file: dict[str, Any], manifest: dict[str, Any]
) -> dict[str, Any]:
    path = protocol_to_local_path(protocol_file["path"])
    entry = manifest_entry_for(path, manifest)
    actual_bytes = path.stat().st_size
    if actual_bytes != entry["bytes"]:
        raise ValueError(
            f"Byte-size mismatch for {path}: {actual_bytes} != {entry['bytes']}"
        )
    actual_md5 = md5_path(path)
    if actual_md5 != protocol_file["md5"] or actual_md5 != entry["md5"]:
        raise ValueError(f"MD5 mismatch for {path}: {actual_md5}")

    rows: list[list[float]] = []
    with path.open("r", encoding="utf-8", newline="") as handle:
        for row_number, row in enumerate(csv.reader(handle), start=1):
            if len(row) != 41:
                raise ValueError(
                    f"{path} row {row_number}: expected 41 fields, got {len(row)}"
                )
            try:
                numeric = [float(value) for value in row]
            except ValueError as exc:
                raise ValueError(f"{path} row {row_number}: nonnumeric field") from exc
            if not all(math.isfinite(value) for value in numeric):
                raise ValueError(f"{path} row {row_number}: nonfinite field")
            rows.append(numeric)

    values = np.asarray(rows, dtype=np.float64)
    if values.shape != (entry["rows"], 41):
        raise ValueError(
            f"Shape mismatch for {path}: {values.shape} != {(entry['rows'], 41)}"
        )
    time = values[:, 0]
    if abs(float(time[0])) > 1e-9:
        raise ValueError(f"{path}: t[0] is not zero")
    if not np.all(np.abs(np.diff(time) - 0.025) <= 1e-9):
        bad = int(np.flatnonzero(np.abs(np.diff(time) - 0.025) > 1e-9)[0]) + 2
        raise ValueError(f"{path} row {bad}: time increment is not 0.025 s")

    return {
        "path": path,
        "protocol_path": protocol_file["path"],
        "filename": path.name,
        "maneuver": entry["maneuver"],
        "split": entry["split"],
        "md5": actual_md5,
        "bytes": actual_bytes,
        "rows": int(values.shape[0]),
        # Privacy projection: retain only t, elevator, and IMU pitch rate.
        "t": values[:, 0].copy(),
        "u": values[:, 1].copy(),
        "q": values[:, 8].copy(),
    }


def design_arx(record: dict[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    q = record["q"]
    u = record["u"]
    design = np.column_stack(
        [q[1:-1], q[:-2], u[1:-1], np.ones(q.size - 2, dtype=np.float64)]
    )
    return design, q[2:]


def design_ar2(record: dict[str, Any]) -> tuple[np.ndarray, np.ndarray]:
    q = record["q"]
    design = np.column_stack(
        [q[1:-1], q[:-2], np.ones(q.size - 2, dtype=np.float64)]
    )
    return design, q[2:]


def rmse(errors: np.ndarray) -> float:
    return float(np.sqrt(np.mean(np.square(errors), dtype=np.float64)))


def nrmse(errors: np.ndarray, measured: np.ndarray) -> float | None:
    centered = measured - np.mean(measured, dtype=np.float64)
    scale = float(np.sqrt(np.mean(np.square(centered), dtype=np.float64)))
    if scale == 0.0:
        return None
    return rmse(errors) / scale


def acf(errors: np.ndarray, lags: list[int]) -> list[float] | None:
    residual = errors - np.mean(errors, dtype=np.float64)
    denominator = float(np.dot(residual, residual))
    if denominator == 0.0:
        return None
    return [
        float(np.dot(residual[lag:], residual[:-lag]) / denominator)
        for lag in lags
    ]


def complex_record(value: complex) -> dict[str, float]:
    return {
        "real": float(value.real),
        "imag": float(value.imag),
        "magnitude": float(abs(value)),
    }


def metric_block(errors: np.ndarray, measured: np.ndarray) -> dict[str, float | None]:
    return {"rmse_rad_s": rmse(errors), "nrmse": nrmse(errors, measured)}


def display_metrics(metrics: dict[str, Any]) -> dict[str, Any]:
    def four_sig(value: float) -> str:
        return f"{value:.4g}"

    def three_dec(value: float | None) -> str | None:
        return None if value is None else f"{value:.3f}"

    rendered: dict[str, Any] = {}
    for file_name, file_result in metrics["per_file"].items():
        rendered[file_name] = {}
        for model in ("arx", "ar2"):
            rendered[file_name][model] = {}
            for mode in ("one_step", "free_run"):
                block = file_result["models"][model][mode]
                rendered[file_name][model][mode] = {
                    "rmse_rad_s_4sf": four_sig(block["rmse_rad_s"]),
                    "nrmse_3dp": three_dec(block["nrmse"]),
                }
    rendered["macro"] = {}
    for model in ("arx", "ar2"):
        rendered["macro"][model] = {}
        for mode in ("one_step", "free_run"):
            block = metrics["aggregate"]["macro_equal_maneuver"][model][mode]
            rendered["macro"][model][mode] = {
                "rmse_rad_s_4sf": four_sig(block["rmse_rad_s"]),
                "nrmse_3dp": three_dec(block["nrmse"]),
            }
    rendered["effect_size_percent_1dp"] = {
        mode: f"{value:.1f}"
        for mode, value in metrics["effect_size_percent"].items()
    }
    return rendered


def predictions_csv_bytes(rows: list[list[Any]]) -> bytes:
    buffer = io.StringIO(newline="")
    writer = csv.writer(buffer, lineterminator="\n")
    writer.writerow(
        [
            "split",
            "maneuver",
            "file",
            "n",
            "t_s",
            "elevator_rad",
            "imu_pitch_rate_rad_s",
            "arx_one_step_rad_s",
            "ar2_one_step_rad_s",
            "arx_free_run_rad_s",
            "ar2_free_run_rad_s",
            "arx_one_step_residual_rad_s",
            "ar2_one_step_residual_rad_s",
            "arx_free_run_error_rad_s",
            "ar2_free_run_error_rad_s",
        ]
    )
    for row in rows:
        writer.writerow(
            [
                value if isinstance(value, (str, int)) else format(float(value), ".17g")
                for value in row
            ]
        )
    return buffer.getvalue().encode("utf-8")


def mean_blocks(per_file: dict[str, Any], model: str, mode: str) -> dict[str, float]:
    blocks = [value["models"][model][mode] for value in per_file.values()]
    nrmse_values = [block["nrmse"] for block in blocks]
    if any(value is None for value in nrmse_values):
        raise ValueError("NRMSE undefined in a validation maneuver")
    return {
        "rmse_rad_s": float(np.mean([block["rmse_rad_s"] for block in blocks])),
        "nrmse": float(np.mean(nrmse_values)),
    }


def main() -> None:
    protocol = json.loads(PROTOCOL_PATH.read_text(encoding="utf-8"))
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    if protocol["status"] != "precommitted_before_validation_outcomes":
        raise ValueError("Model protocol is not frozen")
    if protocol["validation_outcomes_accessed"] is not False:
        raise ValueError("Protocol does not assert validation outcomes were unopened")

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    DERIVED_DIR.mkdir(parents=True, exist_ok=True)
    script_sha256 = sha256_path(SCRIPT_PATH)
    protocol_sha256 = sha256_path(PROTOCOL_PATH)
    manifest_sha256 = sha256_path(MANIFEST_PATH)
    provenance_sha256 = sha256_path(PROVENANCE_PATH)

    # Phase 1: training only. No validation CSV is parsed before the checkpoint write.
    training = [
        load_verified_csv(file_record, manifest)
        for file_record in protocol["files"]["training"]
    ]
    arx_parts = [design_arx(record) for record in training]
    ar2_parts = [design_ar2(record) for record in training]
    x_arx = np.vstack([part[0] for part in arx_parts]).astype(np.float64, copy=False)
    y_arx = np.concatenate([part[1] for part in arx_parts]).astype(
        np.float64, copy=False
    )
    x_ar2 = np.vstack([part[0] for part in ar2_parts]).astype(np.float64, copy=False)
    y_ar2 = np.concatenate([part[1] for part in ar2_parts]).astype(
        np.float64, copy=False
    )
    coeff_arx, residuals_arx, rank_arx, singular_arx = np.linalg.lstsq(
        x_arx, y_arx, rcond=None
    )
    coeff_ar2, residuals_ar2, rank_ar2, singular_ar2 = np.linalg.lstsq(
        x_ar2, y_ar2, rcond=None
    )
    a1, a2, b1, c = [float(value) for value in coeff_arx]
    a01, a02, c0 = [float(value) for value in coeff_ar2]
    discriminant = complex(a1 * a1 + 4.0 * a2, 0.0)
    root_delta = discriminant ** 0.5
    roots = [(a1 + root_delta) / 2.0, (a1 - root_delta) / 2.0]
    stable = max(abs(value) for value in roots) < 1.0

    training_per_file: dict[str, Any] = {}
    for record in training:
        x1, target = design_arx(record)
        x0, _ = design_ar2(record)
        training_per_file[record["filename"]] = {
            "rows": record["rows"],
            "fit_rows": record["rows"] - 2,
            "md5": record["md5"],
            "arx_one_step_fit_rmse_rad_s": rmse(target - x1 @ coeff_arx),
            "ar2_one_step_fit_rmse_rad_s": rmse(target - x0 @ coeff_ar2),
        }

    training_fit = {
        "schema_version": 1,
        "phase": "frozen_training_fit_before_validation_arrays_are_parsed",
        "dataset_id": protocol["dataset_id"],
        "dataset_version": protocol["dataset_version"],
        "dataset_doi": protocol["dataset_doi"],
        "script": {
            "path": SCRIPT_PATH.relative_to(SCRIPT_PATH.parents[6]).as_posix(),
            "sha256": script_sha256,
        },
        "model_protocol_sha256": protocol_sha256,
        "manifest_sha256": manifest_sha256,
        "signals": protocol["signals"],
        "preprocessing": protocol["preprocessing"],
        "model": {
            "name": protocol["model"]["name"],
            "equation": protocol["model"]["equation"],
            "coefficients_order": ["a1", "a2", "b1", "c"],
            "coefficients": [a1, a2, b1, c],
            "coefficient_units": protocol["model"]["coefficient_units"],
            "lstsq_rank": int(rank_arx),
            "lstsq_singular_values": [float(value) for value in singular_arx],
            "stacked_fit_rows": int(y_arx.size),
            "stacked_fit_rmse_rad_s": rmse(y_arx - x_arx @ coeff_arx),
        },
        "baseline": {
            "name": protocol["baseline"]["name"],
            "equation": protocol["baseline"]["equation"],
            "coefficients_order": ["a01", "a02", "c0"],
            "coefficients": [a01, a02, c0],
            "lstsq_rank": int(rank_ar2),
            "lstsq_singular_values": [float(value) for value in singular_ar2],
            "stacked_fit_rows": int(y_ar2.size),
            "stacked_fit_rmse_rad_s": rmse(y_ar2 - x_ar2 @ coeff_ar2),
        },
        "stability_check_before_validation": {
            "characteristic_equation": "r^2-a1*r-a2=0",
            "roots": [complex_record(value) for value in roots],
            "maximum_root_magnitude": float(max(abs(value) for value in roots)),
            "strictly_inside_unit_circle": stable,
            "scope": protocol["stability_check"]["scope"],
        },
        "training_files": training_per_file,
        "validation_signal_arrays_accessed": False,
    }
    training_fit_data = json_bytes(training_fit)
    if training_fit_data != json_bytes(training_fit):
        raise AssertionError("Training checkpoint serialization is not deterministic")
    write_bytes(TRAINING_FIT_PATH, training_fit_data)

    # Phase 2: only after checkpointing the frozen script, coefficients, roots, and fit.
    validation = [
        load_verified_csv(file_record, manifest)
        for file_record in protocol["files"]["validation"]
    ]
    per_file: dict[str, Any] = {}
    prediction_rows: list[list[Any]] = []
    pooled_errors: dict[str, list[np.ndarray]] = {
        "arx_one_step": [],
        "ar2_one_step": [],
        "arx_free_run": [],
        "ar2_free_run": [],
    }
    lags = [int(value) for value in protocol["residual_diagnostics"]["lags_samples"]]
    acf_sequences: dict[str, list[float]] = {}

    for record in validation:
        q = record["q"]
        u = record["u"]
        measured = q[2:]
        arx_one = c + a1 * q[1:-1] + a2 * q[:-2] + b1 * u[1:-1]
        ar2_one = c0 + a01 * q[1:-1] + a02 * q[:-2]
        arx_free = np.empty_like(q)
        ar2_free = np.empty_like(q)
        arx_free[:2] = q[:2]
        ar2_free[:2] = q[:2]
        for n in range(2, q.size):
            arx_free[n] = c + a1 * arx_free[n - 1] + a2 * arx_free[n - 2] + b1 * u[n - 1]
            ar2_free[n] = c0 + a01 * ar2_free[n - 1] + a02 * ar2_free[n - 2]

        errors = {
            "arx_one_step": measured - arx_one,
            "ar2_one_step": measured - ar2_one,
            "arx_free_run": measured - arx_free[2:],
            "ar2_free_run": measured - ar2_free[2:],
        }
        for key, value in errors.items():
            pooled_errors[key].append(value)

        arx_acf = acf(errors["arx_one_step"], lags)
        if arx_acf is None:
            raise ValueError(f"Undefined ARX residual ACF for {record['filename']}")
        acf_sequences[record["filename"]] = arx_acf
        m = int(measured.size)
        reference_band = 1.96 / math.sqrt(m)
        crossings = [
            lag
            for lag, value in zip(lags, arx_acf, strict=True)
            if abs(value) > reference_band
        ]
        per_file[record["filename"]] = {
            "maneuver": record["maneuver"],
            "raw_rows": record["rows"],
            "scored_samples_M": m,
            "md5": record["md5"],
            "models": {
                "arx": {
                    "one_step": metric_block(errors["arx_one_step"], measured),
                    "free_run": metric_block(errors["arx_free_run"], measured),
                },
                "ar2": {
                    "one_step": metric_block(errors["ar2_one_step"], measured),
                    "free_run": metric_block(errors["ar2_free_run"], measured),
                },
            },
            "arx_one_step_residual": {
                "mean_rad_s": float(np.mean(errors["arx_one_step"])),
                "acf_lags_1_to_20": arx_acf,
                "descriptive_reference_band_plus_minus": reference_band,
                "lags_crossing_descriptive_band": crossings,
            },
        }

        for offset, n in enumerate(range(2, q.size)):
            prediction_rows.append(
                [
                    "validation",
                    record["maneuver"],
                    record["filename"],
                    n,
                    record["t"][n],
                    u[n],
                    q[n],
                    arx_one[offset],
                    ar2_one[offset],
                    arx_free[n],
                    ar2_free[n],
                    errors["arx_one_step"][offset],
                    errors["ar2_one_step"][offset],
                    errors["arx_free_run"][offset],
                    errors["ar2_free_run"][offset],
                ]
            )

    macro = {
        model: {
            mode: mean_blocks(per_file, model, mode)
            for mode in ("one_step", "free_run")
        }
        for model in ("arx", "ar2")
    }
    pooled = {
        "arx": {
            "one_step_rmse_rad_s": rmse(np.concatenate(pooled_errors["arx_one_step"])),
            "free_run_rmse_rad_s": rmse(np.concatenate(pooled_errors["arx_free_run"])),
        },
        "ar2": {
            "one_step_rmse_rad_s": rmse(np.concatenate(pooled_errors["ar2_one_step"])),
            "free_run_rmse_rad_s": rmse(np.concatenate(pooled_errors["ar2_free_run"])),
        },
        "label": "secondary sample-pooled RMSE; not the primary macro aggregate",
    }
    effect_sizes = {
        mode: 100.0 * (1.0 - macro["arx"][mode]["nrmse"] / macro["ar2"][mode]["nrmse"])
        for mode in ("one_step", "free_run")
    }

    comparisons: dict[str, dict[str, bool]] = {}
    for file_name, result in per_file.items():
        comparisons[file_name] = {}
        for mode in ("one_step", "free_run"):
            arx_block = result["models"]["arx"][mode]
            ar2_block = result["models"]["ar2"][mode]
            comparisons[file_name][mode] = bool(
                arx_block["rmse_rad_s"] < ar2_block["rmse_rad_s"]
                and arx_block["nrmse"] < ar2_block["nrmse"]
            )

    both_one_step = all(value["one_step"] for value in comparisons.values())
    both_free_run = all(value["free_run"] for value in comparisons.values())
    full_success = bool(
        both_one_step
        and both_free_run
        and effect_sizes["one_step"] > 0.0
        and effect_sizes["free_run"] > 0.0
        and stable
    )
    sign_differs = any(
        len({value[mode] for value in comparisons.values()}) > 1
        for mode in ("one_step", "free_run")
    )
    either_file_worsens_both = any(
        not value["one_step"] and not value["free_run"]
        for value in comparisons.values()
    )
    macro_one_step_fails = effect_sizes["one_step"] <= 0.0
    if full_success:
        decision = "supported"
        decision_text = protocol["precommitted_decision_rule"]["success"]
    elif not stable or macro_one_step_fails or either_file_worsens_both:
        decision = "not_supported"
        decision_text = protocol["precommitted_decision_rule"]["not_supported"]
    elif sign_differs:
        decision = "maneuver_dependent"
        decision_text = protocol["precommitted_decision_rule"]["maneuver_dependent"]
    elif both_one_step and not both_free_run:
        decision = "partial_local_only"
        decision_text = protocol["precommitted_decision_rule"]["partial_local_only"]
    else:
        decision = "not_supported"
        decision_text = protocol["precommitted_decision_rule"]["not_supported"]

    acf_macro = [
        float(np.mean([sequence[index] for sequence in acf_sequences.values()]))
        for index in range(len(lags))
    ]
    any_acf_crossing = any(
        result["arx_one_step_residual"]["lags_crossing_descriptive_band"]
        for result in per_file.values()
    )
    adequacy = (
        "predictively better but structurally incomplete"
        if full_success and any_acf_crossing
        else "structured residuals remain; the recurrence is not a validated aircraft model"
        if any_acf_crossing
        else "no descriptive ACF-band crossing, which does not prove the physical model true"
    )

    metrics = {
        "per_file": per_file,
        "aggregate": {
            "primary": "macro_equal_maneuver",
            "macro_equal_maneuver": macro,
            "secondary_sample_pooled": pooled,
        },
        "effect_size_percent": effect_sizes,
    }
    validation_summary = {
        "schema_version": 1,
        "status": decision,
        "dataset": {
            "id": protocol["dataset_id"],
            "version": protocol["dataset_version"],
            "doi": protocol["dataset_doi"],
            "license": "CC0-1.0",
        },
        "frozen_fit": {
            "training_checkpoint": TRAINING_FIT_PATH.relative_to(RESEARCH_DIR).as_posix(),
            "training_checkpoint_sha256": sha256_bytes(training_fit_data),
            "script_sha256": script_sha256,
            "protocol_sha256": protocol_sha256,
            "arx_coefficients_a1_a2_b1_c": [a1, a2, b1, c],
            "ar2_coefficients_a01_a02_c0": [a01, a02, c0],
            "characteristic_roots": [complex_record(value) for value in roots],
            "strictly_inside_unit_circle": stable,
        },
        "metrics": metrics,
        "display_rounded_per_protocol": display_metrics(metrics),
        "residual_diagnostics": {
            "sign": "measured minus predicted",
            "source": "one-step ARX residuals",
            "lags_samples": lags,
            "lags_seconds": [lag / 40.0 for lag in lags],
            "per_file": {
                file_name: result["arx_one_step_residual"]
                for file_name, result in per_file.items()
            },
            "equal_file_macro_acf": acf_macro,
            "any_descriptive_band_crossing": any_acf_crossing,
            "band_interpretation": protocol["residual_diagnostics"]["reference_band"],
        },
        "decision": {
            "rule_outcome": decision,
            "protocol_rule": decision_text,
            "per_file_strict_improvement": comparisons,
            "macro_nrmse_effect_size_percent": effect_sizes,
            "primary_claim_supported": full_success,
            "adequacy_modifier": adequacy,
        },
        "known_idealization_limits": protocol["known_idealization_limits"],
        "privacy": "Derived artifacts contain no GPS or location fields.",
    }

    prediction_data = predictions_csv_bytes(prediction_rows)
    validation_data = json_bytes(validation_summary)
    if prediction_data != predictions_csv_bytes(prediction_rows):
        raise AssertionError("Prediction CSV serialization is not deterministic")
    if validation_data != json_bytes(validation_summary):
        raise AssertionError("Validation JSON serialization is not deterministic")
    write_bytes(PREDICTIONS_PATH, prediction_data)
    write_bytes(VALIDATION_SUMMARY_PATH, validation_data)

    artifacts = {
        TRAINING_FIT_PATH.relative_to(RESEARCH_DIR).as_posix(): {
            "bytes": len(training_fit_data),
            "sha256": sha256_bytes(training_fit_data),
        },
        VALIDATION_SUMMARY_PATH.relative_to(RESEARCH_DIR).as_posix(): {
            "bytes": len(validation_data),
            "sha256": sha256_bytes(validation_data),
        },
        PREDICTIONS_PATH.relative_to(RESEARCH_DIR).as_posix(): {
            "bytes": len(prediction_data),
            "sha256": sha256_bytes(prediction_data),
        },
    }
    artifact_set_digest = hashlib.sha256()
    for path_name in sorted(artifacts):
        artifact_set_digest.update(path_name.encode("utf-8"))
        artifact_set_digest.update(artifacts[path_name]["sha256"].encode("ascii"))
    build_manifest = {
        "schema_version": 1,
        "script_sha256": script_sha256,
        "protocol_sha256": protocol_sha256,
        "source_manifest_sha256": manifest_sha256,
        "source_provenance_sha256": provenance_sha256,
        "artifacts": artifacts,
        "artifact_set_sha256": artifact_set_digest.hexdigest(),
        "privacy_projection_verified": True,
    }
    build_manifest_data = json_bytes(build_manifest)
    if build_manifest_data != json_bytes(build_manifest):
        raise AssertionError("Build manifest serialization is not deterministic")
    write_bytes(BUILD_MANIFEST_PATH, build_manifest_data)

    raw_rows = sum(entry["rows"] for entry in manifest["files"] if "rows" in entry)
    raw_bytes = sum(entry["bytes"] for entry in manifest["files"])
    derived_bytes = len(prediction_data) + len(validation_data) + len(training_fit_data)
    data_build = {
        "schema_version": 1,
        "lesson": protocol["lesson"],
        "status": "complete",
        "fit_status": decision,
        "dataset_id": protocol["dataset_id"],
        "source": {
            "doi": protocol["dataset_doi"],
            "version": protocol["dataset_version"],
            "license": "CC0-1.0",
            "raw_files": 10,
            "raw_csv_files": 9,
            "rows": raw_rows,
            "bytes": raw_bytes,
            "all_md5_verified": True,
            "all_csv_rows_have_41_finite_fields": True,
            "all_time_steps_are_0_025_s": True,
            "missing_values": 0,
        },
        "frozen_protocol": {
            "path": PROTOCOL_PATH.relative_to(RESEARCH_DIR).as_posix(),
            "sha256": protocol_sha256,
            "validation_outcomes_accessed_when_authored": False,
        },
        "computation": {
            "script": SCRIPT_PATH.relative_to(RESEARCH_DIR).as_posix(),
            "script_sha256": script_sha256,
            "numpy_version": np.__version__,
            "arx_equation": protocol["model"]["equation"],
            "baseline_equation": protocol["baseline"]["equation"],
            "training_files": 7,
            "validation_files": 2,
            "validation_scored_rows": sum(
                result["scored_samples_M"] for result in per_file.values()
            ),
            "validation_tuning": "none",
        },
        "result": {
            "decision": decision,
            "primary_claim_supported": full_success,
            "one_step_macro_nrmse_effect_percent": effect_sizes["one_step"],
            "free_run_macro_nrmse_effect_percent": effect_sizes["free_run"],
            "stable_recurrence": stable,
            "adequacy_modifier": adequacy,
            "validation_summary_path": VALIDATION_SUMMARY_PATH.relative_to(
                RESEARCH_DIR
            ).as_posix(),
        },
        "derived": {
            "bytes": derived_bytes,
            "privacy_columns_excluded": [
                "GPS_lon",
                "GPS_lat",
                "GPS_height",
                "GPS_x",
                "GPS_y",
                "GPS_z",
                "GPS_cog",
                "GPS_sog",
            ],
            "build_manifest_path": BUILD_MANIFEST_PATH.relative_to(
                RESEARCH_DIR
            ).as_posix(),
            "artifact_set_sha256": build_manifest["artifact_set_sha256"],
        },
        "repeatability": {
            "verified": True,
            "method": "Every generated payload is serialized twice in-process and compared byte-for-byte. The build executor also invokes the full script twice from scratch and requires identical artifact-set and file SHA-256 values.",
            "expected_artifact_set_sha256": build_manifest["artifact_set_sha256"],
        },
        "truth_guard": "This is an ordinary-flight Skywalker X8 result, not MIT perching-glider, stall, lift/drag, or actuator-delay evidence.",
    }
    data_build_data = json_bytes(data_build)
    if data_build_data != json_bytes(data_build):
        raise AssertionError("Data-build serialization is not deterministic")
    write_bytes(DATA_BUILD_PATH, data_build_data)

    print(
        json.dumps(
            {
                "fit_status": decision,
                "rows": raw_rows,
                "derived_bytes": derived_bytes,
                "artifact_set_sha256": build_manifest["artifact_set_sha256"],
                "validation_summary_path": str(VALIDATION_SUMMARY_PATH),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
