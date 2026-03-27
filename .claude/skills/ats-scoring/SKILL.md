# Skill: ATS Scoring

Auto-invoked when working in `src/lib/ats/`.

## What this skill covers
The ATS scoring function and its behavioral contract.

## Live scoring contract
- Function: `scoreATS(resumeText, jobDescription?)`
- Output:
  - `total`
  - `breakdown`
  - `issues`
  - `suggestions`

## Current scoring areas
| Category | Weight |
|---|---|
| Format | 20 |
| Section structure | 20 |
| Keyword density | 30 |
| Contact info | 10 |
| Quantified impact | 20 |

## Current behavioral expectations
- short or badly extracted text should trigger critical format feedback
- missing `experience` is a critical issue
- keyword scoring should improve when a target job description is provided
- quantified bullets should materially affect the score

## Testing expectation
When editing ATS scoring logic:
- update `src/lib/ats/score.test.ts`
- preserve existing behavior unless intentionally changing the rubric
- add direct tests for new scoring branches

## Separation From Gap Analysis
- ATS scoring is not target-gap analysis.
- Gap analysis is a separate structured comparison between canonical `cvState` and a target job description.
- Do not mix gap-analysis fields into ATS score output.
