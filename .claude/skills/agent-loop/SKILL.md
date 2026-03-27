# Skill: Agent Loop

Auto-invoked when working in `src/lib/agent/` or `src/app/api/agent/`.

## What this skill covers
The current production agent loop: session loading, prompt building, tool dispatch, patch application, SSE responses, and credit-aware session creation.

## Live architecture

### Session bundle
- `stateVersion`
- `phase`
- `cvState`
- `agentState`
- `generatedOutput`
- `atsScore`

### State responsibilities
- `cvState`: canonical resume truth
- `agentState`: operational context
- `generatedOutput`: generated artifact metadata
- `cv_versions`: immutable snapshot history
- `resume_targets`: target-specific derived resume variants

### Tool architecture
Tools return:

```ts
type ToolExecutionResult = {
  output: unknown
  patch?: ToolPatch
}
```

Dispatcher flow:
1. `executeTool()`
2. optional `applyToolPatch()`
3. update live session snapshot
4. continue the Anthropic loop

## Current runtime flow

```text
POST /api/agent
  -> resolve app user
  -> rate limit
  -> validate request
  -> optionally scrape supported job URLs
  -> load or create session
  -> consume one credit on new session creation
  -> increment message count
  -> persist user message
  -> attach file metadata to agentState if a file was uploaded
  -> build prompt from phase + cvState + agentState + atsScore
  -> call Anthropic with tools
  -> dispatch tool calls
  -> persist assistant text
  -> return SSE deltas + final metadata
```

## Phase guidance

### intake
- get resume text or file input
- call `parse_file` for uploaded files
- once resume content is available, move toward `analysis`

### analysis
- call `score_ats`
- present the score with key issues and at least one positive
- collect target job description if available

### dialog
- gather missing details section by section
- call `rewrite_section` for the section being improved
- rely on canonical `cvState` for the current official resume state

### confirm
- summarize changes from canonical state plus rewrite metadata
- require explicit user confirmation before generation

### generation
- call `generate_file`
- use canonical `cvState`
- deliver returned signed URLs

## Tool-specific state flow
- `parse_file` -> `agentState.sourceResumeText`, `agentState.parseStatus`
- `score_ats` -> `atsScore`, optional `agentState.targetJobDescription`
- `analyze_gap` -> `agentState.targetJobDescription`, `agentState.gapAnalysis`
- `rewrite_section` -> targeted `cvState` field + `agentState.rewriteHistory`
- `set_phase` -> `phase`
- `generate_file` -> reads canonical `cvState`, writes `generatedOutput`
- `create_target_resume` -> persists `resume_targets` + `cv_versions` without mutating base `cvState`

## Important realities
- Anthropic is currently called with `stream: false`; SSE is re-streamed word by word
- `/api/file/[sessionId]` is not implemented
- Route-level attachment bootstrap still writes `agentState.attachedFile` before the tool loop starts

## Rules to preserve
- do not reintroduce raw parsed text into `cvState`
- do not mutate `session` directly inside tools
- do not persist signed URLs into `generatedOutput`
- do not use Clerk user IDs in domain logic
- do not overwrite base canonical `cvState` when creating a target-derived resume
