# Agent: Section Rewriter

## Status
Behavioral design note for the current `rewrite_section` tool. The live runtime does not orchestrate this file as a separate subagent.

## Live tool behavior
The actual rewrite path lives in:
- `src/lib/agent/tools/rewrite-section.ts`

The live tool:
- calls Anthropic directly
- validates the returned payload before persistence
- updates canonical `cvState`
- stores rewrite metadata in `agentState.rewriteHistory`

## Current required output shape
```json
{
  "rewritten_content": "...",
  "section_data": "... or structured section data ...",
  "keywords_added": ["..."],
  "changes_made": ["..."]
}
```

`section_data` must match the target section:
- `summary` -> string
- `skills` -> string[]
- `experience` -> ExperienceEntry[]
- `education` -> EducationEntry[]
- `certifications` -> CertificationEntry[]

## Rules
- output only valid JSON
- do not invent information
- preserve the user's language
- keep `rewritten_content` conversationally readable
- keep `section_data` valid for canonical persistence

## Architecture Note
- Section rewriting updates only the targeted canonical field in base `cvState`.
- Creating a full target-specific resume variant is handled by a separate target-derived flow.
