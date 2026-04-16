# Quick Task 260415-xbf Plan

## Goal

Reorganize the `rewrite-section` system prompt so the golden rule, preservation hierarchy, ATS JSON contract, and pt-BR technical-language rules are clearer and more authoritative to the model.

## Tasks

1. Refactor the prompt into a dedicated builder with clear priority ordering and section-specific instructions.
2. Tighten output handling by normalizing short factual `changes_made` entries with an upper bound.
3. Add focused regression coverage for the new prompt structure and the `changes_made` cap.
