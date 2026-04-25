# Phase 104 Plan Review

## Verdict

Issues found. `104-01-PLAN.md` is close to the right shape and stays within the intended small-change surface, but it is not executable as-is yet.

## What is solid

- The plan stays aligned with the locked decisions in `104-CONTEXT.md`: it reuses the existing server-side weak-fit logic, keeps the backend fallback authoritative, and avoids a broad workspace or agent rewrite.
- The task split is coherent: snapshot exposure, backend continue path, and chat modal are separated cleanly.
- The verification commands are focused and map to the intended seams.

## Blockers

### 1. Snapshot-only wiring does not guarantee the modal on the first `Aceito` click

The plan says the weak-fit checkpoint should reach chat through the existing workspace snapshot refresh path (`104-01-PLAN.md:181-224`). That is not enough to guarantee the phase goal.

Today `ChatInterface` decides whether to show the generation CTA from its own local `phase` and `atsReadiness` state (`src/components/dashboard/chat-interface.tsx:486`, `src/components/dashboard/chat-interface.tsx:1034-1057`). It updates that local state immediately from the stream `done` chunk (`src/components/dashboard/chat-interface.tsx:841-853`) before `ResumeWorkspace` finishes its follow-up `refreshWorkspace(...)` call (`src/components/dashboard/resume-workspace.tsx:485-496`). The session route is also currently the only place the new checkpoint would exist (`src/app/api/session/[id]/route.ts:107-140`).

That leaves a real race:

- the `Aceito` button can appear from the `done` chunk
- the snapshot-derived `weakFitCheckpoint` prop can still be stale or absent
- a fast click can still POST directly to `/api/agent`

The backend fallback would still protect safety, but the user-facing phase goal is stricter: the modal should open instead of sending generation immediately for weak-fit targeting. The current plan does not close that timing seam.

Fix:

- Either add the derived checkpoint to `AgentDoneChunk` and update chat from the same stream event that enables the CTA (`src/types/agent.ts:539-553`), or
- prevent the CTA from becoming actionable until the refreshed workspace snapshot that carries `careerFitCheckpoint` has landed.

Also add a test that covers the `done` -> first click timing path, not just steady-state rendering after the prop already exists.

### 2. Research is not fully resolved for the exact timing seam the plan depends on

`104-RESEARCH.md` still has an unresolved `## Open Questions` section about whether the checkpoint also needs to be added to `AgentDoneChunk` (`104-RESEARCH.md:252-263`). That question is not incidental; it is the same race described above.

Because the plan chooses snapshot-first while the research still leaves the stream-timing question open, execution would be starting with an unresolved delivery-critical assumption.

Fix:

- Resolve the `AgentDoneChunk` question in research first.
- Revise the plan so the chosen strategy is explicit in Task 1 and Task 3.

### 3. Nyquist validation artifact is missing

Phase 104 research includes a `Validation Architecture` section (`104-RESEARCH.md:265-280`), and `.planning/config.json` has `workflow.nyquist_validation: true`. But the phase directory does not contain any `*-VALIDATION.md` file.

That is a process blocker for this plan gate.

Fix:

- Generate the phase validation artifact before execution, then re-run the plan review.

## Warning

### Scope is near the upper bound for one plan

`104-01-PLAN.md` spans 12 modified files across route, types, workspace, chat, agent logic, and tests (`104-01-PLAN.md:7-19`). That is still workable for this feature, but any added fix for the timing race could push it from "focused cross-layer change" into "too much in one pass."

Fix:

- Keep it as one plan only if the race fix remains small.
- If the chosen fix expands beyond a narrow state-contract adjustment, split out a small prerequisite plan for the checkpoint transport/test seam.

## Structured Issues

```yaml
issues:
  - plan: "104-01"
    dimension: "key_links_planned"
    severity: "blocker"
    description: "Snapshot-only checkpoint wiring does not guarantee the weak-fit modal intercept before the first Aceito click."
    task: 1
    fix_hint: "Add the checkpoint to AgentDoneChunk or hold the CTA until the refreshed workspace snapshot with careerFitCheckpoint arrives, and test the done-to-first-click race."
  - plan: "104-01"
    dimension: "research_resolution"
    severity: "blocker"
    description: "104-RESEARCH.md still has an unresolved Open Questions section for the AgentDoneChunk checkpoint timing decision."
    fix_hint: "Resolve the open question and revise Tasks 1 and 3 to implement the chosen transport path explicitly."
  - plan: "104-01"
    dimension: "nyquist_compliance"
    severity: "blocker"
    description: "Phase 104 has Validation Architecture in RESEARCH.md but no *-VALIDATION.md artifact while nyquist_validation is enabled."
    fix_hint: "Generate the phase validation artifact before execution and rerun plan review."
  - plan: "104-01"
    dimension: "scope_sanity"
    severity: "warning"
    description: "Single plan spans 12 files across route, agent, workspace, chat, and tests."
    fix_hint: "Keep as one plan only if the timing-race fix stays small; otherwise split a narrow prerequisite plan."
```

## Recommendation

Do not execute `104-01-PLAN.md` yet. Resolve the checkpoint transport decision, add the missing validation artifact, and then re-check the plan. After those fixes, the overall approach should still achieve the phase goal without requiring a broad rewrite.
