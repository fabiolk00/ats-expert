status: passed

# Verification

- Typed session lookup now distinguishes `not_found` from lookup failure for `/api/file`.
- `/api/file` retries transient session misses before returning not found.
- Post-generation misses return a retryable payload that the UI can treat as a syncing state.
- Comparison and preview UIs keep the user oriented during transient lookup failures.
- Focused tests and repo typecheck passed locally.
