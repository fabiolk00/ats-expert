# Quick Task Plan — 260426-qrx

## Goal

Remove ATS Readiness scoring from the resume comparison surface, including both comparison-side calculations and the UI score/status boxes.

## Scope

- Stop calculating or returning `atsReadiness`, `originalScore`, and `optimizedScore` from the session comparison route.
- Remove score/status rendering from the comparison page/view.
- Update focused tests for the comparison contract.

## Guardrails

- Keep the comparison flow itself intact.
- Do not alter the underlying ATS enhancement pipeline or readiness guards outside this comparison surface.
- Preserve highlight, preview-lock, download, and manual-edit behavior.
