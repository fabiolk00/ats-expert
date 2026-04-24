---
phase: 100-clarify-ats-enhancement-intent-selector-while-preserving-tar
reviewed: 2026-04-24T04:23:28.9058167Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/resume/user-data-page.tsx
  - src/components/resume/user-data-page.test.tsx
  - tests/e2e/profile-setup.spec.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 100: Code Review Report

**Reviewed:** 2026-04-24T04:23:28.9058167Z
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Reviewed the explicit ATS versus target-job selector in [`src/components/resume/user-data-page.tsx`](../../../../src/components/resume/user-data-page.tsx), its focused Vitest coverage, and the scoped Playwright spec. The enhancement flow itself is largely consistent with the phase intent, and `npx vitest run "src/components/resume/user-data-page.test.tsx"` passes. The scoped browser suite is not clean, though: `npx playwright test "tests/e2e/profile-setup.spec.ts" --project=chromium` currently fails in two import-flow assertions, and there is one accessibility gap plus one remaining browser-test coverage hole in the new empty-target validation path.

## Warnings

### WR-01: Playwright import assertions are now out of sync with the actual profile flow

**File:** `tests/e2e/profile-setup.spec.ts:227-269, 272-346`  
**Issue:** The Phase 100 spec changes now expect the editor inputs to be visible immediately after a PDF or LinkedIn import finishes. That does not match the current page behavior: after import, the app returns to the profile shell unless the user explicitly opens the editor. The scoped Playwright run is red because both tests wait for `getByPlaceholder("Nome completo")` in the wrong state. This also violates the phase plan's "touch only enhancement-panel scenarios" rule by changing unrelated import coverage.  
**Fix:**
```ts
await expect(page.getByRole("dialog")).toBeHidden()
await openEditor(page)
await expect(page.getByPlaceholder("Nome completo")).toHaveValue("Bruna Costa")
```

### WR-02: Empty target-job validation is not programmatically attached to the textarea

**File:** `src/components/resume/user-data-page.tsx:746-749, 1664-1679`  
**Issue:** The new local validation inserts a `role="alert"` message, but the textarea never gets `aria-invalid`, an `aria-describedby` link, or focus when submission is blocked. Screen readers may announce the alert, but the field itself is not marked invalid and keyboard users stay on the CTA instead of being taken to the control they must fix. That is an accessibility regression in the new intent-selector flow.  
**Fix:**
```tsx
const targetJobInputRef = useRef<HTMLTextAreaElement | null>(null)

if (enhancementIntent === "target_job" && !targetJobDescription.trim()) {
  setTargetJobValidationMessage("Cole a descrição da vaga para adaptar seu currículo.")
  targetJobInputRef.current?.focus()
  return
}

<Textarea
  ref={targetJobInputRef}
  aria-invalid={Boolean(targetJobValidationMessage)}
  aria-describedby={targetJobValidationMessage ? "target-job-description-error" : undefined}
  ...
/>

{targetJobValidationMessage ? (
  <p id="target-job-description-error" role="alert">
    {targetJobValidationMessage}
  </p>
) : null}
```

## Info

### IN-01: The empty target-job browser test can miss an accidental ATS fallback

**File:** `tests/e2e/profile-setup.spec.ts:528-547`  
**Issue:** The new E2E guard only tracks `/api/profile/smart-generation`. If a future regression bypasses the local guard and falls back to `/api/profile/ats-enhancement`, this test can still pass as long as the page stays on `/dashboard/resumes/new`. That leaves the phase's key "do not submit anything" behavior under-verified at browser level.  
**Fix:**
```ts
let atsCalled = false
let smartCalled = false

await page.route("**/api/profile/ats-enhancement", async (route) => {
  atsCalled = true
  await route.abort()
})

await page.route("**/api/profile/smart-generation", async (route) => {
  smartCalled = true
  await route.abort()
})

expect(atsCalled).toBe(false)
expect(smartCalled).toBe(false)
```

---

_Reviewed: 2026-04-24T04:23:28.9058167Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_
