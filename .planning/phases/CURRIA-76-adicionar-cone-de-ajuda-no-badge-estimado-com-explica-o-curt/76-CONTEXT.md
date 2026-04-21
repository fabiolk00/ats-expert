# Phase 76 Context

## Problem

Users can see an ATS Readiness range such as `89–90` with the badge `Estimado` and still not understand why the score is not exact.

The product already communicates the score correctly, but the missing explanation creates avoidable questions:

- estimated based on what?
- is the score trustworthy?
- why does the UI show a range instead of a single number?

## Intended fix

- add a compact help affordance only for `Estimado`
- keep the explanation short, plain, and non-technical
- support hover, focus, and click/tap
- avoid adding noise to `Final` states
