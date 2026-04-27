# Quick Task

Hardening: credit-aware override CTA and pricing modal for recoverable job targeting validation.

## Scope

- Make recoverable validation override CTAs credit-aware in profile setup and workspace.
- Open the existing pricing modal when credits are missing instead of attempting override.
- Reject insufficient credits in the override route before consuming draft/token.
- Keep blocked draft and recoverable modal intact when credits are missing.
- Add focused coverage for frontend CTA switching and backend insufficient-credit handling.
