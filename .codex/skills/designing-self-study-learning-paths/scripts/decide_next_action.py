#!/usr/bin/env python3
"""Decide the next learning action from a Session Result JSON file."""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import TypedDict, cast


class Decision(TypedDict):
    decision: str
    review_action: str
    next_action: str


REMEDIES = {
    "PREREQUISITE": "Backtrack to the earliest missing prerequisite and verify it.",
    "CONCEPT": "Change representation, add a near-miss, then retest with new items.",
    "PROCEDURE": "Use one worked example, fade support, then retest.",
    "MEMORY": "Use active recall, brief relearning, and schedule an earlier review.",
    "TRANSFER": "Compare task signals and interleave contrasting cases.",
    "CARELESS": "Apply a fixed self-check routine, then retest independently.",
}


def decide(data: dict[str, object]) -> Decision:
    gate = text(data.get("gate")).upper()
    evidence = mapping(data.get("evidence"))
    score = number(evidence.get("score"))
    hints = integer(evidence.get("hints"))
    independent = boolean(evidence.get("independent"))
    assessment_items = sequence(evidence.get("assessment_items"))
    errors = error_types(data.get("errors"))

    if "PREREQUISITE" in errors:
        return result("BACKTRACK", "NONE", REMEDIES["PREREQUISITE"])

    if gate == "REVIEW":
        return review_decision(score, independent, errors)

    passed = False
    if gate == "UNDERSTAND":
        passed = (
            score >= 80
            and independent
            and bool(assessment_items)
            and boolean(evidence.get("explanation_passed"))
        )
    elif gate == "FLUENT":
        set_scores = [number(value) for value in sequence(evidence.get("set_scores"))]
        passed = (
            len(set_scores) >= 2
            and all(value >= 85 for value in set_scores)
            and hints <= 1
            and independent
        )
    elif gate == "MASTER":
        immediate_pass = score >= 90 and independent and hints == 0 and bool(assessment_items)
        if immediate_pass and not boolean(evidence.get("delayed_pass")):
            return result("DEFER", "NONE", "Schedule the delayed mastery assessment before advancing.")
        passed = immediate_pass and boolean(evidence.get("delayed_pass")) and "CONCEPT" not in errors
    elif gate == "APPLY":
        dimensions = mapping(evidence.get("transfer_dimensions"))
        passed = (
            score >= 80
            and independent
            and boolean(evidence.get("novel_task_pass"))
            and number(dimensions.get("method_selection")) > 0
            and number(dimensions.get("explanation")) > 0
        )
    else:
        raise ValueError(f"Unsupported gate: {gate!r}")

    if passed:
        return result("PASS", "NONE", f"Advance from {gate} according to the learner state.")

    cycles = integer(data.get("remediation_cycles_this_session"))
    if cycles >= 2:
        return result("DEFER", "NONE", "Persist the gap and schedule continuation without another remediation cycle.")

    primary_error = errors[0] if errors else "CONCEPT"
    return result("RETRY", "NONE", REMEDIES.get(primary_error, REMEDIES["CONCEPT"]))


def review_decision(score: float, independent: bool, errors: list[str]) -> Decision:
    if "CONCEPT" in errors:
        return result("RETRY", "REOPEN", "Reopen UNDERSTAND with a different representation.")
    if score >= 90 and independent:
        return result("PASS", "LENGTHEN", "Move to the next review interval.")
    if score >= 80 and independent:
        return result("PASS", "KEEP", "Keep the current review interval.")
    return result("RETRY", "SHORTEN", "Shorten the review interval and reopen the diagnosed gate.")


def result(decision: str, review_action: str, next_action: str) -> Decision:
    return {"decision": decision, "review_action": review_action, "next_action": next_action}


def mapping(value: object) -> dict[str, object]:
    return cast(dict[str, object], value) if isinstance(value, dict) else {}


def sequence(value: object) -> list[object]:
    return cast(list[object], value) if isinstance(value, list) else []


def error_types(value: object) -> list[str]:
    result_types: list[str] = []
    for error in sequence(value):
        if isinstance(error, dict):
            error_type = text(error.get("type")).upper()
            if error_type:
                result_types.append(error_type)
    return result_types


def text(value: object) -> str:
    return value if isinstance(value, str) else ""


def number(value: object) -> float:
    if isinstance(value, bool):
        return 0
    if isinstance(value, (int, float)):
        return float(value)
    return 0


def integer(value: object) -> int:
    return int(number(value))


def boolean(value: object) -> bool:
    return value is True


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: decide_next_action.py session-result.json", file=sys.stderr)
        return 2
    try:
        data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            raise ValueError("Session result must be a JSON object")
        output = decide(cast(dict[str, object], data))
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(output, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
