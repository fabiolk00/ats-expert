---
title: CurrIA Features
audience: [product-managers, developers, marketing]
related:
  - CONCEPTS.md
  - state-model.md
  - tool-development.md
status: current
updated: 2026-04-01
---

# CurrIA Features

CurrIA helps Brazilian job seekers improve resumes for ATS systems and recruiter review.

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

Technical reference: `src/lib/resume-targets/create-target-resume.ts`

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

Technical reference: [billing/IMPLEMENTATION.md](./billing/IMPLEMENTATION.md)

## Related Documentation

- [CONCEPTS.md](./CONCEPTS.md) - mental model of sessions, tools, and billing
- [GLOSSARY.md](./GLOSSARY.md) - key product and technical terms
- [INDEX.md](./INDEX.md) - directory of all core docs
