# Phase 65 Context

## Goal

Promote the canonical ATS Readiness contract to an explicit v2, normalize legacy readiness payloads into the v2 shape centrally, and reduce residual ambiguity between raw heuristic ATS telemetry and the product-facing readiness contract.

## Constraints

- Preserve the Phase 62/63/64 product contract decisions: raw vs displayed separation, monotonicity, floor 89, cap 95, and canonical fallback ownership.
- Keep legacy session loading backward compatible without inventing ad hoc score semantics in routes or UI.
- Do not treat raw `atsScore` as the main product score again.
- Keep user-facing ATS Readiness messaging aligned with the current exact-versus-estimated display semantics.

## Main Risks

- Leaving `ATS_READINESS_CONTRACT_VERSION = 1` after the contract semantics already evolved materially.
- Letting mixed legacy payloads bypass central normalization and reintroduce ambiguous score handling.
- Allowing agent or context strings to present raw ATS telemetry as if it were the product-facing ATS Readiness Score.
- Leaving roadmap/planning state inconsistent after the contract-version bump.
