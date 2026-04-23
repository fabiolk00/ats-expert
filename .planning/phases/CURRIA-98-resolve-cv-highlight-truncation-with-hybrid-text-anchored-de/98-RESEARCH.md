## Phase 98 Research

### Official Validation

This phase used official OpenAI documentation to validate the detector contract change before implementation:

1. Structured Outputs guide
   - URL: https://developers.openai.com/api/docs/guides/structured-outputs
   - Relevant implementation takeaway: structured schemas require required fields, so optional numeric fallback fields were modeled as nullable `start` and `end`.

2. GPT-5.4 mini model page
   - URL: https://developers.openai.com/api/docs/models/gpt-5.4-mini
   - Relevant implementation takeaway: `gpt-5.4-mini` supports Structured Outputs, so the existing structured model choice remains valid for this detector.

3. Prompt optimizer guide
   - URL: https://developers.openai.com/api/docs/guides/prompt-optimizer
   - Relevant implementation takeaway: prompt iteration should stay narrow and fixture-driven, which aligned with adding local pt-BR regression fixtures instead of broad prompt churn.

### Local Conclusion

The plan direction was validated:

- use Structured Outputs instead of plain JSON mode
- anchor highlights on exact text fragments
- keep `start/end` only as deterministic fallback data
- preserve the persisted artifact shape consumed by route and renderer code
