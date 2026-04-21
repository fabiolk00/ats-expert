# 66-01 Summary

Phase 66 finished the internal cleanup around legacy raw ATS score naming without changing product behavior.

## Delivered

- Renamed the internal runtime/persistence field from `atsScore` to `internalHeuristicAtsScore`.
- Kept legacy `atsScore` only on compatibility adapters and explicitly documented it as non-canonical.
- Updated runtime, context builders, agent persistence, and tests to use the explicit heuristic-diagnostic naming internally.
- Added comments around analyzer and compatibility types to make the semantic boundary obvious.
- Preserved ATS Readiness v2 as the sole product-facing score contract.
