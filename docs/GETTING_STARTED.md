---
title: Getting Started with CurrIA
audience: [developers, operations, product-managers]
related:
  - README.md
  - CONCEPTS.md
  - INDEX.md
status: current
updated: 2026-04-01
---

# Getting Started with CurrIA

Use this guide as the fastest path into the codebase and documentation.

## For Developers

Typical path: setup -> architecture -> tools -> testing

1. Start with [README.md](../README.md) for local setup and runtime dependencies.
2. Read [CONCEPTS.md](./CONCEPTS.md) for the session model, billing model, and tool loop.
3. Read [architecture-overview.md](./architecture-overview.md) and [state-model.md](./state-model.md).
4. Use [tool-development.md](./tool-development.md) and [developer-rules/README.md](./developer-rules/README.md) before changing routes or tools.
5. Run `npm run typecheck`, `npm test`, and `npm run lint` before shipping.

## For Operations

Typical path: billing -> monitoring -> incidents -> staging

1. Start with [CONCEPTS.md](./CONCEPTS.md#billing-and-credits).
2. Use the billing canonical docs:
   - [Billing Implementation](./billing/IMPLEMENTATION.md)
   - [Billing Monitoring](./billing/MONITORING.md)
   - [Billing Ops Runbook](./billing/OPS_RUNBOOK.md)
3. Review [logging.md](./logging.md) and [error-codes.md](./error-codes.md).
4. Use the staging docs under [docs/staging](./staging/SETUP_GUIDE.md) before validating changes.

## For Product Managers

Typical path: features -> concepts -> architecture -> billing

1. Start with [FEATURES.md](./FEATURES.md) for product capabilities.
2. Read [CONCEPTS.md](./CONCEPTS.md) for the mental model behind sessions, tools, and credits.
3. Use [INDEX.md](./INDEX.md) to find the right implementation or operations guide.
4. Review [billing/IMPLEMENTATION.md](./billing/IMPLEMENTATION.md) when pricing or credit policy changes are involved.

## Recommended Reading Order

1. [README.md](../README.md)
2. [CONCEPTS.md](./CONCEPTS.md)
3. [INDEX.md](./INDEX.md)
4. Domain-specific docs under [billing](./billing/IMPLEMENTATION.md), [openai](./openai/MODEL_SELECTION_MATRIX.md), [staging](./staging/SETUP_GUIDE.md), and [developer-rules](./developer-rules/README.md)

## Related Documentation

- [INDEX.md](./INDEX.md) - complete directory of key docs
- [CONCEPTS.md](./CONCEPTS.md) - mental models before implementation detail
- [FEATURES.md](./FEATURES.md) - product capabilities and use cases
