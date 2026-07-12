#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "decide_next_action.py"
spec = importlib.util.spec_from_file_location("decision", SCRIPT)
module = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(module)


def session(gate: str, **evidence: object) -> dict[str, object]:
    defaults: dict[str, object] = {
        "score": 0,
        "independent": False,
        "hints": 0,
        "assessment_items": [],
        "set_scores": [],
        "explanation_passed": False,
        "delayed_pass": False,
        "novel_task_pass": False,
        "transfer_dimensions": {},
    }
    defaults.update(evidence)
    return {"gate": gate, "evidence": defaults, "errors": [], "remediation_cycles_this_session": 0}


cases: list[tuple[str, dict[str, object], str, str]] = [
    ("understand pass", session("UNDERSTAND", score=90, independent=True, explanation_passed=True, assessment_items=[{}]), "PASS", "NONE"),
    ("understand needs independence", session("UNDERSTAND", score=90, explanation_passed=True, assessment_items=[{}]), "RETRY", "NONE"),
    ("fluent all sets pass", session("FLUENT", independent=True, set_scores=[88, 92], hints=1), "PASS", "NONE"),
    ("fluent rejects weak set", session("FLUENT", independent=True, set_scores=[100, 70], hints=0), "RETRY", "NONE"),
    ("master waits for delay", session("MASTER", score=95, independent=True, delayed_pass=False, assessment_items=[{}]), "DEFER", "NONE"),
    ("master pass", session("MASTER", score=95, independent=True, delayed_pass=True, assessment_items=[{}]), "PASS", "NONE"),
    ("apply pass", session("APPLY", score=85, independent=True, novel_task_pass=True, transfer_dimensions={"method_selection": 15, "explanation": 15}), "PASS", "NONE"),
    ("apply needs explanation", session("APPLY", score=85, independent=True, novel_task_pass=True, transfer_dimensions={"method_selection": 20, "explanation": 0}), "RETRY", "NONE"),
    ("review lengthens", session("REVIEW", score=95, independent=True), "PASS", "LENGTHEN"),
    ("review keeps", session("REVIEW", score=85, independent=True), "PASS", "KEEP"),
    ("review shortens", session("REVIEW", score=70, independent=True), "RETRY", "SHORTEN"),
]

for label, payload, expected_decision, expected_review in cases:
    actual = module.decide(payload)
    assert actual["decision"] == expected_decision, (label, actual)
    assert actual["review_action"] == expected_review, (label, actual)

prerequisite = session("UNDERSTAND", score=95, independent=True, explanation_passed=True, assessment_items=[{}])
prerequisite["errors"] = [{"type": "PREREQUISITE", "evidence": "missing"}]
assert module.decide(prerequisite)["decision"] == "BACKTRACK"

concept_review = session("REVIEW", score=95, independent=True)
concept_review["errors"] = [{"type": "CONCEPT", "evidence": "misconception"}]
assert module.decide(concept_review)["review_action"] == "REOPEN"

print(f"PASS: {len(cases) + 2} decision cases")
