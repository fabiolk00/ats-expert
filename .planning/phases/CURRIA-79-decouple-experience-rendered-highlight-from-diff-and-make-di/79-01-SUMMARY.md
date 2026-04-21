# Phase 79 Summary

- Decoupled experience highlight rendering from original-vs-optimized diff by keeping diff in bullet improvement gating while selecting the rendered highlight span from the optimized bullet only.
- Preserved the existing preview render contract and bullet caps, so the React comparison view did not need a structural rewrite.
- Added regressions proving structural metric spans win over nearest diff fragments and that changed bullets can now render with zero highlight when no strong optimized-text span exists.
- Kept the scope limited to experience highlights in the optimized preview, leaving summary, export, ATS scoring, persistence, and rewrite generation untouched.
