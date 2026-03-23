# Skill: ATS Scoring

Auto-invoked when working on any file inside `src/lib/ats/`.

## What this skill covers
The algorithm that scores a resume for ATS compatibility and returns structured feedback.

## Score breakdown (total: 100 points)

| Category         | Weight | What is checked                                          |
|------------------|--------|----------------------------------------------------------|
| Format           | 20pts  | Single column, no tables, no images, standard fonts      |
| Section structure| 20pts  | Standard headings present (Experience, Education, Skills)|
| Keyword density  | 30pts  | Match rate against job description or general keywords   |
| Contact info     | 10pts  | Name, email, phone, LinkedIn present in plain text       |
| Quantified impact| 20pts  | Numbers/metrics in experience bullet points              |

## Scoring function signature

```ts
type ATSScoreResult = {
  total: number           // 0–100
  breakdown: {
    format: number
    structure: number
    keywords: number
    contact: number
    impact: number
  }
  issues: ATSIssue[]      // sorted by severity: critical first
  suggestions: string[]   // top 3 actionable fixes
}

type ATSIssue = {
  severity: 'critical' | 'warning' | 'info'
  section: string
  message: string
}

function scoreATS(resumeText: string, jobDescription?: string): ATSScoreResult
```

## Format detection rules
- **Two-column layout**: detect interleaved text or excessive tab chars (`\t` count > 10) — flag as critical
- **Tables**: look for pipe chars (`|` count > 5) or `\t\t` patterns — flag as critical
- **Scanned PDF**: if extracted text length < 300 chars for a multi-page doc — flag as critical, suggest OCR
- **Non-standard fonts**: not detectable from text extraction — skip this check

## Section heading detection
Accepted heading variants (case-insensitive):

```ts
const SECTION_HEADINGS = {
  experience: ['experience', 'work experience', 'professional experience', 'career history', 'employment'],
  education:  ['education', 'academic background', 'qualifications', 'academic history'],
  skills:     ['skills', 'technical skills', 'competencies', 'technologies', 'core skills'],
  summary:    ['summary', 'profile', 'objective', 'about me', 'professional summary'],
}
```

Each detected section = +5 points. Missing `experience` = critical issue. Others = warning.

## Keyword matching
- If a job description is provided: extract noun phrases and technical terms, compute overlap %
- If no job description: match against `ACTION_VERBS` list (led, built, reduced, increased, etc.)
- Score = `Math.round((matched / total) * 30)`, capped at 30
- Below 40% match rate → add a warning issue

## Quantified impact detection
Scan experience bullet points for:
```ts
const METRIC_PATTERN = /\d+(%|x|×|\s*(million|billion|k\b))?|\$|R\$|doubled|tripled|halved/gi
```
Score = `Math.round((bulletsWithMetrics / totalBullets) * 20)`

## Contact info scoring
- Email found (regex): +5pts
- Phone found (BR format regex): +3pts
- LinkedIn found (`linkedin` in text): +2pts

## Test coverage requirement
Every scoring rule must have a test in `src/lib/ats/score.test.ts`.
Use real resume snippets from `tests/fixtures/resumes/` — not synthetic strings.
100% coverage required for all functions in `src/lib/ats/`.
