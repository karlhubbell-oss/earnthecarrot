// Earn The Carrot - Job 2: earnings engine
//
// Pure deterministic math. No API, no token cost, runs instantly.
// Fed by the plan object get-plan returns. Output drives the payout curve,
// pay statement reconciliation, and the position aware what if.
//
// Tier model (confirmed): incremental bands, per component base rates,
// accelerators keyed to TOTAL attainment. A deal that straddles a band
// gets split at the line (deal crossing rule banked as a plan fact, default split).
//
// The whole engine rests on one primitive: commission on a slice of revenue
// given where the rep already sits. Curve, reconciliation, and what if are
// all just calls into that.

// ---------------------------------------------------------------------------
// Expected plan shape (map get-plan output to this; field names may differ):
//
// {
//   baseSalary: 150000,
//   ote: 330000,
//   targetVariable: 180000,        // variable comp at 100% attainment (ote - base)
//   totalQuota: 3000000,
//   rateBasis: 'pct_of_revenue',   // or 'pct_of_target_variable'
//   components: [                  // used when rateBasis === 'pct_of_revenue'
//     { name: 'New Logo',   quota: 1500000, rate: 0.07, accelerable: true },
//     { name: 'Expansion',  quota: 1000000, rate: 0.06, accelerable: true },
//     { name: 'Renewal',    quota: 500000,  rate: 0.03, accelerable: false },
//   ],
//   tiers: [                       // accelerator bands on TOTAL attainment, ascending
//     { fromAttainment: 0.0, multiplier: 1.0 },
//     { fromAttainment: 1.0, multiplier: 1.5 },
//     { fromAttainment: 1.5, multiplier: 2.0 },
//   ],
//   floor: { attainment: 0.4 } | null,   // gate: below this, commission is 0
//   cap:   { attainment: 2.0 } | { payout: 500000 } | null,
//   dealCrossingRule: 'split',     // banked; only used at deal level, default split
// }
//
// LABELED ASSUMPTIONS (surface these to the rep, do not bury them):
//  - Floor is a GATE: below floor attainment, commission is 0; at or above it,
//    commission is earned from the first dollar. (Alt: deductible. enum later.)
//  - For the aggregate curve, revenue is assumed to arrive in quota-mix
//    proportion, giving a blended base rate per dollar. Itemized deals override
//    this with their real component rate.
//  - Accelerators apply per component via the accelerable flag (default true).
//    Set a component accelerable:false to keep it at base rate in every band.
// ---------------------------------------------------------------------------

const EPS = 1e-9;

function normalizePlan(plan) {
  const p = { ...plan };
  p.components = (p.components || []).map((c) => ({
    accelerable: c.accelerable !== false, // default true
    ...c,
  }));
  p.tiers = (p.tiers && p.tiers.length ? [...p.tiers] : [{ fromAttainment: 0, multiplier: 1 }])
    .sort((a, b) => a.fromAttainment - b.fromAttainment);
  return p;
}

// Walk the tier bands over an attainment range and call fn for each overlap.
// fn receives (widthFraction, multiplier) where widthFraction is the slice of
// attainment inside that band.
function walkBands(plan, aLo, aHi, fn) {
  if (aHi <= aLo + EPS) return;
  const tiers = plan.tiers;
  for (let i = 0; i < tiers.length; i++) {
    const bandLo = tiers[i].fromAttainment;
    const bandHi = i + 1 < tiers.length ? tiers[i + 1].fromAttainment : Infinity;
    const lo = Math.max(aLo, bandLo);
    const hi = Math.min(aHi, bandHi);
    if (hi <= lo + EPS) continue;
    fn(hi - lo, tiers[i].multiplier);
  }
}

// Quota-weighted blended base rate (used for the aggregate curve).
function blendedRate(plan) {
  const q = plan.totalQuota;
  if (plan.rateBasis === 'pct_of_target_variable') {
    return plan.targetVariable / q; // earns targetVariable across full quota at 1.0x
  }
  return plan.components.reduce((s, c) => s + (c.quota * c.rate), 0) / q;
}

// THE PRIMITIVE.
// Commission on the slice of revenue between two TOTAL attainment points,
// accelerated band by band.
// Used by the aggregate curve and by computeEarnings.
//
// Each component is walked through the bands on its own, at its own rate.
// A component's dollars get the band multiplier ONLY if the plan marked that
// component accelerable. A component the plan holds flat (for example a renewal
// rate that does not count toward accelerators) earns its rate with multiplier 1
// in every band. This mirrors the deal-level path exactly, so the curve and the
// deal what-if always agree. Revenue is assumed to arrive in quota-mix
// proportion, so a component's share of any band is its quota weight.
function commissionBetween(plan, aLo, aHi) {
  if (plan.rateBasis === 'pct_of_target_variable') {
    let total = 0;
    walkBands(plan, aLo, aHi, (w, mult) => {
      total += w * plan.targetVariable * mult;
    });
    return total;
  }
  // pct_of_revenue: per component, mix-proportional fill, accelerable respected
  let total = 0;
  walkBands(plan, aLo, aHi, (w, mult) => {
    for (const c of plan.components) {
      // c's revenue inside this band = bandWidth * c.quota (mix-proportional)
      const compRevenueInBand = w * c.quota;
      total += compRevenueInBand * c.rate * (c.accelerable ? mult : 1);
    }
  });
  return total;
}

// Total earnings at a given total attainment (0 .. n).
export function computeEarnings(planRaw, attainment) {
  const plan = normalizePlan(planRaw);
  const q = plan.totalQuota;
  const revenue = attainment * q;

  let commission = 0;
  const belowFloor = plan.floor && attainment < plan.floor.attainment - EPS;
  if (!belowFloor) {
    // cap on attainment: revenue above the cap earns nothing
    let aHi = attainment;
    if (plan.cap && plan.cap.attainment != null) {
      aHi = Math.min(aHi, plan.cap.attainment);
    }
    commission = commissionBetween(plan, 0, aHi);
    // cap on payout dollars
    if (plan.cap && plan.cap.payout != null) {
      commission = Math.min(commission, plan.cap.payout);
    }
  }

  return {
    attainment,
    revenue,
    baseSalary: plan.baseSalary,
    commission,
    totalEarnings: plan.baseSalary + commission,
    belowFloor: !!belowFloor,
  };
}

// Commission earned by a SINGLE deal's own dollars, given the rep's prior
// booked revenue. The deal's dollars all earn their component rate, but the
// band multiplier depends on where those dollars land in total attainment.
// This is the engine behind position aware what if: the same deal pays
// differently depending on where the rep already sits.
export function dealSlice(planRaw, priorRevenue, amount, componentName) {
  const plan = normalizePlan(planRaw);
  const q = plan.totalQuota;
  const comp = plan.components.find((c) => c.name === componentName);
  const rate = comp ? comp.rate : blendedRate(plan);
  const accelerable = comp ? comp.accelerable : true;

  const aLo = priorRevenue / q;
  let aHi = (priorRevenue + amount) / q;
  if (plan.cap && plan.cap.attainment != null) {
    aHi = Math.min(aHi, plan.cap.attainment);
  }

  let total = 0;
  walkBands(plan, aLo, aHi, (w, mult) => {
    const dealRevenueInBand = w * q;
    total += dealRevenueInBand * rate * (accelerable ? mult : 1);
  });
  return total;
}

// Total commission for an ordered list of itemized deals.
// deals: [{ component, amount }, ...] in fill order (chronological by close date).
// Uses real component rates, not the blend. Applies floor gate and payout cap
// to the final total.
export function commissionForDeals(planRaw, deals) {
  const plan = normalizePlan(planRaw);
  const q = plan.totalQuota;
  let cumRev = 0;
  let total = 0;
  for (const d of deals) {
    total += dealSlice(plan, cumRev, d.amount, d.component);
    cumRev += d.amount;
  }
  const attainment = cumRev / q;
  if (plan.floor && attainment < plan.floor.attainment - EPS) return 0;
  if (plan.cap && plan.cap.payout != null) total = Math.min(total, plan.cap.payout);
  return total;
}

// The truest what if: what this deal actually does to the rep's check, given
// everything already booked. Subtraction of the engine from itself, so it
// captures band crossings AND floor unlock (a deal that crosses the floor
// turns on commission for everything below it).
export function marginalDealEffect(planRaw, priorDeals, newDeal) {
  const before = commissionForDeals(planRaw, priorDeals);
  const after = commissionForDeals(planRaw, [...priorDeals, newDeal]);
  return {
    dealOwnDollars: dealSlice(
      planRaw,
      priorDeals.reduce((s, d) => s + d.amount, 0),
      newDeal.amount,
      newDeal.component
    ),
    totalCheckImpact: after - before, // includes floor unlock and cap effects
    commissionBefore: before,
    commissionAfter: after,
  };
}

// Pay statement reconciliation. Compute what the rep should have been paid from
// their own closed deals, compare to what the comp team actually paid.
// This is the trust-but-verify feature: numbers match, rep relaxes; they don't,
// we hand the rep a clarifying email.
export function reconcileStatement(planRaw, closedDeals, statementCommission, tolerance = 1) {
  const expected = commissionForDeals(planRaw, closedDeals);
  const delta = statementCommission - expected;
  return {
    expected,
    statement: statementCommission,
    delta, // positive: comp team paid more than expected; negative: underpaid
    match: Math.abs(delta) <= tolerance,
    underpaid: delta < -tolerance,
    overpaid: delta > tolerance,
  };
}

// Internal consistency check: commission at exactly 100% attainment must equal
// target variable (OTE minus base). If it does not, the parsed rates or quota
// are off. Surface this, never silently produce wrong money.
export function reconcilePlan(planRaw, tolerance = 1) {
  const plan = normalizePlan(planRaw);
  const at100 = computeEarnings(plan, 1.0).commission;
  const expected = plan.targetVariable;
  const delta = at100 - expected;
  return {
    commissionAt100: at100,
    targetVariable: expected,
    delta,
    consistent: Math.abs(delta) <= tolerance,
  };
}

// Payout curve data for the chart: Base Salary (flat), Commission Only,
// Total Earnings, plus milestone markers at 100%, each tier, and the cap.
export function buildPayoutCurve(planRaw, { maxAttainment = 2.0, steps = 100 } = {}) {
  const plan = normalizePlan(planRaw);
  const points = [];
  for (let i = 0; i <= steps; i++) {
    const a = (maxAttainment * i) / steps;
    const e = computeEarnings(plan, a);
    points.push({
      attainment: a,
      attainmentPct: Math.round(a * 1000) / 10,
      revenue: e.revenue,
      baseSalary: e.baseSalary,
      commission: Math.round(e.commission),
      totalEarnings: Math.round(e.totalEarnings),
    });
  }
  const milestones = [];
  const mark = (a, label) => {
    if (a == null || a > maxAttainment + EPS) return;
    const e = computeEarnings(plan, a);
    milestones.push({ attainment: a, label, totalEarnings: Math.round(e.totalEarnings) });
  };
  mark(1.0, '100% (OTE)');
  for (const t of plan.tiers) {
    if (t.fromAttainment > EPS) mark(t.fromAttainment, `${Math.round(t.fromAttainment * 100)}% accelerator`);
  }
  if (plan.floor) mark(plan.floor.attainment, `${Math.round(plan.floor.attainment * 100)}% floor`);
  if (plan.cap && plan.cap.attainment != null) mark(plan.cap.attainment, `${Math.round(plan.cap.attainment * 100)}% cap`);

  return { points, milestones };
}

// Headline numbers for the summary screen.
export function summaryMetrics(planRaw) {
  const plan = normalizePlan(planRaw);
  const topTier = plan.tiers[plan.tiers.length - 1];
  const capA = plan.cap && plan.cap.attainment != null ? plan.cap.attainment : null;
  return {
    baseSalary: plan.baseSalary,
    ote: plan.ote,
    targetVariable: plan.targetVariable,
    commissionAt100: computeEarnings(plan, 1.0).commission,
    totalAt100: computeEarnings(plan, 1.0).totalEarnings,
    topAcceleratorFrom: topTier.fromAttainment,
    topAcceleratorMultiplier: topTier.multiplier,
    earningsAtCap: capA != null ? computeEarnings(plan, capA).totalEarnings : null,
    blendedBaseRate: plan.rateBasis === 'pct_of_revenue' ? blendedRate(plan) : null,
  };
}
