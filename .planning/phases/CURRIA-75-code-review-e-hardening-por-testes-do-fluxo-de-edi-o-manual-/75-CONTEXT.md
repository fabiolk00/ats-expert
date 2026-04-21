# Phase 75 Context

## Problem

Phase 74 removed the save/download deadlock for manual resume edits during export, but it still left one product ambiguity:

- a manual edit could be saved while a same-scope export was active
- the previous ready PDF could remain downloadable
- the client was not told explicitly that this available artifact was now stale relative to the saved edit

That meant the backend state was more defensible than before, but the product contract was still too implicit.

## Review conclusion

The Phase 74 policy was directionally correct but not fully approved as implemented.

What was good:

1. unrelated exports no longer blocked manual save or regeneration
2. same-scope active exports no longer pushed the user into a save/download dead zone
3. the editor could distinguish save persistence from deferred PDF refresh

What was still fragile:

1. stale preserved artifacts were not explicit in the file-access contract
2. preview/download surfaces could keep serving the previous PDF without clearly saying it was out of date
3. the dangerous “save persisted, PDF still old” state was not hardened enough by tests

## Intended Phase 75 adjustment

- keep the core Phase 74 policy
- expose stale preserved artifacts explicitly through file-access metadata
- surface that state in the preview UI
- strengthen the modal copy around deferred refresh
- add regression coverage proving the system no longer hides stale artifact state behind a generic “available” PDF
