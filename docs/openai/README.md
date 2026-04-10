---
title: OpenAI Documentation
audience: [developers, architects]
related:
  - ../INDEX.md
  - MODEL_SELECTION_MATRIX.md
status: current
updated: 2026-04-01
---

# OpenAI Documentation

Use this folder for the canonical OpenAI runtime, quality, and migration documentation.

Current runtime note:
- `OPENAI_MODEL_COMBO` selects the baseline agent combo
- `OPENAI_AGENT_MODEL` or `OPENAI_MODEL` override the agent turn model directly
- dialog and confirm turns follow the resolved agent model unless `OPENAI_DIALOG_MODEL` is explicitly set
- `OPENAI_DIALOG_MODEL` is an override, not a separate default baseline
- `combo_a` / `combo_b` / `combo_c` remain the active agent bakeoff labels
- historical quality-gate docs remain in this folder for auditability

- [MODEL_SELECTION_MATRIX.md](./MODEL_SELECTION_MATRIX.md) - evaluation framework and historical matrix
- [PORTUGUESE_QUALITY_GATE.md](./PORTUGUESE_QUALITY_GATE.md) - pt-BR release gate
- [PORTUGUESE_TEST_RESULTS.md](./PORTUGUESE_TEST_RESULTS.md) - language-quality results
- [PT_BR_WEBSITE_PROOFREADER_AGENT_PROMPT.md](./PT_BR_WEBSITE_PROOFREADER_AGENT_PROMPT.md) - copy-paste system prompt for a dedicated pt-BR website proofreader agent
- [MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md) - rollout checklist
- [MIGRATION_MONITORING.md](./MIGRATION_MONITORING.md) - monitoring views and signals
- [MIGRATION_ROLLBACK.md](./MIGRATION_ROLLBACK.md) - rollback guidance
