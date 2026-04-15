# Quick Task 260415-r14

## Goal

Improve job-targeting validation observability, harden `targetRole` extraction, and cover the validation-failure path with focused tests.

## Scope

1. Log exact validation issues when `job_targeting` fails at validation.
2. Prevent weak extracted roles such as `BI.` from becoming the targeting role when richer prose exists.
3. Add regression coverage for the validation-failure path and the stronger target-role extraction behavior.
