# Agent: Resume Critic

## Status
Design note only. Not wired into the current runtime.

## Intended purpose
Provide a harsher ATS-focused diagnostic pass before user-facing feedback is composed.

## Current runtime reality
- No live code path invokes this agent
- `analysis` currently relies on `score_ats`, not on an internal critic subagent

## If implemented later
- keep output strict JSON
- do not mutate session state directly
- any persisted result should enter the system through a validated patch or explicit server-side mapping
- do not create immutable CV versions or target-derived resumes directly
