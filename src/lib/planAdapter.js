// Adapter: map the plan object returned by api/get-plan to the exact shape
// src/lib/earnings.js expects. Pure, no side effects. Does not modify earnings.js.
//
// get-plan shape (subset):  meta, pay.{base_salary,ote,target_variable,pay_mix},
//   quota.{total_quota, components[{name,quota_amount,weight_pct,commission}]},
//   commission.{rate_basis, tiers[{from_attainment_pct,to_attainment_pct,rate,label}],
//   floor{type,attainment_pct}, cap{type,attainment_pct}}
//
// earnings shape: { baseSalary, ote, targetVariable, totalQuota, rateBasis,
//   components[{name,quota,rate,accelerable}], tiers[{fromAttainment,multiplier}],
//   floor{attainment}|null, cap{attainment}|{payout}|null }

const n = (v) => (v == null ? null : Number(v));

export function toEarningsPlan(plan) {
  if (!plan) return null;
  const pay = plan.pay || {};
  const quota = plan.quota || {};
  const commission = plan.commission || {};

  const baseSalary = n(pay.base_salary && pay.base_salary.amount) || 0;
  const ote = n(pay.ote && pay.ote.amount) || 0;
  let targetVariable = n(pay.target_variable && pay.target_variable.amount);
  if (targetVariable == null) targetVariable = ote && baseSalary ? ote - baseSalary : 0;
  const totalQuota = n(quota.total_quota && quota.total_quota.amount) || 0;

  // rate basis: get-plan uses "pct_of_variable"; earnings wants "pct_of_target_variable".
  const rateBasis = commission.rate_basis === "pct_of_variable" ? "pct_of_target_variable" : "pct_of_revenue";

  // Parsed tiers, ascending by attainment, with absolute per-band rates.
  const parsedTiers = (Array.isArray(commission.tiers) ? commission.tiers : [])
    .filter((t) => t && t.from_attainment_pct != null)
    .sort((a, b) => (a.from_attainment_pct || 0) - (b.from_attainment_pct || 0));

  // Base rate: the first band's rate when present; otherwise the rate implied by
  // targetVariable / quota (which makes commission at 100% equal target variable).
  let baseRate = parsedTiers.length && parsedTiers[0].rate != null ? Number(parsedTiers[0].rate) : null;
  if (!baseRate || baseRate <= 0) baseRate = totalQuota > 0 ? targetVariable / totalQuota : 0;

  // Tiers -> { fromAttainment (0..1+), multiplier (band rate relative to base) }.
  // No synthetic 0% band: when the first paying band starts above 0 (with a floor),
  // revenue below it correctly earns nothing.
  const tiers = parsedTiers.length
    ? parsedTiers.map((t) => ({
        fromAttainment: (t.from_attainment_pct || 0) / 100,
        multiplier: baseRate > 0 && t.rate != null ? Number(t.rate) / baseRate : 1,
      }))
    : [{ fromAttainment: 0, multiplier: 1 }];

  // Components: get-plan stores quota per component but not a per-component rate,
  // so each component takes the base rate (accelerable by default).
  let components = (Array.isArray(quota.components) ? quota.components : [])
    .filter(Boolean)
    .map((c) => ({
      name: c.name || "Component",
      quota: n(c.quota_amount) || 0,
      rate: c.rate != null ? Number(c.rate) : baseRate,
      accelerable: true,
    }));
  const compQuotaSum = components.reduce((s, c) => s + (c.quota || 0), 0);
  if (rateBasis === "pct_of_revenue" && (components.length === 0 || compQuotaSum <= 0)) {
    components = [{ name: "Quota", quota: totalQuota, rate: baseRate, accelerable: true }];
  }

  const floorPct = commission.floor && commission.floor.type && commission.floor.type !== "none" ? commission.floor.attainment_pct : null;
  const floor = floorPct != null ? { attainment: Number(floorPct) / 100 } : null;

  const capPct = commission.cap && commission.cap.type && commission.cap.type !== "none" ? commission.cap.attainment_pct : null;
  const cap = capPct != null ? { attainment: Number(capPct) / 100 } : null;

  return { baseSalary, ote, targetVariable, totalQuota, rateBasis, components, tiers, floor, cap, dealCrossingRule: "split" };
}
