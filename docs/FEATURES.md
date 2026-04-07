---
title: CurrIA Features
audience: [product-managers, developers, marketing]
related:
  - CONCEPTS.md
  - state-model.md
  - tool-development.md
status: current
updated: 2026-04-07
---

# CurrIA Features

CurrIA helps Brazilian job seekers improve resumes for ATS systems and recruiter review.

## Conversational Agent

What it does: guides the user through resume analysis, targeting, rewriting, and generation while keeping a durable session state behind the chat.

Key behaviors:
- persists the session ID early so refreshes do not silently create a second paid session
- detects pasted job descriptions before the model loop when the message clearly looks like a vacancy
- can precompute targeting context for the assistant when the session already has enough resume information
- keeps the conversation grounded in the user's real background instead of blindly optimizing for any target role

Technical reference: `POST /api/agent` in `src/app/api/agent/route.ts`

## AI Resume Rewriting

What it does: rewrites weak resume sections into stronger, clearer, and more ATS-friendly versions while preserving the user's facts.

Use cases:
- improve a summary
- turn vague bullets into achievement-focused bullets
- align sections with target-job language

Technical reference: `rewrite_section` in `src/lib/agent/tools/rewrite-section.ts`

## ATS Scoring

What it does: scores the resume against ATS expectations and highlights strengths, weak areas, and missing keywords.

Use cases:
- evaluate a resume before applying
- compare resume quality before and after improvements
- find keyword gaps for a target role

Technical reference: `src/lib/ats/score.ts`

## Job Targeting

What it does: creates job-specific resume variants without overwriting the base canonical resume.

Use cases:
- tailor a resume per application
- keep multiple optimized variants in parallel
- compare targeted and non-targeted versions
- preserve the latest active target job description inside the session context
- carry structured gap analysis and fit judgment through the conversation

Technical reference: `src/lib/resume-targets/create-target-resume.ts`

## Fit Assessment and Honest Guidance

What it does: estimates whether the target role looks like a strong, partial, or weak fit for the user's current profile and uses that judgment to shape the conversation.

Use cases:
- tell the user when the target role is realistic today
- point out when the role is adjacent but the stack or domain is different
- explain when the role is currently a weak fit and avoid overselling resume changes as a full fix

Technical reference:
- prompt guidance in `src/lib/agent/context-builder.ts`
- stored fit derivation in `src/lib/agent/target-fit.ts`

## Version History

What it does: records immutable resume snapshots so users and developers can inspect trusted changes over time.

Use cases:
- track how the resume evolved
- compare before and after states
- preserve trusted edits from ingestion, rewrite, manual edit, and target derivation

Technical reference: `src/lib/db/cv-versions.ts`

## File Generation

What it does: generates ATS-safe DOCX and PDF outputs from the canonical resume state.

Use cases:
- download a polished version after optimization
- create target-specific artifacts from derived resumes
- keep file metadata durable without storing signed URLs

Technical reference: `generate_file` in `src/lib/agent/tools/generate-file.ts`

## Credit-Based Access

What it does: enforces plan usage through monthly credits and session creation.

Use cases:
- free trial entry point
- paid monthly plans for heavier usage
- predictable billing and cost control
- show the current plan and dynamic credit totals in the authenticated dashboard without changing the runtime source of truth

Technical reference: [billing/IMPLEMENTATION.md](./billing/IMPLEMENTATION.md)

## Auth and Checkout Resume Flow

What it does: preserves the user's intended destination through login, signup, and email verification so billing and onboarding flows can continue without manual recovery.

Use cases:
- start a paid checkout from pricing while logged out
- verify email and continue to the requested plan flow
- avoid the raw Clerk `Session already exists` dead-end when the user is already authenticated

Technical reference:
- `src/components/auth/signup-form.tsx`
- `src/components/auth/login-form.tsx`
- `src/lib/auth/clerk-errors.ts`

## Job Application Tracker

What it does: lets paid users manually register applications, track status, and remember which resume version was sent.

Use cases:
- maintain a lightweight application pipeline inside CurrIA
- record salary, location, benefits, job description, and notes per application
- update statuses manually without losing the selected resume label
- surface rejected create/update/delete actions as inline UI errors instead of opaque client failures

Technical reference:
- `src/app/(auth)/resumes/actions.ts`
- `src/lib/db/job-applications.ts`
- `src/components/dashboard/job-applications-tracker.tsx`

## Related Documentation

- [CONCEPTS.md](./CONCEPTS.md) - mental model of sessions, tools, and billing
- [GLOSSARY.md](./GLOSSARY.md) - key product and technical terms
- [INDEX.md](./INDEX.md) - directory of all core docs
