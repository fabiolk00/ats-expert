# Quick Task 260415-wjw Plan

## Goal

Restore the previous resume setup layout and refine the generation loading overlay so it feels slower and changes color through red, yellow, and green progress phases.

## Tasks

1. Revert the recent layout edits in `user-data-page.tsx`, `visual-resume-editor.tsx`, and the affected setup-page test so the editing surface matches the earlier version.
2. Update `generation-loading.tsx` to slow down the simulated progress cadence and map the loading bar state to red up to 30%, yellow through 50%, and green afterward.
3. Add a focused regression test for the loading tone thresholds and rerun the affected resume setup tests.
