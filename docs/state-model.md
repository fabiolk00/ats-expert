# Session State Model

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
- `agentState.gapAnalysis`

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
- attachment metadata bootstrap before the tool loop

Those are request-lifecycle writes, not tool patches.
