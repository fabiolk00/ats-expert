# Phase 110 Validation

## Validation Architecture

- Builder-level proof covers `safeTargetingEmphasis`, `coreRequirementCoverage`, and `lowFitWarningGate` derivation.
- Pipeline-level proof covers warning promotion, recoverable block creation, trace/log payloads, and the stop before automatic persistence/artifact handoff.
- Route-level proof covers continued `422` recoverable behavior and the absence of automatic `generate_file` dispatch in low-fit cases.
- Override/UI proof covers the reused modal shell, credit-aware CTA, pricing fallback, and explicit override continuation.
- Copy proof covers PT-BR human framing and regression protection against mojibake/internal vocabulary leaks.

## Scenario Matrix

| Scenario | Seam | Expected Proof |
|---|---|---|
| Java off-target dispara low-fit warning | `pipeline.test.ts`, `route.test.ts` | `lowFitGate.triggered = true`, recoverable block returned, no auto `createCvVersion`, no auto `generate_file` |
| Soft warnings viram recoverable block sob low-fit | `validate-rewrite.test.ts`, `pipeline.test.ts` | `promotedWarnings` recorded, `validation.blocked = true`, recoverable block path entered |
| Low-fit sem warnings promovíveis ainda continua recoverable | `pipeline.test.ts`, `override route.test.ts` | synthetic fallback issue reuses Phase 109 allowlist; modal appears and override still works |
| Java/core stack não entra em skills sem evidência | `validation-policy.test.ts`, `validate-rewrite.test.ts` | forbidden unsupported core claims remain off the skill surface |
| Similaridades periféricas não liberam cargo alvo | `build-targeting-plan.test.ts`, `pipeline.test.ts` | Git/SQL/APIs may remain claimable, but target-role direct claim stays blocked and gate still triggers |
| Partial-fit aproveita melhor evidência real | `build-targeting-plan.test.ts`, `pipeline.test.ts` | explicit evidence promoted to `safeDirectEmphasis`; bridges stay cautious; no forbidden direct claims |
| Modal low-fit mantém framing humano | `user-data-page.test.tsx`, `resume-workspace.test.tsx` | PT-BR human explanation, no internal terms, same modal shell and CTA logic |
| Sem crédito abre pricing sem override | `user-data-page.test.tsx`, `resume-workspace.test.tsx` | CTA becomes `Adicionar créditos`; no override call; draft/token preserved |

## Automated Checks

- `npm run typecheck`
- `npx vitest run src/lib/agent/tools/build-targeting-plan.test.ts src/lib/agent/job-targeting/validation-policy.test.ts`
- `npx vitest run src/lib/agent/tools/validate-rewrite.test.ts src/lib/agent/tools/pipeline.test.ts src/app/api/profile/smart-generation/route.test.ts`
- `npx vitest run src/app/api/session/[id]/job-targeting/override/route.test.ts src/components/resume/user-data-page.test.tsx src/components/dashboard/resume-workspace.test.tsx`
- `npm run audit:copy-regression`

## Acceptance Gate

- Off-target cases must stop before automatic final success.
- Partial-fit cases must remain competitive without inventing support.
- Recoverable override semantics from Phase 109 must remain intact.
- Observability must explain why the gate fired and what was promoted.
- ATS and non-target flows must remain green.
