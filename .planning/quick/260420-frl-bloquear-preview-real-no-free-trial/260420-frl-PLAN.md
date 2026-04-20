# Quick Task 260420-frl Plan

## Goal

Prevent free-trial users from accessing the real generated resume content after spending their single credit, while still letting them see a locked preview experience that cannot be bypassed through devtools.

## Tasks

1. Persist a durable "locked preview / paid regeneration required" marker on generated outputs created under the `free` plan.
2. Add server-side sanitization so locked previews return fake CV content and a fake PDF URL instead of the real optimized/target resume data.
3. Block editing and downloading of locked generated resumes while keeping the original base profile accessible.
4. Update the UI to show a blurred/locked preview state with clear upgrade/regenerate messaging.
5. Add focused tests for route sanitization, locked preview responses, and blocked edit flows.
