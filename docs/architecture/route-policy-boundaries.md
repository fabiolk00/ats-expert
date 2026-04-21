# Route Policy Boundaries

This contract exists for semantically dense routes where product policy, preview access, billing safety, replay-aware behavior, or sensitive availability rules make the request path easy to regress.

Use the full `context.ts` / `policy.ts` / `decision.ts` / `response.ts` split for:

- semantically dense routes
- critical product-policy routes
- routes that coordinate replay, preview access, billing or export, or sensitive availability logic

Do not require the full pattern for:

- trivial CRUD routes
- settings reads or writes
- simple list endpoints
- low-risk internal utilities

## `context.ts`

May do:

- auth resolution
- ownership checks
- request, body, and query parsing
- trust validation
- loading session, target, and version references
- building typed request context

Must not do:

- policy blocking decisions
- replay or business access interpretation
- signed URL authorization
- preview lock interpretation
- degraded persistence handling
- final route outcome branching

## `policy.ts`

May do:

- blocking gate logic
- active job conflict evaluation
- reconciliation pending evaluation
- explicit allow or block decisions

Must not do:

- persistence side effects
- job creation
- signed URL creation
- response shaping

## `decision.ts`

May do:

- orchestration
- flow execution
- replay-aware selection
- availability decisions
- execution outcome normalization

Must not do:

- parse raw HTTP request data directly
- return raw `NextResponse`
- reinterpret public HTTP semantics ad hoc

## `response.ts`

May do:

- map internal decisions to HTTP status and body
- preserve the public contract shape
- emit a signed URL only when the decision layer explicitly returned an artifact-available outcome

Must not do:

- emit signed URLs without a decision-layer outcome
- apply product or business policy
- reinterpret historical preview access
- infer billing or export semantics from raw data

## Critical Route Checklist

For any new critical route:

- add a `context` layer
- add a `policy` layer when blocking semantics exist
- add a `decision` layer for orchestration or availability normalization
- keep signed URL emission out of the route body
- keep preview-lock interpretation out of the response layer
- keep the route itself limited to mapping internal outcomes to HTTP

## Execution Order

For critical routes, the intended order should be explicit in the route or decision entrypoint:

1. resolve request context
2. evaluate blocking policy
3. execute decision or orchestration
4. map normalized outcome to HTTP

If the order matters for product semantics, prove it with tests.
