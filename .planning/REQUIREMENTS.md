# Requirements: CurrIA

**Defined:** 2026-04-09
**Core Value:** A job seeker can reliably turn their real profile and a target role into an honest, ATS-ready resume output they can confidently download and use.

## v1 Requirements

### Runtime Contracts

- [x] **OPS-01**: Deployment and CI use the same env variable contract for OpenAI, Asaas, Upstash, and other core launch dependencies.
- [x] **OPS-02**: Missing required production credentials fail fast with actionable errors before silent runtime degradation.
- [x] **OPS-03**: Release and staging docs describe the current billing contract, migrations, and validation prerequisites without stale steps.

### Core Journey Verification

- [ ] **QA-01**: Team can run automated browser tests covering auth, profile setup or edit, and session creation.
- [ ] **QA-02**: Team can run automated browser tests covering agent interaction, target resume creation, and artifact download.
- [ ] **QA-03**: CI runs reliable critical-path verification without depending on fragile live-provider behavior.

### Billing Validation

- [ ] **BILL-01**: Settlement-based one-time and subscription billing scenarios are validated end-to-end in staging.
- [ ] **BILL-02**: Duplicate or replayed billing events are verified to remain idempotent and not double-grant credits.
- [ ] **BILL-03**: Dashboard credit totals are verified to stay consistent with runtime balance during validated billing scenarios.

### Observability and Failure Handling

- [ ] **OBS-01**: Critical server routes emit structured logs with request or entity context for production debugging.
- [ ] **OBS-02**: Core funnel failures surface user-safe, actionable errors instead of opaque or silent failure states.

## v2 Requirements

### Onboarding Expansion

- **ONBR-01**: User can upload a PDF or DOCX profile and extract structured resume data before the first chat session.
- **ONBR-02**: User can choose LinkedIn, file upload, or blank-profile onboarding through one consistent review flow.

### Growth Instrumentation

- **GROW-01**: Team can inspect funnel analytics for profile activation, resume generation, and download behavior.
- **GROW-02**: Job application tracking can attach generated resume artifacts instead of storing only labels.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Broad product redesign | Keep the existing brownfield funnel stable while hardening it for launch |
| New premium feature pillars | Reliability and launch confidence take priority over additional surface area |
| Native mobile app | Web launch is the current validation path |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| OPS-01 | Phase 1 | Complete |
| OPS-02 | Phase 1 | Complete |
| OPS-03 | Phase 1 | Complete |
| QA-01 | Phase 2 | Pending |
| QA-02 | Phase 2 | Pending |
| QA-03 | Phase 2 | Pending |
| BILL-01 | Phase 3 | Pending |
| BILL-02 | Phase 3 | Pending |
| BILL-03 | Phase 3 | Pending |
| OBS-01 | Phase 4 | Pending |
| OBS-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 11 total
- Mapped to phases: 11
- Unmapped: 0

---
*Requirements defined: 2026-04-09*
*Last updated: 2026-04-10 after Phase 1 completion*
