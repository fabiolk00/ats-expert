# Retrospective

## Milestone: v1.1 - Agent Reliability and Response Continuity

**Shipped:** 2026-04-15  
**Phases:** 15 | **Plans:** 45

### What Was Built

- live `/api/agent` provenance and parity tooling
- dialog continuity and transcript verification hardening
- deterministic ATS enhancement and target-job rewrite pipelines
- smart dashboard generation entrypoint
- OpenAI resilience and async PDF import processing
- LGPD, security, billing, file-access, and JSON persistence hardening

### What Worked

- phase-based execution kept the brownfield changes incremental instead of forcing one large rewrite
- focused validation per phase kept confidence high while moving quickly
- separating canonical `cvState` from operational `agentState` continued to pay off across multiple features

### What Was Inefficient

- milestone closeout happened without a dedicated audit artifact, which made archive cleanup more manual
- the archive helper assumed a narrower v1.1 scope than the actual 5-19 range and needed manual correction
- some roadmap traceability was fixed late instead of being enforced at phase-planning time

### Patterns Established

- critical resume transformations should be deterministic backend pipelines, not optional agent choices
- security and billing confidence improved most when route-level proof and explicit non-claims were documented together
- JSON persistence can remain practical in a brownfield system as long as repository boundaries validate and classify each seam explicitly

### Key Lessons

- reliability work naturally expanded into resilience, billing, and persistence hardening, and future milestones should expect that kind of scope pull
- archive tooling still benefits from a pre-close audit habit
- fresh milestone requirements should start from a clean slate, not an archived roadmap

### Cost Observations

- Model mix: not summarized centrally for this milestone
- Sessions: not summarized centrally for this milestone
- Notable: focused phase verification kept context manageable even as the milestone expanded far beyond the original three-phase reliability scope

## Cross-Milestone Trends

| Milestone | Theme | Observation |
|-----------|-------|-------------|
| v1.0 | Launch hardening | Most value came from stabilizing the core funnel and proving billing and browser flows |
| v1.1 | Reliability and determinism | The work shifted from chat-quality fixes into deterministic pipelines, resilience, and explicit boundary proof |
