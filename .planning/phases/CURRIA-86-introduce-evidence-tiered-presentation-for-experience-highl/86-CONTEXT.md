# Phase 86 Context

## Title
Introduce evidence-tiered presentation for experience highlights

## Problem

The selector had become stable enough, but the preview still felt flatter and noisier than intended because all winning experience categories rendered with the same inline highlight treatment.

## Scope

In scope:

- experience highlight presentation contract
- UI differentiation between stronger and secondary evidence

Out of scope:

- selector ranking
- completion logic
- diff/render split
- summary, PDF, ATS scoring, rewrite pipeline

## Intended Outcome

- Tier 1 evidence keeps strong inline emphasis
- Tier 2 evidence gains a subtler treatment
- premium feel improves through hierarchy, not selector retuning
