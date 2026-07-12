#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
skill = (ROOT / "SKILL.md").read_text(encoding="utf-8")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"FAIL: {message}")


frontmatter = re.match(r"^---\n(.*?)\n---\n", skill, flags=re.S)
require(frontmatter is not None, "missing frontmatter")
require("name: designing-self-study-learning-paths" in skill, "wrong skill name")
require("description: Use when" in skill, "description must start with Use when")
require("DIAGNOSE" in skill, "missing DIAGNOSE mode")
require("TODO" not in skill and "TBD" not in skill, "unfinished placeholder in SKILL.md")

for relative in [
    "references/contracts.md",
    "references/methods.md",
    "references/stage-playbooks.md",
    "references/example-hanzi-direction.md",
    "assets/course-plan.yaml",
    "assets/domain-adapter.yaml",
    "assets/learner-state.json",
    "assets/session-result.json",
    "scripts/decide_next_action.py",
]:
    require((ROOT / relative).is_file(), f"missing {relative}")

json.loads((ROOT / "assets" / "learner-state.json").read_text(encoding="utf-8"))
session = json.loads((ROOT / "assets" / "session-result.json").read_text(encoding="utf-8"))
require("evidence" in session and "errors" in session, "invalid session result contract")

test = subprocess.run([sys.executable, str(ROOT / "scripts" / "test_decide_next_action.py")], capture_output=True, text=True)
require(test.returncode == 0, test.stdout + test.stderr)
print("PASS: skill files, contracts, templates, and decision tests")
