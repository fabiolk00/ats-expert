# Brazilian Portuguese Quality Gate - Anthropic to OpenAI Migration

## Goal

This document defines the **mandatory pt-BR language quality gate** before making the final production decision for the Anthropic-to-OpenAI migration.

The current codebase may be treated as an **OpenAI candidate**, but **not** as the final provider decision until this gate has been executed and approved.

## Decision question

**Does GPT-5 Mini produce Brazilian Portuguese output that is strong enough for a resume-optimization SaaS aimed at Brazilian job seekers?**

If yes, proceed with OpenAI full.
If borderline, move to a hybrid setup.
If not, revert to Claude.

## Mandatory decision rule

- **PASS**: GPT final average **>= 4.0/5.0**
  - proceed with full OpenAI rollout
- **CONDITIONAL**: GPT final average between **3.5 and 3.9**
  - do not proceed with full cutover
  - move to a hybrid approach
- **FAIL**: GPT final average **< 3.5**
  - abort the full migration
  - revert the runtime provider to Claude

If the result is close or debatable, **quality wins over cost**.

## Test scope

The gate must cover the flows most sensitive to writing quality:

- `rewrite_section`
- `create_target_resume`
- conversational agent responses that guide resume improvement

Analytical and structured flows such as ingestion, gap analysis, and OCR may be observed during the test run, but they are **not** the primary focus of this language gate. The focus is text the user could realistically send to a recruiter.

## Evaluator requirements

- native Brazilian Portuguese speaker
- ideally someone with recruiting, HR, resume review, or career guidance experience
- must evaluate **final output**, not provider preference
- must use the same rubric across all samples

## Test setup

### Required samples

Run the gate with **10 samples** covering a diverse set of profiles:

1. Intern or junior in technology
2. Mid-level technology professional
3. Senior technology professional
4. Sales / commercial
5. Marketing / content
6. Finance / administrative
7. Operations / logistics
8. Healthcare
9. Legal / compliance
10. Career-change or weak generic resume

### Recommended distribution

- 5 samples focused on `rewrite_section`
- 3 samples focused on `create_target_resume`
- 2 samples focused on conversational agent output

### Required input material

For each sample, prepare:

- the original weak resume section or source text
- the exact same instruction/prompt for both providers
- the target job description when applicable
- the exercised operation (`rewrite_section`, `create_target_resume`, or chat)

## Comparison protocol

For each sample:

1. run **Claude Haiku** with the original prompt
2. run **GPT-5 Mini** with the same prompt and same input
3. remove any visible provider label before human evaluation
4. ask the evaluator to score both outputs using the rubric below
5. record short qualitative comments

### Protocol rules

- same input for both providers
- same prompt
- no manual editing before evaluation
- compare final output, not latency
- store raw outputs for later audit if needed

## Evaluation rubric

Use a **1 to 5** scale for each dimension:

### 1. Grammar and spelling

- 1: frequent errors, low-confidence output
- 3: minor slips, still acceptable
- 5: flawless for professional use

### 2. Vocabulary and naturalness

- 1: sounds translated, robotic, or artificial
- 3: partly natural, but inconsistent
- 5: natural Brazilian Portuguese for a professional context

### 3. Professional tone

- 1: too casual, too exaggerated, or inappropriate
- 3: acceptable, but generic
- 5: professional, credible, and appropriate for a resume

### 4. Industry terminology precision

- 1: inaccurate or weak terminology
- 3: functional but shallow
- 5: precise language for the candidate's field and seniority

### 5. Readability and impact

- 1: would require substantial rewriting
- 3: usable with adjustments
- 5: clear, strong, and close to ready for use

## Data collection template

Use this block for each sample:

```md
## Sample 01

- Operation:
- Profile:
- Prompt used:
- Input summary:

### Claude Haiku
- Grammar:
- Vocabulary:
- Professional tone:
- Terminology:
- Readability/impact:
- Average:
- Comments:

### GPT-5 Mini
- Grammar:
- Vocabulary:
- Professional tone:
- Terminology:
- Readability/impact:
- Average:
- Comments:

### Comparison
- Winner:
- Perceived difference:
- Is GPT production-ready for this sample? Yes/No
```

Record the final scored outputs in:

- [portuguese-quality-test-results.md](/c:/CurrIA/docs/portuguese-quality-test-results.md)

## Final consolidation

After all 10 samples, consolidate:

- Claude global average
- GPT global average
- GPT average by operation
- GPT's strongest qualities
- GPT's recurring weaknesses
- final recommendation: `OPENAI FULL`, `HYBRID`, or `REVERT TO CLAUDE`

## Mandatory action by result

### If PASS

- keep full OpenAI rollout
- keep the current routing:
  - `agent`: `gpt-5.4-mini`
  - `structured`: `gpt-5-mini`
  - `vision`: `gpt-5-mini`
- make the final migration commit/push

### If CONDITIONAL

- do not publish the all-in OpenAI state
- move to an explicit hybrid architecture
- recommended default:
  - GPT for ingestion, gap analysis, OCR, and the main agent if conversational quality is acceptable
  - Claude for `rewrite_section` and `create_target_resume`
- only then make the final hybrid commit/push

### If FAIL

- do not publish the OpenAI full migration
- revert the runtime provider to Claude
- keep only the audit and evaluation materials that remain useful

## Recommended timeline

- sample preparation: 30 min
- API runs: 2 h
- human evaluation: 2 to 3 h
- final consolidation: 30 min

**Estimated total:** 5 to 6 hours

## Gate invariants

- this gate is **mandatory**
- this gate decides the final production provider
- passing technical tests **does not** replace this evaluation
- the final provider strategy should only be committed and pushed **after** this result
