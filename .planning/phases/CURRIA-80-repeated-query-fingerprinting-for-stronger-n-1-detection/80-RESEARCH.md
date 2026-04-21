# Phase 80 Research

## Summary

Phase 78 already established the correct architecture seam for request-scoped DB observability in this repo: `AsyncLocalStorage` plus the cached Supabase admin client `global.fetch` wrapper plus explicit SSE flushes for `/api/agent`.

For Phase 80, the safest extension is:

- keep raw sampled descriptors
- derive a normalized fingerprint per descriptor
- aggregate counts by fingerprint in the request context
- emit flat summary metrics plus a bounded top-repeated-pattern list in logs

## Recommended Normalization

- preserve HTTP method
- preserve `/rest/v1/<resource>` path
- preserve query parameter keys
- sort query parameters by key for stable fingerprints
- normalize `eq.<uuid>` to `eq.:uuid`
- normalize `eq.<number>` to `eq.:number`
- normalize `eq.<opaque-id>` to `eq.:value`
- normalize `in.(...)` to `in.(:list)`
- preserve semantic string values like `cancelled` when they look like domain states rather than ids
- avoid using pre-truncated descriptors for fingerprint generation

## Main Risks

- over-normalization can collapse meaningful filters into one fake repeated pattern
- pre-fingerprint truncation can create false repetition
- widening the logger too far can spill complexity into unrelated events
- `/api/agent` must keep explicit flush behavior because it is SSE

## Testing Focus

- fingerprint normalization rules
- repeated pattern aggregation
- warning payload shape
- suspected-vs-not-suspected high-count requests
- full descriptor preservation at the Supabase seam
