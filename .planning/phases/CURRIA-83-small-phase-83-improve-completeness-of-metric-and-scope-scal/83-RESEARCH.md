# Phase 83 Research

## Verified Bottleneck

The selector was structurally healthy, but some winning spans still looked visually clipped.

Evidence:
- Homologation after Phase 82 showed repeated concern around:
  - terminal metric fragments like `40%`
  - short metric phrases like `27% o tempo de atendimento`
  - clipped scope fragments like `global para multiplas`
- These were not ranking failures. The correct category was already winning.

## Refactor Direction

- Keep candidate taxonomy and ranking unchanged.
- Add bounded phrase completion for `metric` and `scope_scale` only.
- Prefer evidence phrases that stay compact while adding enough local context to read cleanly in isolation.

## Key Implementation Notes

- Added metric completion that can recover short noun phrases immediately before terminal metrics such as `tempo de processamento em 40%`.
- Added scope completion that can prepend `escopo` and finish short scale phrases such as `escopo global para multiplas operacoes`.
- Kept the completion pass tightly bounded so long narrative spans do not enter through the cleanup step.
