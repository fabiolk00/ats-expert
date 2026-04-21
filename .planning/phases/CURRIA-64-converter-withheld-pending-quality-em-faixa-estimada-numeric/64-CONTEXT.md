# Phase 64 Context

## Goal

Convert ATS enhancement outcomes that previously surfaced as `withheld_pending_quality` into short numeric estimated ranges so the main product flow always shows an exact score or an estimated numeric score band.

## Constraints

- Preserve the canonical ATS Readiness architecture from Phases 62 and 63.
- Keep raw/internal ATS scoring separate from displayed product scoring.
- Preserve monotonic display behavior, floor 89, and cap 95.
- Keep fallback for legacy sessions canonical and safe.
- Keep UI copy in the main ATS enhancement score flow in pt-BR.

## Main Risks

- Letting UI components derive numeric ranges locally instead of consuming the canonical domain contract.
- Regressing to empty optimized scores in comparison, chat, or session surfaces.
- Breaking old persisted readiness payloads that still carry `withheld_pending_quality`.
- Losing Phase 63 observability while changing the display semantics.
