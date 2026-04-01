---
title: CurrIA Core Concepts
audience: [developers, operations, product-managers]
related:
  - architecture-overview.md
  - state-model.md
  - FEATURES.md
status: current
updated: 2026-04-01
---

# CurrIA Core Concepts

This document explains the product and system in plain language before you dive into implementation details.

## Session Bundle

A session is the durable record of one resume-optimization conversation.

- `cvState`: the canonical resume state used for generation
- `agentState`: operational context such as parsed resume text, gap analysis, and targeting inputs
- `generatedOutput`: durable metadata about generated files
- `atsScore`: the latest score snapshot
- `phase`: where the user is in the optimization journey

Why it matters: CurrIA keeps resume truth separate from AI working memory so the generated resume stays stable and auditable.

## Tool Loop

The assistant improves resumes by calling explicit tools instead of mutating state freely.

1. The user sends a message.
2. The model decides whether to answer directly or call a tool.
3. A tool validates input and returns output plus an optional `ToolPatch`.
4. The dispatcher persists the patch centrally.
5. The assistant continues the conversation with the updated state.

Why it matters: this makes tool behavior testable, keeps state mutations controlled, and reduces race-condition bugs.

## Billing and Credits

CurrIA is session-based, not message-based.

- One new session consumes one credit.
- Additional messages in that same session do not consume extra credits.
- `credit_accounts` is the runtime source of truth.
- `user_quotas` stores billing metadata such as plan and renewal data.
- Asaas webhooks are the only place that grants credits.

Why it matters: checkout success alone does not grant usage. Only trusted billing events do.

## Resume Variants and Versioning

CurrIA maintains one canonical base resume and supports job-specific derivatives.

- Canonical changes create immutable entries in `cv_versions`.
- Job-specific variants live in `resume_targets`.
- Generated artifacts are metadata, not resume truth.

Why it matters: users can tailor resumes to different roles without corrupting the base resume.

## Identity Model

Clerk authenticates users, but the product runs on internal app user IDs.

- External identity lives in Clerk.
- Domain logic resolves to an internal app user.
- `user_auth_identities` maps external identities to internal users.

Why it matters: domain logic stays decoupled from the auth provider.

## OpenAI Runtime

CurrIA currently routes the runtime fully through OpenAI.

- Model selection is controlled in `src/lib/agent/config.ts`
- Current model docs live under [docs/openai](./openai/MODEL_SELECTION_MATRIX.md)
- The Portuguese quality gate exists because high-quality pt-BR output is a product requirement, not a nice-to-have

## Related Documentation

- [FEATURES.md](./FEATURES.md) - product capabilities and user-facing value
- [architecture-overview.md](./architecture-overview.md) - runtime and system boundaries
- [state-model.md](./state-model.md) - canonical data contracts
- [billing/IMPLEMENTATION.md](./billing/IMPLEMENTATION.md) - billing source of truth
