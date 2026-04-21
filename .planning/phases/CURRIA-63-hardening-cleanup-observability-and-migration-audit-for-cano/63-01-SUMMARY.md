# 63-01 Summary

- Added `ATS_READINESS_CONTRACT_VERSION`, structured ATS Readiness decision logging, readiness outcome counters, and a canonical session-level readiness resolver that upgrades older persisted readiness payloads and derives safe legacy fallbacks through the canonical module only.
- Updated ATS comparison, session serialization, and settings/recent-session surfaces to resolve readiness through the canonical session helper instead of relying on direct `atsScore` fallback in product-facing code.
- Standardized a withheld-state badge for recent-session lists and kept remaining raw `atsScore` fields clearly compatibility-only in shared types and route serialization.
- Added regression coverage for readiness observability payloads, legacy-session fallback resolution, comparison safety with legacy raw-only sessions, and withheld rendering in product-adjacent UI.
