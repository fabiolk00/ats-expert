# Phase 63 Context

## Goal

Harden the canonical ATS Readiness scoring contract by removing residual product-path ambiguity, adding decision observability, and proving old sessions remain safe after the Phase 62 scoring refactor.

## Starting Point

- Phase 62 introduced a canonical ATS Readiness contract, but some product surfaces still had legacy score-shaped props or direct `atsScore` fallbacks.
- Session and comparison routes were still deriving ATS Readiness locally instead of resolving through one session-scoped canonical helper.
- There was no dedicated structured observability for ATS Readiness decisions, floor-89 application, withholding, or legacy fallback usage.

## Focus

- Centralize session-level ATS Readiness resolution and legacy fallback handling.
- Add contract-versioned logs and counters for ATS Readiness decisions without logging resume content or PII.
- Remove residual product-facing legacy score sourcing and document the migration behavior for old sessions.
