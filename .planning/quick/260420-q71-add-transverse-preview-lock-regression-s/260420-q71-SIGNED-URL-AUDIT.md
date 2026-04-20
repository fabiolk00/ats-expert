# Signed URL Audit Snapshot

Date: 2026-04-20

## Goal

Confirm every real resume signed URL emitter is gated by viewer-aware preview access and that locked previews cannot emit real artifact URLs.

## Emitters

| Emitter | File | Called by | Gated by previewAccess? | Guardrail? | Safe? | Notes |
|---|---|---|---|---|---|---|
| `createSignedResumeArtifactUrls(...)` | `src/lib/agent/tools/generate-file.ts` | `createSignedResumeArtifactUrlsBestEffort(...)`, `GET /api/file/[sessionId]` | No, raw storage helper | No, helper stays low-level | Conditionally | Must only be reached from gated callers |
| `createSignedResumeArtifactUrlsBestEffort(...)` | `src/lib/agent/tools/generate-file.ts` | `generateFile(...)`, `buildReplayResultForViewer(...)` | Caller-owned | Caller-owned | Conditionally | Safe only when upstream already resolved viewer access |
| Fresh generation signed URL path | `src/lib/agent/tools/generate-file.ts` | `generateBillableResume(...)` | Yes, post-generation output is re-gated in `generateBillableResume(...)` | Yes, `assertNoRealArtifactForLockedPreview(...)` in `generateBillableResume(...)` | Yes | Locked viewers get `/api/file/:sessionId/locked-preview` and `docxUrl: null` |
| Completed replay signed URL path | `src/lib/resume-generation/generate-billable-resume.ts` | `generateBillableResume(...)` | Yes, `resolveReplayPreviewAccess(...)` before signing | Yes, `assertNoRealArtifactForLockedPreview(...)` | Yes | Historical persisted lock wins over current plan |
| Download route signer | `src/app/api/file/[sessionId]/route.ts` | authenticated file polling / download surface | Yes, route blocks on `isLockedPreview(...)` before signing | Indirect via route gate | Yes | Locked viewers receive locked preview URL, not signed storage URL |

## Findings

- There are only two real signed URL call sites in product code:
  - `src/lib/resume-generation/generate-billable-resume.ts`
  - `src/app/api/file/[sessionId]/route.ts`
- The low-level helper in `src/lib/agent/tools/generate-file.ts` is intentionally ungated and must remain a storage primitive.
- Replay now resolves preview access before signed URL creation and prefers persisted artifact lock over current billing plan.
- Fresh generation now applies a final invariant that prohibits real `pdfUrl` and `docxUrl` when preview access is locked.

## Residual Risk

- Previously issued signed URLs remain valid until their storage TTL expires.
- Current TTL in `createSignedResumeArtifactUrls(...)` is `3600` seconds.
- No cache recirculation was found in the current server emitters, but client caching should continue treating signed URLs as ephemeral.

## Launch Decision

- Keep the current `3600` second signed URL TTL for launch.
- Rationale:
  - new locked viewers no longer receive real signed URLs from replay or file polling
  - current residual risk is limited to already-issued URLs until expiry
  - no server-side cache recirculation was found in the active emitters
- Follow-up:
  - revisit TTL reduction only if launch telemetry shows link-sharing abuse or if product sensitivity increases

## Acceptance Snapshot

- Locked preview + real signed URL emission: blocked
- Replay after upgrade without regeneration: still locked
- New paid generation after upgrade: real signed URL allowed
