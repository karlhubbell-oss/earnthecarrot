# Test fixtures

## northpeak-fy2025-account-executive.pdf

A **prior-year (FY2025)** variant of the existing **Northpeak Systems FY2026 Account
Executive** comp plan, for testing current-vs-prior plan comparison. Upload it through
the normal flow to exercise ingestion as a prior-year plan.

- `northpeak-fy2025-account-executive.pdf` — the plan document (upload this).
- `northpeak-fy2025-account-executive.html` — the source the PDF was rendered from
  (Chrome headless → PDF). Edit + re-render if you need to tweak the numbers.

### Answer key — the four planted FY2025 → FY2026 differences

| Element | **FY2025** (this fixture) | **FY2026** (existing plan) | Diff type |
|---|---|---|---|
| New Logo commission rate | 6% base (tiers 6 / 9 / 12) | 7% base (tiers 7 / 10.5 / 14) | commission rate change |
| Quota split | New Logo 60%, Renewal 40% | New Logo 50%, Expansion 33%, Renewal 17% | quota-split reweighting |
| Base / OTE | base $140k, OTE $260k | base $150k, OTE $330k | base + OTE change |
| Expansion component | **absent** | $1.0M @ 6% (tiers 6 / 9 / 12) | structural (added in FY2026) |

Held constant as controls: 40% threshold floor, quarterly payout, marginal calc,
pct-of-revenue basis, Renewal flat 3%, 6-month clawback.

Internally consistent: New Logo's absolute quota stays $1.5M both years (only its
*share* drops 60% → 50%), so the rate-change diff is cleanly isolated. Worked example
at 100%: $1.5M × 6% + $1.0M × 3% = **$120k target variable** = OTE $260k − base $140k.

### Verification

Ingestion (`/api/ingest`) was run against this PDF and extracted every planted value
correctly: FY2025 dates, base/OTE/target $140k/$260k/$120k, total quota $2.5M,
New Logo 60% @ tiers 0.06/0.09/0.12, Renewal 40% flat 0.03, **no Expansion**, floor
threshold 40, marginal / pct_of_revenue / quarterly.
