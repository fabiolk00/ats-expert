# Preview Lock Policy

## Objective

Define the canonical rules for locked free-trial previews so artifact replay, timeline reads, compare surfaces, and download URLs stay consistent and non-bypassable.

## Definitions

- `locked preview`: a generated artifact that exists, but cannot expose real structured content or real download URLs to the current viewer
- `blurred preview`: a locked preview represented through synthetic or sanitized content
- `real content`: real resume snapshot data, real compare diff data, or real signed artifact URLs
- `historical lock`: the persisted `generatedOutput.previewAccess` stored with the session or target artifact that reflects how that artifact was created and what access policy applies to it

## Central Rule

Persisted preview lock is the historical source of truth for an artifact.

- The current user plan affects only new generations.
- A later upgrade does not reinterpret an older locked artifact as viewable.
- Replay is a cost optimization, not a permission upgrade path.

## Product Rule

If an artifact was generated under a locked free-trial policy:

- the user may see safe metadata
- the user may receive a synthetic preview
- the user may be told that a previous generation exists
- the user may not receive the real artifact or real structured snapshot content
- upgrading later still requires a new generation to unlock real content

## Surface Policy

| Surface | Policy |
|---|---|
| `session/[id]` | Must return sanitized generated preview state when preview is locked |
| `session/[id]/versions` | Must not return real structured snapshot data for locked derived versions |
| `session/[id]/compare` | Must return a locked response with no real diff if either side is locked |
| `replay` in `generateBillableResume(...)` | Must resolve viewer access before signing any URL and must prefer persisted lock over current plan |
| `file/[sessionId]` | May emit a real signed URL only when preview access is viewable; otherwise emits locked preview URL |
| UI preview surfaces | Must treat backend payload as canonical and never rely on hidden DOM or CSS-only blur for security |

## Signed URL Policy

Real signed artifact URLs may be emitted only when:

- the viewer is authorized
- the artifact is ready
- preview access is resolved viewer-side and allows real content

Real signed artifact URLs are prohibited when:

- `generatedOutput.previewAccess.locked === true`
- replay is serving a historically locked artifact
- the response is using a locked synthetic preview path

## Technical Invariants

- Locked preview must never leave the server with a real `pdfUrl`
- Locked preview must never leave the server with a real `docxUrl`
- Locked preview responses must persist the same `previewAccess` in:
  - `generatedOutput.previewAccess`
  - `patch.generatedOutput.previewAccess`
- Replay must resolve preview access before any call to real signed URL creation

## Implementation Notes

- `resolveReplayPreviewAccess(...)` in `src/lib/resume-generation/generate-billable-resume.ts` enforces the historical-lock rule.
- `assertNoRealArtifactForLockedPreview(...)` in `src/lib/generated-preview/locked-preview.ts` enforces the output invariant.
- `createSignedResumeArtifactUrls(...)` is a low-level storage helper and must only be called from gated application paths.

## Residual Risk

Signed URLs emitted before a fix or before a lock transition remain valid until their TTL expires. Current policy assumes signed URLs are ephemeral and should not be cached or recirculated as durable access grants.
