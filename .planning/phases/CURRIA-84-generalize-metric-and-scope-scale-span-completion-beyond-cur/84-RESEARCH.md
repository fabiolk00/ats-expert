# Phase 84 Research

## Verified Bottleneck

The bottleneck was phrase-shape overfitting in completion rules.

Evidence from cross-domain checks:
- `em X% ...` still clipped awkwardly in sales-style phrasing.
- `R$ ... a ...` could lose explanatory context in customer-success phrasing.
- `nacional com alto ...` exposed narrow scope/scale completion logic in operations phrasing.

## Refactor Direction

- Use local phrase-structure rules in a bounded text window around the winning candidate.
- For `metric`, prefer:
  - noun phrase + `em` + metric anchor
  - metric anchor + compact object phrase
  - compact time-based metric phrases such as `14 horas por semana`
- For `scope_scale`, prefer compact structural phrases such as:
  - `operacao nacional com alto volume de entregas`
  - `escopo regional para multiplas unidades hospitalares`
  - `mais de 120 contas ativas`

## Key Implementation Notes

- Introduced windowed phrase-pattern collection and best-match selection.
- Metric completion now anchors on the metric token itself rather than forcing the completed span to cover the old raw candidate bounds.
- Added cross-domain regressions for sales, healthcare, customer success, operations, and education.
