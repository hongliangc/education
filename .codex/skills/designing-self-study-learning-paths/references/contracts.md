# Learning contracts

## Request

```yaml
mode: PLAN | DIAGNOSE | LEARN | ASSESS | REVIEW | EXTEND
topic: string
learner:
  age_or_level: string
  prior_knowledge: [string]
  reading_or_accessibility_needs: [string]
target:
  observable_behavior: string
  condition: string
  success_standard: string
scope:
  include: [string]
  exclude: [string]
constraints:
  total_time: string
  session_time: string
  tools: [string]
  modalities: [visual, audio, touch, speech, writing]
existing_plan: optional path or object
existing_state: optional path or object
domain_adapter: optional path or object
```

## Course plan

```yaml
course_id: string
plan_version: 1
title: string
target:
  observable_behavior: string
  condition: string
  success_standard: string
prerequisites:
  - id: P1
    name: string
    depends_on: []
units:
  - id: U1
    title: string
    objective: string
    depends_on: [P1]
    outcomes: [string]
    content_ids: [string]
    teaching_order: [string]
    assessments:
      understand: string
      fluent: string
      master: string
      apply: string
excluded_scope: [string]
final_transfer_task: string
review_policy:
  intervals_days: [0, 1, 3, 7, 14, 30]
```

Keep unit and content IDs stable within a plan version. Record a reason and increment `plan_version` when ordering or identity changes. Migrate existing learner state rather than silently dropping it.

## Domain adapter

```yaml
domain: string
learner_band: string
session_limits:
  max_minutes: 10
  max_new_items: 3
content_representations: [string]
activity_types: [string]
input_modalities: [string]
output_modalities: [string]
recognition_requirements: [string]
production_requirements: [string]
stage_evidence:
  understand: [string]
  fluent: [string]
  master: [string]
  apply: [string]
equivalent_explanation_evidence: [string]
fatigue_signals: [string]
fatigue_response: string
common_errors:
  - signal: string
    classification: PREREQUISITE | CONCEPT | PROCEDURE | MEMORY | TRANSFER | CARELESS
    remedy: string
```

Adapters may replace an activity with an age-, accessibility-, or domain-valid equivalent. They may not remove objectives, stable IDs, independent evidence, gate decisions, remediation, or review.

## Learner state

```json
{
  "course_id": "course-id",
  "plan_version": 1,
  "current_unit": "U1",
  "current_gate": "UNDERSTAND",
  "remediation_cycles_this_session": 0,
  "nodes": {
    "U1": {
      "level": "UNKNOWN",
      "scores": [],
      "hint_count": 0,
      "errors": [],
      "evidence": [],
      "last_assessed_at": null
    }
  },
  "review_queue": [],
  "next_action": "Run U1 UNDERSTAND session"
}
```

## Session result

```yaml
session_id: string
course_id: string
unit_id: U1
gate: UNDERSTAND | FLUENT | MASTER | APPLY | REVIEW
target: string
actions_performed: [string]
evidence:
  recall: [string]
  learner_explanation: string | null
  assessment_items:
    - prompt: string
      response: string
      correct: true
  score: 0
  independent: false
  hints: 0
  set_scores: [0]
  explanation_passed: false
  delayed_pass: false
  novel_task_pass: false
  transfer_dimensions:
    result: 0
    method_selection: 0
    explanation: 0
    adaptation: 0
errors:
  - type: PREREQUISITE | CONCEPT | PROCEDURE | MEMORY | TRANSFER | CARELESS
    evidence: string
remediation_cycles_this_session: 0
decision: PASS | RETRY | BACKTRACK | DEFER
review_action: NONE | LENGTHEN | KEEP | SHORTEN | REOPEN
next_action: string
review_updates: []
```

## Evidence rules

- Preserve the learner's response or a faithful short summary.
- Make every score traceable to assessment items.
- Mark evidence independent only when no answer-revealing hint was used.
- Require delayed evidence before marking `MASTERED`.
- Require a novel task, method selection, and justification before marking `TRANSFERRED`.
- Keep recognition and production evidence separate when the domain distinguishes them.
