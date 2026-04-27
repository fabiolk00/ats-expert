## Phase 108 Context

### Objective

Add a dynamic, domain-agnostic semantic evidence layer for `job_targeting` targeted rewrite so the system can distinguish:

- explicit evidence
- normalized aliases
- technical equivalents
- strong contextual inferences
- semantic bridges
- unsupported gaps

The new model must improve targeted rewrite alignment without inventing unsupported experience.

### Scope

Applies only when both conditions are true:

- workflow is `job_targeting`
- the flow is performing a target-driven resume rewrite

### Explicitly Out Of Scope

Do not change behavior for:

- ATS enhancement
- generic/non-targeted resume rewrite
- highlight generation without targeted rewrite
- generic job analysis without targeted rewrite
- keyword-only vacancy highlighting
- non-target chat or comparison flows

### Required Outcomes

1. Preserve existing targeting plan fields for compatibility.
2. Add evidence classification data that explains how each job signal is supported by the original resume.
3. Feed richer permission-aware guidance into the targeted rewrite prompt.
4. Make targeted validation aware of what is directly claimable, normalizable, bridgeable, contextual-only, or forbidden.
5. Keep anti-hallucination guarantees intact.
6. Prove isolation with focused tests for target and non-target flows.

### Non-Negotiables

- Domain-agnostic architecture only.
- No BI/data/software-only hardcoded core rules.
- Examples from specific domains may appear in tests, not as the central product rule set.
- Explainability data must be retained through rationale and supporting resume spans.
