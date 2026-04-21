# 75-01 Summary

Phase 75 treated the Phase 74 fix as review-first hardening instead of assuming the first policy was already final.

## What changed

- the stale preserved artifact state is now explicit through `artifactStale` metadata in file-access responses
- preview UI shows a warning when the available PDF still corresponds to the previous saved version
- manual-save responses now differentiate normal refresh from deferred refresh more explicitly
- route, preview, modal, and file-access tests now cover the dangerous “save persisted but PDF still old” path

## Outcome

Phase 74 is accepted in adjusted form, not as originally implemented. Keeping the previous PDF available during a real same-scope export is acceptable only because the product now marks that artifact as stale instead of silently serving it as if it were current.
