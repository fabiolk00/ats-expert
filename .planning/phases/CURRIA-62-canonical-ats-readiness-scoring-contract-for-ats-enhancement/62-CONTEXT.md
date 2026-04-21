# Phase 62 Context

## Goal

Replace the ambiguous ATS scoring behavior with one canonical ATS Readiness scoring contract for ATS enhancement flows.

## Starting Point

- The codebase already had raw heuristic ATS scoring via `scoreATS(...)` plus other ATS-like derived numbers.
- Product surfaces were mixing raw heuristic numbers directly into UI and comparison flows.
- Successful ATS enhancement could still show an optimized score lower than the original score.

## Focus

- Preserve raw heuristic ATS scoring for diagnostics, telemetry, and internal compatibility.
- Introduce one product-facing ATS Readiness contract with confidence, quality gates, withholding, and monotonic post-enhancement display behavior.
- Migrate ATS enhancement UI/API surfaces to the canonical readiness contract without reopening the rewrite pipeline itself.
