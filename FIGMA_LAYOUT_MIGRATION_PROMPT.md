# CurrIA Figma Layout Migration — Agent Execution Prompt

## Overview

You are tasked with migrating the entire CurrIA frontend layout from current implementation to the new Figma design. The migration must:

- ✅ Replace 100% of the visual layout with Figma designs
- ✅ Preserve 100% of existing functionality
- ✅ Maintain all API contracts and backend integration
- ✅ Keep all business logic intact

**CRITICAL:** Do NOT break existing features. Layout changes only.

---

## Before You Start

### User Will Provide:
1. A **ZIP file** containing Figma design files (components, pages, design tokens)
2. Figma design specifications (colors, typography, spacing, component variants)
3. Updated component library from Figma (if any)

### What You MUST NOT Do:
- ❌ Modify API endpoints or routes
- ❌ Change database schema or queries
- ❌ Alter authentication logic
- ❌ Modify AI integration (OpenAI calls, prompts, tool definitions)
- ❌ Change billing or credit system
- ❌ Remove existing features or functionality

### What You WILL Do:
- ✅ Replace CSS and Tailwind classes
- ✅ Update component styling and layout
- ✅ Reorganize DOM structure (if Figma design requires)
- ✅ Update component composition
- ✅ Implement new visual hierarchy
- ✅ Apply new color system and typography

---

# PHASE 1: Extract & Analyze

## Step 1.1: Extract ZIP File

**Action:**
1. User uploads ZIP file containing Figma designs
2. Extract to temporary directory: `temp-figma-import/`
3. List all files and directories

**Questions to Ask User (Before Proceeding):**
```
CONFIRM - I'm about to extract the Figma ZIP file.

Before I proceed, please confirm:
1. ✓ You've backed up your current codebase (git commit)?
2. ✓ The ZIP contains complete Figma design files?
3. ✓ You're ready to replace the entire layout?
4. ✓ All business logic should stay the same (functionality preserved)?

Should I proceed? (yes/no)
```

## Step 1.2: Analyze File Structure

**Action:**
Read and understand the ZIP contents:
```
temp-figma-import/
├── components/              (new component files)
├── pages/                   (new page layouts)
├── design-tokens.json       (colors, typography, spacing)
├── color-palette.json       (color definitions)
├── README.md               (Figma export documentation)
└── [other Figma files]
```

**Questions to Ask User:**
```
FILE STRUCTURE ANALYSIS

I found the following structure in your Figma export:
- [list directories and files found]

Please confirm:
1. Is this the complete Figma design export?
2. Are there design tokens/variables defined? (colors, spacing, typography)
3. Are all components included (buttons, forms, dialogs, etc.)?
4. Any custom fonts or assets I should be aware of?

Should I proceed with analysis? (yes/no)
```

## Step 1.3: Catalog Current Layout

**Action:**
1. List all React components in `src/components/`
2. List all pages in `src/app/`
3. Read current `tailwind.config.js` and `globals.css`
4. Document current component structure

**Output:**
```
CURRENT LAYOUT INVENTORY:
- Components: [count] files
- Pages: [count] files
- Current color system: [details]
- Current typography: [details]
- Current spacing: [details]
```

## Step 1.4: Compare Current vs Figma

**Action:**
1. Compare Figma color palette with current colors
2. Compare Figma typography with current typography
3. Compare Figma spacing with current spacing
4. List component differences (new, removed, modified)

**Questions to Ask User:**
```
LAYOUT COMPARISON

Current vs Figma Design:

COLORS:
- Current: [list current colors]
- Figma: [list Figma colors]
- Changes: [additions/modifications]

TYPOGRAPHY:
- Current: [list current fonts/sizes]
- Figma: [list Figma fonts/sizes]
- Changes: [additions/modifications]

SPACING:
- Current: [current spacing scale]
- Figma: [Figma spacing scale]
- Changes: [additions/modifications]

COMPONENTS:
- To be UPDATED: [list]
- To be ADDED: [list]
- To be REMOVED: [list]

Does this match your Figma design? (yes/no/clarify)
```

---

# PHASE 2: Preserve Functionality Audit

## Step 2.1: Identify Critical Functionality

**Action:**
Map all existing functionality to pages/components:

```
CRITICAL FUNCTIONALITY AUDIT:

1. AUTHENTICATION
   - Login page (src/app/(public)/login/page.tsx)
   - Signup page (src/app/(public)/signup/page.tsx)
   - Auth forms and logic
   ✓ MUST PRESERVE: Clerk integration, form validation, error handling

2. CHAT INTERFACE (src/components/dashboard/chat-interface.tsx)
   - Message streaming (SSE)
   - File upload
   - Tool use indicators
   - ATS score display
   ✓ MUST PRESERVE: API calls, streaming logic, state management

3. RESUME WORKSPACE (src/components/dashboard/resume-workspace.tsx)
   - Edit sections inline
   - Save functionality
   - Version history
   ✓ MUST PRESERVE: Database updates, version control

4. PRICING & CHECKOUT (src/app/(public)/pricing/page.tsx)
   - Plan cards
   - Asaas checkout integration
   ✓ MUST PRESERVE: Payment flow, billing logic

5. DASHBOARD (src/app/(auth)/dashboard/page.tsx)
   - Session list
   - Navigation
   ✓ MUST PRESERVE: Session management, user context
```

**Questions to Ask User:**
```
FUNCTIONALITY CHECKLIST

I've identified these critical features that MUST work after layout change:

1. ✓ User authentication (login/signup)
2. ✓ Chat streaming (AI responses appear word-by-word)
3. ✓ File upload (resume parsing)
4. ✓ Resume editing (save changes)
5. ✓ ATS scoring (real-time display)
6. ✓ Payment integration (Asaas checkout)
7. ✓ Dark mode toggle
8. ✓ Session management
9. ✓ [other critical features]

Are these all the critical features? Any others I'm missing? (list or confirm)
```

## Step 2.2: Create Functionality Preservation Map

**Action:**
For each component/page:
1. Note current file path
2. Note API/function calls it makes
3. Note state it manages
4. Note props it receives/passes
5. List what MUST NOT change

**Output:**
```
PRESERVATION MAP:

Component: ChatInterface
- Location: src/components/dashboard/chat-interface.tsx
- API Calls: POST /api/agent (SSE)
- State: messages[], sessionId, loading
- Props: sessionId, onMessage
- PRESERVE: ✓ All function calls, ✓ state logic, ✓ props interface
- CHANGE: ✓ Styling, ✓ layout, ✓ DOM structure (if needed)
```

---

# PHASE 3: Design Token Extraction

## Step 3.1: Extract Color System

**Action:**
1. Read Figma color definitions
2. Compare with current `globals.css` CSS variables
3. Create mapping: Old color → New color

**Questions to Ask User:**
```
COLOR SYSTEM

I found these colors in Figma:
- Primary: [hex/rgb]
- Secondary: [hex/rgb]
- Destructive: [hex/rgb]
- Accent: [hex/rgb]
- Success: [hex/rgb]
- Warning: [hex/rgb]
- Background: [hex/rgb]
- Foreground: [hex/rgb]
- [other colors]

Should I:
a) Replace ALL color values in globals.css with these?
b) Keep some current colors and only update specific ones?
c) Create a new color mapping file?

Which option? (a/b/c)
```

## Step 3.2: Extract Typography

**Action:**
1. Read Figma typography definitions (font family, sizes, weights, line-height)
2. Compare with current Tailwind typography
3. Map Figma typography to Tailwind scale

**Questions to Ask User:**
```
TYPOGRAPHY SYSTEM

Figma defines these font settings:
- Font Family: [name]
- Font Sizes: [list sizes used]
- Font Weights: [list weights used]
- Line Heights: [list line heights]

Should I:
a) Update tailwind.config.js to match Figma exactly?
b) Keep Tailwind defaults and only override specific sizes?
c) Add new typography scales?

Which option? (a/b/c)
```

## Step 3.3: Extract Spacing & Layout

**Action:**
1. Read Figma spacing system (padding, margin, gaps)
2. Compare with Tailwind spacing scale
3. Identify new spacing requirements

**Questions to Ask User:**
```
SPACING & LAYOUT

Figma uses these spacing rules:
- Component padding: [values]
- Component gaps: [values]
- Component margins: [values]
- Grid/layout system: [type]

Should I:
a) Keep current Tailwind spacing scale?
b) Update tailwind.config.js to match Figma?
c) Use a combination (Tailwind base + custom overrides)?

Which option? (a/b/c)
```

---

# PHASE 4: Component-by-Component Replacement

## Step 4.1: Identify Components to Replace

**Action:**
1. List all components in `src/components/`
2. Match with Figma components
3. Prioritize by criticality and frequency of use

**Priority Order:**
```
CRITICAL (Core UX):
1. Button (used everywhere)
2. Input (forms)
3. Card (containers)
4. Dialog (modals)

HIGH (Feature Areas):
5. ChatInterface (main feature)
6. ResumeWorkspace (main feature)
7. Navbar (navigation)
8. Sidebar (navigation)

MEDIUM (Supporting):
9. Badge, Alert, Toast
10. Pricing cards
11. Landing page sections

LOW (Utility):
12. Skeleton, Spinner
13. Separator, Divider
```

**Questions to Ask User:**
```
REPLACEMENT PRIORITY

Should I follow this priority order to replace components?

1. HIGH PRIORITY (core, used everywhere):
   - Button, Input, Card, Dialog

2. MEDIUM PRIORITY (feature-critical):
   - ChatInterface, ResumeWorkspace, Navbar, Sidebar

3. LOW PRIORITY (supporting):
   - Badges, Alerts, Landing components

Or different order? (confirm/modify)
```

## Step 4.2: Replace Each Component

**For each component in priority order:**

### Sub-Step A: Read Current Component
```
Current: src/components/[name].tsx
- Props: [list]
- Exports: [list]
- Internal state: [list]
- Function calls: [list]
```

### Sub-Step B: Read Figma Component
```
Figma: [component name]
- States/variants: [list]
- Styling: [colors, spacing, typography]
- Layout: [structure]
- Interactions: [hover, focus, disabled]
```

### Sub-Step C: Question Before Replacement
```
COMPONENT: [ComponentName]

I'm about to replace:
FROM: src/components/[current file]
WITH: Figma design for [component name]

Current:
- Props: [list props]
- Functionality: [describe what it does]

Figma:
- Variants: [list variants]
- New styling: [describe changes]
- DOM structure: [same/different?]

Questions:
1. Should I keep the same props interface?
2. Should I add new prop variants from Figma?
3. Are there any edge cases to preserve?

Should I proceed? (yes/no/clarify)
```

### Sub-Step D: Implement Replacement
```
ACTIONS:
1. Read current component fully
2. Extract all functionality/logic
3. Replace styling with Figma design
4. Update CSS classes / Tailwind classes
5. Add new variants if Figma defines them
6. Keep ALL props and functionality exactly the same
7. Test props still work (don't actually run, just verify)
```

### Sub-Step E: Verify Preservation
```
VERIFICATION:
✓ Props unchanged (same interface)
✓ All functions preserved
✓ All event handlers preserved
✓ All state logic preserved
✓ API calls unchanged
✓ Layout matches Figma visually
✓ All variants from Figma implemented
```

**Questions After Each Component:**
```
REPLACEMENT COMPLETE: [ComponentName]

I've replaced:
- Styling: [describe changes]
- Layout: [describe changes]
- New variants: [list any added]
- Preserved: ✓ Props ✓ Functions ✓ State ✓ Logic

Any issues or adjustments needed? (yes/no/describe)
```

## Step 4.3: Update Pages

**For each page in `src/app/`:**

```
PAGE: [page name]
- Current: [current layout description]
- Figma: [new layout description]
- Components used: [list]
- Layout changes: [describe]

Should I update this page with Figma design? (yes/no/clarify)
```

---

# PHASE 5: Design Token Implementation

## Step 5.1: Update Global CSS Variables

**Action:**
1. Read current `src/app/globals.css`
2. Replace color values with Figma colors
3. Update typography if needed
4. Update spacing if needed

**Before making changes:**
```
GLOBALS.CSS UPDATE

I'm about to update:
- CSS Color Variables: [count]
- Typography Variables: [if any]
- Spacing Variables: [if any]

New values from Figma:
[list all new HSL/hex values]

Should I update these? (yes/no/review)
```

## Step 5.2: Update Tailwind Config

**Action:**
If Figma requires new spacing, fonts, or values:
1. Update `tailwind.config.js` theme.extend
2. Add new spacing scale if needed
3. Add custom fonts if needed

**Before making changes:**
```
TAILWIND.CONFIG UPDATE

Changes needed:
- Custom spacing: [if any]
- Custom fonts: [if any]
- Custom colors: [if any]
- Custom breakpoints: [if any]

Should I update tailwind.config.js? (yes/no/details)
```

---

# PHASE 6: Dark Mode & Theming

## Step 6.1: Verify Dark Mode Support

**Action:**
1. Check if Figma design includes dark mode variants
2. Ensure all new colors work in dark mode
3. Test contrast ratios (WCAG AA minimum)

**Questions:**
```
DARK MODE

Does your Figma design include:
a) Light mode only?
b) Dark mode variants?
c) Both with explicit dark colors?

Should I:
1. Keep dark mode as-is (invert current colors)?
2. Use Figma's dark mode colors?
3. Maintain separate light/dark palettes?

Which approach? (a/b/c)
```

## Step 6.2: Update Theme Toggle

**Action:**
Ensure theme provider still works:
1. Verify `src/components/theme-provider.tsx` still functions
2. Ensure dark mode toggle still switches themes
3. Verify CSS variables update on theme change

**Verification:**
```
DARK MODE VERIFICATION:
✓ Theme toggle component still works
✓ Dark class applied to root correctly
✓ All new colors have dark mode equivalents
✓ Contrast ratios meet WCAG AA
✓ No hardcoded colors in components
```

---

# PHASE 7: Testing & Verification

## Step 7.1: Component Testing

**Action:**
For each replaced component, verify:

```
TESTING CHECKLIST - [ComponentName]

Functionality:
✓ All props work as before
✓ All event handlers fire
✓ State updates correctly
✓ No console errors

Appearance:
✓ Matches Figma design
✓ All variants display correctly
✓ Dark mode looks correct
✓ Responsive (mobile/tablet/desktop)

Integration:
✓ Works with parent component
✓ Data flows correctly
✓ No broken dependencies
```

**Questions:**
```
Should I move to next component? (yes/no/fix this first)
```

## Step 7.2: Page Testing

**Action:**
For each updated page, verify:

```
PAGE TESTING - [PageName]

Navigation:
✓ Links work correctly
✓ Routing still works
✓ Auth checks still work

Functionality:
✓ All features work (upload, chat, edit, etc.)
✓ API calls still succeed
✓ Data displays correctly
✓ Forms submit correctly

Visual:
✓ Matches Figma design
✓ Layout looks correct
✓ Dark mode works
✓ Responsive on all sizes
```

## Step 7.3: End-to-End Flow Testing

**Critical Flows to Verify:**

```
FLOW 1: Authentication
- User can log in ✓
- User can sign up ✓
- Auth state persists ✓

FLOW 2: Chat Interface
- User can upload resume ✓
- Chat displays messages ✓
- Streaming text works ✓
- ATS score displays ✓
- All tools work (rewrite, analyze, etc.) ✓

FLOW 3: Resume Workspace
- User can edit sections ✓
- Changes save to database ✓
- Version history works ✓
- Generate file works ✓

FLOW 4: Pricing & Checkout
- Pricing page displays ✓
- Checkout link works ✓
- Payment integration intact ✓

All flows working? (yes/no/which ones failing)
```

---

# PHASE 8: Final Review & Commit

## Step 8.1: Code Quality Check

**Action:**
1. Run `npm run typecheck` → Must pass
2. Run `npm run lint` → Must pass (no errors, warnings acceptable)
3. Run `npm test` → All tests pass

**Questions Before Commit:**
```
CODE QUALITY CHECK

Testing results:
- TypeScript: [passing/failing]
- Linter: [passing/failing]
- Tests: [passing/failing]

All checks passing? (yes/no/fix first)
```

## Step 8.2: Visual Review

**Action:**
User should visually review:
1. All pages match Figma design
2. All functionality still works
3. Dark mode looks correct
4. Responsive design works

**Questions:**
```
VISUAL REVIEW

Please verify:
1. Does the layout match your Figma design 100%?
2. Do all features still work as before?
3. Does dark mode look correct?
4. Responsive layout working?
5. Any issues or adjustments needed?

Ready to commit? (yes/no/describe issues)
```

## Step 8.3: Commit Changes

**Action:**
Create git commit with migration details:

```
COMMIT MESSAGE:

feat: migrate entire layout from Figma design

- Replaced all component styling with Figma design
- Updated color system (globals.css, tailwind.config.js)
- Updated typography and spacing per Figma
- Preserved 100% of functionality and features
- Verified all pages and flows working correctly
- Maintained dark mode support
- All tests passing (typecheck, lint, tests)

Changes:
- src/components/ - [count] components updated
- src/app/ - [count] pages updated
- src/app/globals.css - color system updated
- tailwind.config.js - [if updated]

Functionality Preserved:
✓ Authentication (login, signup)
✓ Chat interface (streaming, tools)
✓ Resume workspace (editing, saving)
✓ Pricing & checkout
✓ Dark mode toggle
✓ All API integrations
```

**Questions Before Commit:**
```
FINAL COMMIT

I'm ready to create the commit:
Subject: feat: migrate entire layout from Figma design

Does this look correct? (yes/no/modify message)
```

---

# PHASE 9: Post-Migration Monitoring

## Step 9.1: Monitor for Issues

**Action:**
After deployment:
1. Check browser console for errors
2. Test all features once more
3. Check mobile responsiveness
4. Verify dark mode works
5. Monitor performance

**Questions:**
```
POST-MIGRATION CHECKLIST

Please verify:
1. No console errors in browser?
2. All features working correctly?
3. Mobile view responsive?
4. Dark mode toggle works?
5. Page load performance acceptable?
6. Any reported user issues?

All good? (yes/no/describe issue)
```

## Step 9.2: Cleanup

**Action:**
1. Remove temporary Figma import files
2. Delete backup files (if any)
3. Verify git status is clean

```
Cleanup complete:
- Removed: temp-figma-import/
- Removed: [backup files]
- Git status: clean
```

---

# Summary & Exit Criteria

## Migration Complete When:

✅ All components replaced with Figma design
✅ All pages updated with Figma layout
✅ Design tokens (colors, typography, spacing) updated
✅ Dark mode working correctly
✅ All functionality preserved and working
✅ TypeScript typecheck passing
✅ Linter passing
✅ All tests passing
✅ Visual review approved by user
✅ Git commit created
✅ Post-migration testing complete

---

# Final Checklist

Before considering migration complete, confirm:

```
FINAL VERIFICATION:

Code Quality:
✓ npm run typecheck - PASSING
✓ npm run lint - PASSING
✓ npm test - PASSING
✓ npm run build - PASSING

Functionality:
✓ Authentication working
✓ Chat interface working
✓ Resume workspace working
✓ File upload working
✓ ATS scoring working
✓ Dark mode working
✓ All features working as before

Appearance:
✓ 100% matches Figma design
✓ All colors correct
✓ Typography correct
✓ Spacing correct
✓ Responsive on all breakpoints
✓ Dark mode looks correct

Documentation:
✓ Commit created with full details
✓ Figma import files cleaned up
✓ No temporary files left

Ready to call migration COMPLETE? (yes/confirm)
```

---

**END OF PROMPT**

This prompt provides a complete, step-by-step guide for the AI agent to replace your entire layout with Figma designs while preserving all functionality.
