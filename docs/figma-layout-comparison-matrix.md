# CurrIA Figma Layout Comparison Matrix

## Summary

This migration uses the imported Figma package as a visual system reference, not as a drop-in application replacement.

Why:
- the imported bundle is a Vite plus react-router demo app
- several imported dashboard components use mock state and placeholder data
- CurrIA must preserve live Next.js routes, Clerk auth, SSE chat, workspace persistence, and billing flows

Applied strategy:
- adopt the imported OKLCH token direction in the real app
- re-skin the existing live components and page shells
- keep all runtime contracts, API calls, and business logic intact

## Design Token Mapping

| Area | Current CurrIA | Imported Figma | Migration Decision |
|---|---|---|---|
| Color model | HSL CSS vars | OKLCH CSS vars | Adopt OKLCH tokens in [globals.css](../src/app/globals.css) |
| Tailwind | Tailwind v3 | Tailwind v4-style CSS config | Keep Tailwind v3, map tokens in [tailwind.config.js](../tailwind.config.js) |
| Light/Dark theme | Supported | Supported | Preserve both themes |
| Radius | Existing shadcn radius tokens | Larger, softer cards | Preserve token API, update visuals via CSS/classes |
| Motion | Minimal | Subtle glows and layered depth | Apply selectively on landing/auth/dashboard shell |

## Component Mapping

| CurrIA live component | Imported Figma reference | Decision |
|---|---|---|
| [header.tsx](../src/components/landing/header.tsx) | Figma design system | Rebuilt visually, preserved real Next links and Clerk behavior |
| [hero-section.tsx](../src/components/landing/hero-section.tsx) | Figma design system | Rebuilt visually, preserved existing CTA flow |
| [pricing-section.tsx](../src/components/landing/pricing-section.tsx) | Figma design system | Rebuilt visually, preserved CurrIA plans and pricing routes |
| [footer.tsx](../src/components/landing/footer.tsx) | Figma design system | Rebuilt visually, preserved current link structure |
| [dashboard-shell.tsx](../src/components/dashboard/dashboard-shell.tsx) | Figma design system | Moved desktop layout to left-nav shell, preserved auth layout contract |
| [sidebar.tsx](../src/components/dashboard/sidebar.tsx) | Figma design system | Rebuilt visually, preserved real routes and sign-out |
| [chat-interface.tsx](../src/components/dashboard/chat-interface.tsx) | Figma design system | Rebuilt visually on top of the live SSE, upload, and session-loading flow |
| [chat-message.tsx](../src/components/dashboard/chat-message.tsx) | Figma design system | Rebuilt visually, preserved markdown rendering and analysis payload structure |
| [resume-workspace.tsx](../src/components/dashboard/resume-workspace.tsx) | Figma design system | Rebuilt live workspace hierarchy, preserved all workspace mutations and downloads |
| [manual-edit-dialog.tsx](../src/components/dashboard/manual-edit-dialog.tsx) | imported modal treatment | Restyled overlay only, preserved edit payload logic |
| [compare-drawer.tsx](../src/components/dashboard/compare-drawer.tsx) | imported side-panel treatment | Restyled comparison panel, preserved snapshot diff logic |
| [session-card.tsx](../src/components/session-card.tsx) | imported dashboard card language | Rebuilt visually, preserved session routing and generation actions |
| [login-form.tsx](../src/components/auth/login-form.tsx) | Figma design system | Preserved Clerk sign-in logic, updated wrapper styling only |
| [signup-form.tsx](../src/components/auth/signup-form.tsx) | imported auth card treatment | Preserved Clerk sign-up and verification flow, updated presentation |

## Preservation Rules

The following were intentionally not changed:
- Next.js route structure under `src/app/`
- Clerk authentication flow and redirect behavior
- `/api/agent` SSE contract
- workspace data loading and mutation calls
- billing and checkout behavior
- database schema and Prisma access
- OpenAI integration and model routing logic

## Imported Package Caveats

The following imported files were used as reference only and were not copied into the live app:
- `temp-figma-import/src/app/components/dashboard/ChatInterface.tsx`
- `temp-figma-import/src/app/components/dashboard/ResumeWorkspace.tsx`
- `temp-figma-import/src/app/pages/*.tsx`

Reason:
- they rely on react-router, Vite-specific structure, and mock/demo interaction code
- replacing CurrIA's live components with them would risk breaking streaming, persistence, and auth

## Current Implementation Status

Completed:
- OKLCH token migration in [globals.css](../src/app/globals.css)
- Tailwind token mapping in [tailwind.config.js](../tailwind.config.js)
- landing shell refresh
- auth page and form refresh
- dashboard shell and sidebar refresh
- live workspace refresh for [chat-interface.tsx](../src/components/dashboard/chat-interface.tsx)
- live workspace refresh for [chat-message.tsx](../src/components/dashboard/chat-message.tsx)
- live workspace refresh for [resume-workspace.tsx](../src/components/dashboard/resume-workspace.tsx)
- supporting workspace overlay refresh for [manual-edit-dialog.tsx](../src/components/dashboard/manual-edit-dialog.tsx) and [compare-drawer.tsx](../src/components/dashboard/compare-drawer.tsx)
- session card refresh for [session-card.tsx](../src/components/session-card.tsx)
- validation boundary update in [tsconfig.json](../tsconfig.json) to keep the imported temp app out of the project scope during validation

Remaining follow-up work:
- responsive spot-checks against the imported design on real devices
- optional fine-tuning of lower-priority pages and any remaining utility components not covered in the live shell/workspace pass

## Verification

Validated after the migration slice:
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm test`

The earlier shell migration passed these checks on March 30, 2026. They must be re-run after the workspace pass before claiming the Figma migration slice is complete.


