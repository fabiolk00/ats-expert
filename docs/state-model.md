---
title: CurrIA Session State Model
audience: [developers, architects]
related: [INDEX.md, CONCEPTS.md, architecture-overview.md, tool-development.md]
status: current
updated: 2026-04-06
---

# Session State Model

Back to [Documentation Index](./INDEX.md) | Start with [Concepts](./CONCEPTS.md)

## Top-level session bundle

```ts
type Session = {
  id: string
  userId: string
  stateVersion: number
  phase: Phase
  cvState: CVState
  agentState: AgentState
  generatedOutput: GeneratedOutput
  atsScore?: ATSScoreResult
  creditsUsed: number
  messageCount: number
  creditConsumed: boolean
  createdAt: Date
  updatedAt: Date
}
```

## `stateVersion`
- Top-level only
- Defaults to `1`
- Used to normalize older or incomplete rows
- Increment only when bundle shape or interpretation changes

## `cvState`

Purpose: canonical structured resume.

Allowed responsibilities:
- contact data
- summary
- experience
- skills
- education
- certifications

Disallowed responsibilities:
- raw parsed text
- target job description
- file metadata
- generated file paths
- immutable history
- target-specific variants

## `agentState`

Purpose: operational context for the agent runtime.

Current responsibilities:
- parsed resume text
- target job description
- target fit assessment
- parse status and parse errors
- attachment metadata
- rewrite history
- latest structured gap analysis
- phase-local metadata

Notes:
- `rewriteHistory` is section-keyed and currently stores the latest known rewrite per section.
- It is not the canonical resume state. The canonical rewrite must also be persisted to `cvState`.

## `generatedOutput`

Purpose: durable artifact metadata.

Allowed fields:
- `status`
- `docxPath`
- `pdfPath`
- `generatedAt`
- `error`

Disallowed fields:
- signed URLs
- resume content
- prompt data

## `user_profiles.cv_state`

Purpose: imported or manually edited seed resume state outside active sessions.

Rules:
- uses the same `CVState` shape as session `cvState`
- is profile-seed state, not the active session truth
- should be validated at the repository boundary instead of leaking raw JSON
- may seed a new session, but does not replace session version history

## `cv_versions`

Purpose: immutable history of trusted `CVState` snapshots.

Stored fields:
- `sessionId`
- `targetResumeId?`
- `snapshot`
- `source`
- `createdAt`

Rules:
- snapshots are immutable
- no raw parsed resume text belongs here
- current sources:
  - `ingestion`
  - `rewrite`
  - `manual`
  - `target-derived`

## `resume_targets`

Purpose: multiple target-specific derived resumes per canonical session.

Stored fields:
- `sessionId`
- `targetJobDescription`
- `derivedCvState`
- `gapAnalysis?`
- `generatedOutput?`
- `createdAt`
- `updatedAt`

Rules:
- these rows do not replace base `cvState`
- multiple targets may coexist for one session
- each `derivedCvState` must validate as a full `CVState`
- target-generated files persist on the target row, not on the base session

## `resume_generations`

Purpose: immutable billing-aware generation history for base and target exports.

Structured JSON fields:
- `sourceCvSnapshot`
- `generatedCvState?`

Rules:
- both snapshot fields should validate as full `CVState`
- these rows preserve render-time truth for replay, billing safety, and download continuity
- they are not a substitute for mutable session state

## `processed_events.event_payload`

Purpose: provider-event audit payload.

Rules:
- this is an intentionally opaque event payload seam
- it exists for dedupe, replay support, and operator forensics
- do not treat it as stable product state unless a dedicated domain contract is introduced

## Patch model

```ts
type ToolPatch = Partial<{
  phase: Session['phase']
  cvState: Partial<CVState>
  agentState: AgentStatePatch
  generatedOutput: Partial<GeneratedOutput>
  atsScore: ATSScoreResult
}>
```

Patch rules:
- patches must be minimal
- unrelated fields must survive a merge
- nested `agentState` structures merge rather than replace wholesale
- malformed output must be rejected before patch creation
- `cv_versions` and `resume_targets` are persisted through explicit trusted flows, not as session patch buckets

## State evolution examples

### `parse_file`
Input effect:
- parses PDF, DOCX, or image input

Persisted effect:
- `agentState.parseStatus = 'parsed'`
- `agentState.sourceResumeText = extractedText`
- validated ingestion may populate canonical `cvState`
- first canonical population creates a `cv_versions` snapshot

### `rewrite_section`
Input effect:
- requests a rewrite for one section

Persisted effect:
- targeted field in `cvState` is updated
- corresponding section in `agentState.rewriteHistory` is updated
- canonical changes create a `cv_versions` snapshot

### Manual canonical edit
Input effect:
- applies one validated user-provided edit to base canonical `cvState`

Persisted effect:
- only the targeted base section in `cvState` is updated
- unchanged edits do not persist and do not create new versions
- successful changes create a `cv_versions` snapshot with source `manual`
- target-derived rows in `resume_targets` remain unchanged

### `analyze_gap`
Persisted effect:
- `agentState.targetJobDescription`
- `agentState.targetFitAssessment`
- `agentState.gapAnalysis`

### Route-level target detection
Persisted effect:
- high-confidence pasted vacancies can update `agentState.targetJobDescription` before the model loop starts
- if enough resume context already exists, the first analysis turn may bootstrap ATS scoring and structured gap analysis deterministically

Rules:
- these writes are operational context only and do not mutate canonical `cvState`
- if the detected target changes, stale fit/gap context must be cleared before recalculation

### `create_target_resume`
Persisted effect:
- new `resume_targets` row
- optional structured target gap analysis on that row
- `cv_versions` snapshot with source `target-derived`
- canonical base `cvState` remains unchanged

### `generate_file`
Input effect:
- reads canonical `cvState` by default
- reads `resume_targets.derivedCvState` only when an explicit `target_id` is selected

Persisted effect:
- base generation updates `session.generatedOutput`
- target generation updates `resume_targets.generatedOutput`
- both persist only:
  - `status`
  - `docxPath`
  - `pdfPath`
  - `generatedAt`
  - `error`

## Current non-tool exceptions
The tool dispatcher owns tool-originated state mutation. There are still route-level writes outside the dispatcher for:
- session creation
- message count and message persistence
- attachment preprocessing before the tool loop
- early target-job detection and deterministic analysis bootstrap when appropriate

Those are request-lifecycle writes, not tool patches.

## Related Documentation

- [Core Concepts](./CONCEPTS.md) - plain-English explanation of state boundaries.
- [Architecture Overview](./architecture-overview.md) - request flows and runtime boundaries.
- [Tool Development Guide](./tool-development.md) - how tools should read and update state.
