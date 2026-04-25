## Follow-up Task Stub

Task: Specify and implement re-warning behavior when career fit riskLevel escalates mid-session

Status: Pending specification

### Why this was split out

Re-warning after a risk escalation for the same `targetJobDescription` is a product/UX decision, not a safe side effect. Before implementation, the task must define:

- which events are allowed to trigger re-warning
- what copy differentiates a new-JD warning from a recalculated same-JD warning
- whether a previous high-risk override stays valid or is invalidated
- whether the warning is blocking or informational when the escalation happens mid-session

Linked from:

- [.planning/quick/260425-qmj-harden-career-fit-graduated-risk-system-/SUMMARY.md](</C:/CurrIA/.planning/quick/260425-qmj-harden-career-fit-graduated-risk-system-/SUMMARY.md:1>)
