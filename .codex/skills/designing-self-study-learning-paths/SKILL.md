---
name: designing-self-study-learning-paths
description: Use when designing, extending, or running a structured self-study curriculum, lesson sequence, diagnostic, assessment, mastery loop, remediation, spaced review, or learning-domain adapter for one learner, especially when content risks becoming random, directionless, unmeasurable, or disconnected from retained evidence.
---

# Designing Self-Study Learning Paths

## Core rule

Lock a purposeful, versioned learning map before teaching. Move each required unit through evidence-backed gates:

`UNKNOWN → UNDERSTANDING → FLUENT → MASTERED → TRANSFERRED`

Randomize practice presentation only inside an already selected legal content pool. Never use randomness to choose the curriculum direction or introduce unsequenced new content.

## Resolve the request

Read `references/contracts.md`. Resolve the topic, learner profile, observable target, scope, time, available modalities, existing plan/state, and mode:

`PLAN | DIAGNOSE | LEARN | ASSESS | REVIEW | EXTEND`

State missing assumptions. For a child or accessibility need, require a domain adapter before running lessons.

## Execute one mode

### PLAN

Create prerequisites, stable unit IDs, ordered syllabus, stage assessments, final transfer task, and review policy.

### DIAGNOSE

Test without teaching; select the earliest unmet prerequisite and gate from evidence.

### LEARN

Load one unit and current gate; run its playbook from `references/stage-playbooks.md`.

### ASSESS

Collect independent evidence without answer leakage; classify errors and decide the next action.

### REVIEW

Retrieve before showing notes; lengthen, keep, or shorten the interval, or reopen a gate.

### EXTEND

Create a domain adapter defining representations, activities, evidence, common errors, age/accessibility constraints, and recognize-versus-produce requirements.

## Select methods by need

Read `references/methods.md`. Use concrete-to-abstract progression, active recall, faded examples, deliberate practice, Feynman explanation, spacing, or interleaving only when appropriate to the learner and diagnosed gap. Do not require a verbal Feynman explanation for every task; accept an age- and domain-valid equivalent such as pointing, sorting, demonstrating, drawing, teaching a toy, or completing a novel example.

## Decide and persist

Use `scripts/decide_next_action.py` with a Session Result matching `references/contracts.md`.

- `PASS`: advance to the next gate; after `APPLY`, mark `TRANSFERRED`.
- `RETRY`: change the method, then use an equivalent new assessment.
- `BACKTRACK`: return to the earliest missing prerequisite.
- `DEFER`: persist the gap after two remediation cycles in one session and continue later.

Never repeat the same explanation unchanged. Never record a level without retained evidence. Persist the updated learner state and review queue after every session.

## Required output

Return:

1. unit, gate, and observable session target;
2. recall or diagnostic evidence;
3. actions actually performed;
4. learner-produced understanding evidence when the gate requires it;
5. independent assessment items and responses;
6. primary error classification;
7. gate decision and review action;
8. next action and updated learner state.

Use the templates under `assets/`. For a complete example, read `references/example-hanzi-direction.md`.

## Completion rule

Complete a course only when every required unit is at least `MASTERED`, critical units pass delayed retrieval, and the final novel task passes the transfer rubric.

## Stop conditions

Stop and repair the design when content lacks a unit ID or objective, a learner advances after failing, new content is drawn from an unrestricted pool, feedback lacks error diagnosis, the tutor supplies the learner's evidence, recognition and production are conflated, review dates are absent, or a score lacks retained assessment evidence.
