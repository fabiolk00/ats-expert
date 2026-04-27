# Quick Task 260427-qtr

## Goal

Lock the semantic evidence contract so `buildTargetingPlan()` remains legacy-only and `buildTargetedRewritePlan()` stays the only enriched targeted-rewrite entrypoint.

## Scope

- audit and reinforce call sites
- strengthen the enriched wrapper API with explicit targeted-rewrite intent
- document the contract inline
- preserve `undefined` vs `0` trace semantics
- harden 3+ acronym handling with contextual tests
- add regression tests for prompts and builder entrypoints
