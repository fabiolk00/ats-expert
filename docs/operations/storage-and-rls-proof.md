---
title: Storage and RLS Proof
audience: [developers, operators]
related:
  - security-boundary-audit.md
  - secret-boundaries-and-e2e-auth.md
  - ../developer-rules/API_CONVENTIONS.md
status: current
updated: 2026-04-15
---

# Storage and RLS Proof

This document explains what CurrIA proves today for file access and storage delivery, and where the proof stops because the remaining guarantee belongs to Supabase Storage policy or RLS outside the repository.

## What the repo proves

- `/api/file/[sessionId]` authenticates the caller and resolves session ownership before any signed URL generation.
- `?targetId=` downloads are only considered after the parent session is already owned by the caller.
- signed URLs are generated transiently and are not persisted back into session or target state.
- `src/lib/db/supabase-admin.ts` is an explicit `server-only` seam for service-role access.
- `src/lib/agent/tools/generate-file.ts` uses the storage seam as a delivery mechanism after upstream validation and authorization have already happened elsewhere.

## What the repo does not prove

- that Supabase Storage policy by itself enforces per-user object isolation for every file object
- that RLS is active or sufficient for all reads made through the service-role client
- that possession of a signed URL is itself an authorization decision made by storage policy instead of app code
- that infrastructure configuration in Supabase, Clerk, or Upstash exactly matches local assumptions at runtime

## Current ownership model

### App-layer proof

- ownership is proven in route code through `getCurrentAppUser()` plus ownership-aware loaders such as `getSession(sessionId, appUserId)`
- route tests are the committed proof for base artifact access, target artifact access, and foreign-session rejection

### Delivery-layer proof

- signed URL generation happens only after the app-layer route resolves ownership and a `ready` artifact path
- the helper may fail closed when storage cannot mint the URL
- the helper does not prove ownership on its own

### Service-role and RLS boundary

- `getSupabaseAdminClient()` can bypass RLS by design because it uses the service-role key
- that seam is acceptable only when the caller already passed route-level authorization or when the code is executing an explicitly trusted backend job
- future code must not claim "RLS protected this read" when the actual path went through the admin client

## Proof files

- `src/app/api/file/[sessionId]/route.test.ts`
- `src/app/api/session/[id]/route.test.ts`
- `src/lib/db/supabase-admin.test.ts`
- `src/lib/agent/tools/generate-file.test.ts`
- `docs/operations/security-boundary-audit.md`

## Reviewer checklist

- confirm the route proves ownership before calling any storage-signing helper
- confirm signed URLs are not persisted into durable state
- confirm admin or service-role seams are documented as bypass-capable, not as proof of authorization
- confirm any remaining storage-policy or RLS assumption is stated as an external dependency, not implied as repo-proven
