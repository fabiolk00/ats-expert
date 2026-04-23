## Phase 98 Context

### Goal

Replace fragile detector-computed numeric highlight offsets with a hybrid contract that anchors on exact fragment text first and only uses numeric offsets as a fallback.

### Why This Phase Exists

The persisted highlight architecture from Phases 95-97 is stable, but the remaining quality gap was still tied to model-computed `start/end` values:

- spans could stop before the natural semantic closure of the phrase
- the model had to choose the best phrase and count characters at the same time
- short pt-BR measurable phrases were especially vulnerable near the end of the span

### Scope

- Detector contract: `src/lib/agent/tools/detect-cv-highlights.ts`
- Local resolver: `src/lib/resume/cv-highlight-artifact.ts`
- Shared seams and regression proof:
  - `src/lib/agent/tools/detect-cv-highlights.test.ts`
  - `src/lib/resume/cv-highlight-artifact.test.ts`
  - `src/lib/agent/tools/pipeline.test.ts`
  - `src/lib/routes/session-comparison/decision.test.ts`
  - `src/components/resume/resume-comparison-view.test.tsx`

### Hard Constraints

- Keep persisted `highlightState` as numeric ranges only.
- Do not change route payload shape.
- Do not change renderer behavior.
- Fail closed when neither fragment resolution nor numeric fallback is trustworthy.

### Implemented Strategy

1. The detector now returns exact `fragment` text plus `reason`, with nullable `start/end` fallback fields for structured outputs.
2. The server resolves `fragment -> start/end` locally in this order:
   - unique exact substring match
   - unique whitespace-normalized substring match
   - validated numeric fallback
   - fail closed
3. The existing normalization, editorial acceptance, persistence, route, and renderer layers remain intact.
