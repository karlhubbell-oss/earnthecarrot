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

  // Parsed plan-level tiers, ascending by attainment.
  const parsedTiers = (Array.isArray(commission.tiers) ? commission.tiers : [])
    .filter((t) => t && t.from_attainment_pct != null)
    .sort((a, b) => (a.from_attainment_pct || 0) - (b.from_attainment_pct || 0));
  // Do the plan-level tiers carry real per-band rates (a single accelerator
  // schedule, e.g. Ridgeline), or only thresholds and labels? A multi-component
  // plan stores its accelerator inside each component's own ladder, leaving the
  // plan-level rates null. In that case the multipliers must come from the
  // components, not from these null rates.
  const planTiersHaveRates = parsedTiers.some((t) => t.rate != null && Number(t.rate) > 0);

  // Base rate: the first band's rate when present; otherwise the rate implied by
  // targetVariable / quota (which makes commission at 100% equal target variable).
  let baseRate = parsedTiers.length && parsedTiers[0].rate != null ? Number(parsedTiers[0].rate) : null;
  if (!baseRate || baseRate <= 0) baseRate = totalQuota > 0 ? targetVariable / totalQuota : 0;

  const EPS = 1e-9;
  // Components. Each may carry its own band ladder. The per-component bands are
  // AUTHORITATIVE: a component's own ladder decides its base rate and whether it
  // accelerates (its rate rising above its own base in a higher band), regardless
  // of what the plan-level tiers happen to carry. This is what keeps multi-component
  // accelerators from being dropped when the plan-level tiers also carry rates.
  let components = (Array.isArray(quota.components) ? quota.components : [])
    .filter(Boolean)
    .map((c) => {
      const bands = (Array.isArray(c.tiers) && c.tiers.length)
        ? c.tiers
            .map((t) => ({ fromAttainment: (t.from_attainment_pct || 0) / 100, rate: t.rate != null ? Number(t.rate) : null }))
            .sort((a, b) => a.fromAttainment - b.fromAttainment)
        : null;
      const compBase = bands && bands[0] && bands[0].rate != null
        ? bands[0].rate
        : (c.rate != null ? Number(c.rate) : baseRate);
      const bandMults = bands
        ? bands.map((b) => ({ fromAttainment: b.fromAttainment, multiplier: compBase > 0 && b.rate != null ? b.rate / compBase : 1 }))
        : null;
      const bandAccelerates = bandMults ? bandMults.some((m) => Math.abs(m.multiplier - 1) > EPS) : null;
      return {
        name: c.name || "Component",
        quota: n(c.quota_amount) || 0,
        rate: compBase,
        // Bands win when present: accelerable iff this component's own ladder rises.
        // Only a component with no ladder of its own falls back to the stored flag
        // (it then rides the plan-level schedule, e.g. a single-component plan). The
        // stored flag is unreliable on multi-component plans, so we do not trust it
        // when the component carries bands.
        accelerable: bandMults != null ? !!bandAccelerates : (c.accelerable !== false),
        _bandMults: bandMults,
        _bandAccelerates: bandAccelerates,
      };
    });
  const compQuotaSum = components.reduce((s, c) => s + (c.quota || 0), 0);
  if (rateBasis === "pct_of_revenue" && (components.length === 0 || compQuotaSum <= 0)) {
    components = [{ name: "Quota", quota: totalQuota, rate: baseRate, accelerable: true, _bandMults: null, _bandAccelerates: null }];
  }

  // Plan-level multiplier schedule the engine applies to accelerable components.
  // Priority, independent of whether the plan-level tiers carry rates:
  //  1. If any component's OWN ladder accelerates, use that schedule (authoritative;
  //     in a well-formed plan the accelerating components share one schedule, e.g.
  //     New Logo and Expansion both 1.5x then 2x).
  //  2. Else if the plan-level tiers carry real rates, use them (a single plan-level
  //     accelerator/decelerator, e.g. Ridgeline).
  //  3. Else flat.
  let tiers;
  const accel = components
    .filter((c) => c._bandMults && c._bandAccelerates)
    .sort((a, b) => b._bandMults.length - a._bandMults.length);
  if (accel.length) {
    tiers = accel[0]._bandMults.map((m) => ({ fromAttainment: m.fromAttainment, multiplier: m.multiplier }));
  } else if (planTiersHaveRates) {
    tiers = parsedTiers.map((t) => ({
      fromAttainment: (t.from_attainment_pct || 0) / 100,
      multiplier: baseRate > 0 && t.rate != null ? Number(t.rate) / baseRate : 1,
    }));
  } else if (parsedTiers.length) {
    tiers = parsedTiers.map((t) => ({ fromAttainment: (t.from_attainment_pct || 0) / 100, multiplier: 1 }));
  } else {
    tiers = [{ fromAttainment: 0, multiplier: 1 }];
  }
  components.forEach((c) => { delete c._bandMults; delete c._bandAccelerates; });

  const floorPct = commission.floor && commission.floor.type && commission.floor.type !== "none" ? commission.floor.attainment_pct : null;
  const floor = floorPct != null ? { attainment: Number(floorPct) / 100 } : null;

  const capPct = commission.cap && commission.cap.type && commission.cap.type !== "none" ? commission.cap.attainment_pct : null;
  const cap = capPct != null ? { attainment: Number(capPct) / 100 } : null;

  return { baseSalary, ote, targetVariable, totalQuota, rateBasis, components, tiers, floor, cap, dealCrossingRule: "split" };
}
