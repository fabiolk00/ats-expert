---
title: CurrIA Glossary
audience: [everyone]
related:
  - CONCEPTS.md
  - INDEX.md
status: current
updated: 2026-04-01
---

# CurrIA Glossary

## Session

The bundle representing one conversation with the AI assistant, including resume state, operational context, outputs, and phase.

## cvState

The canonical structured resume. This is the source of truth used to generate final resume files.

## agentState

Operational context for the assistant, such as parsed text, targeting context, and structured gap analysis.

## generatedOutput

Durable metadata about generated files. It should not contain signed URLs or resume truth.

## Tool

An explicit action the assistant can take, such as parsing a file, scoring ATS, rewriting a section, or generating files.

## ToolPatch

A typed patch returned by a tool so the dispatcher can persist controlled state changes centrally.

## ATS

Applicant Tracking System. Software used by recruiters to filter and rank resumes before human review.

## Resume Target

A job-specific derived resume variant stored separately from the base canonical resume.

## CV Version

An immutable snapshot of the canonical resume state created after trusted changes.

## Credit Account

The source of truth for how many runtime credits a user has left.

## User Quota

Billing metadata such as plan, subscription identifiers, and renewal dates.

## Asaas

The payment provider used for checkout, subscriptions, and billing webhooks.

## App User

The internal CurrIA user ID used by domain logic after authentication resolves external identity.
