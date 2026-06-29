// Structured diff between a current plan and a prior plan (both in the shape produced
// by lib/planShape.js reshapePlan). Drives Coach's comparison commentary now and UI
// highlighting later. Pure: no IO, no model calls.
//
// Result shape:
// {
//   hasPrior: true,
//   priorYear, currentYear,
//   pay:        [ { field: "base_salary"|"ote"|"target_variable", from, to } ],   // only changed
//   components: [ { name, change: "added"|"removed"|"modified",
//                   weight:   { from, to } | null,   // weight_pct change
//                   rate:     { from, to } | null,   // base rate change
//                   quota:    { from, to } | null,   // quota_amount change
//                   tiers:    { from: [...], to: [...] } | null } ],
//   summary: { payChanges, componentsAdded, componentsRemoved, componentsModified, total }
// }
//
// Only differences are listed. Fields that are equal are omitted, so anything held
// constant (floor, payout, clawback, an unchanged rate) never shows up.

// Compare two numbers with a small tolerance so float noise (e.g. 6 vs 6.0000001)
// isn't reported as a change. null/undefined are treated as "absent".
function numChanged(a, b) {
  const an = a == null ? null : Number(a);
  const bn = b == null ? null : Number(b);
  if (an == null && bn == null) return false;
  if (an == null || bn == null) return true;
  return Math.abs(an - bn) > 1e-6;
}

// Normalize a component's tier ladder to a comparable, order-stable array.
function normTiers(c) {
  const ts = Array.isArray(c && c.tiers) ? c.tiers : [];
  return ts
    .map((t) => ({
      from: t.from_attainment_pct == null ? null : Number(t.from_attainment_pct),
      to: t.to_attainment_pct == null ? null : Number(t.to_attainment_pct),
      rate: t.rate == null ? null : Number(t.rate),
    }))
    .sort((x, y) => (x.from || 0) - (y.from || 0));
}

function tiersChanged(prev, cur) {
  const a = normTiers(prev);
  const b = normTiers(cur);
  if (a.length !== b.length) return true;
  for (let i = 0; i < a.length; i++) {
    if (numChanged(a[i].from, b[i].from) || numChanged(a[i].to, b[i].to) || numChanged(a[i].rate, b[i].rate)) return true;
  }
  return false;
}

// Match key for a component across years: name, case/space-insensitive.
const compKey = (c) => String((c && c.name) || "").trim().toLowerCase();

const yearOf = (plan) => {
  // Prefer the authoritative plan_year (carried through reshapePlan's meta); the
  // reshaped start_date can be a stringified Date, so don't parse a year out of it.
  const y = plan && plan.meta && plan.meta.plan_year;
  return y != null && !isNaN(Number(y)) ? Number(y) : null;
};

const payAmt = (plan, path) => {
  const p = plan && plan.pay && plan.pay[path];
  return p && p.amount != null ? Number(p.amount) : null;
};

export function diffPlans(currentPlan, priorPlan) {
  if (!currentPlan || !priorPlan) {
    return { hasPrior: false, pay: [], components: [], summary: { payChanges: 0, componentsAdded: 0, componentsRemoved: 0, componentsModified: 0, total: 0 } };
  }

  // ── Pay (base / OTE / target variable) ──
  const pay = [];
  for (const field of ["base_salary", "ote", "target_variable"]) {
    const from = payAmt(priorPlan, field);
    const to = payAmt(currentPlan, field);
    if (numChanged(from, to)) pay.push({ field, from, to });
  }

  // ── Components matched by name ──
  const curComps = Array.isArray(currentPlan.quota && currentPlan.quota.components) ? currentPlan.quota.components : [];
  const priorComps = Array.isArray(priorPlan.quota && priorPlan.quota.components) ? priorPlan.quota.components : [];
  const priorByKey = new Map(priorComps.map((c) => [compKey(c), c]));
  const curByKey = new Map(curComps.map((c) => [compKey(c), c]));

  const components = [];

  // Present in current: added (no prior match) or modified.
  for (const cur of curComps) {
    const prev = priorByKey.get(compKey(cur));
    if (!prev) {
      components.push({
        name: cur.name || "", change: "added",
        weight: { from: null, to: cur.weight_pct ?? null },
        rate: { from: null, to: cur.rate ?? null },
        quota: { from: null, to: cur.quota_amount ?? null },
        tiers: { from: [], to: normTiers(cur) },
      });
      continue;
    }
    const weight = numChanged(prev.weight_pct, cur.weight_pct) ? { from: prev.weight_pct ?? null, to: cur.weight_pct ?? null } : null;
    const rate = numChanged(prev.rate, cur.rate) ? { from: prev.rate ?? null, to: cur.rate ?? null } : null;
    const quota = numChanged(prev.quota_amount, cur.quota_amount) ? { from: prev.quota_amount ?? null, to: cur.quota_amount ?? null } : null;
    const tiers = tiersChanged(prev, cur) ? { from: normTiers(prev), to: normTiers(cur) } : null;
    if (weight || rate || quota || tiers) {
      components.push({ name: cur.name || "", change: "modified", weight, rate, quota, tiers });
    }
  }

  // Present in prior but not current: removed.
  for (const prev of priorComps) {
    if (!curByKey.has(compKey(prev))) {
      components.push({
        name: prev.name || "", change: "removed",
        weight: { from: prev.weight_pct ?? null, to: null },
        rate: { from: prev.rate ?? null, to: null },
        quota: { from: prev.quota_amount ?? null, to: null },
        tiers: { from: normTiers(prev), to: [] },
      });
    }
  }

  const summary = {
    payChanges: pay.length,
    componentsAdded: components.filter((c) => c.change === "added").length,
    componentsRemoved: components.filter((c) => c.change === "removed").length,
    componentsModified: components.filter((c) => c.change === "modified").length,
    total: pay.length + components.length,
  };

  return { hasPrior: true, priorYear: yearOf(priorPlan), currentYear: yearOf(currentPlan), pay, components, summary };
}
