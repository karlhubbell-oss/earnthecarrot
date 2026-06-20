// THROWAWAY: fetch a real saved plan from the live get-plan, adapt it, run the engine.
// Usage: node test-earnings.mjs [repId]
import { toEarningsPlan } from "./src/lib/planAdapter.js";
import { computeEarnings, buildPayoutCurve, reconcilePlan, summaryMetrics } from "./src/lib/earnings.js";

const repId = process.argv[2] || "demo-rep";
const res = await fetch(`https://www.earnthecarrot.com/api/get-plan?repId=${encodeURIComponent(repId)}`);
const data = await res.json();
if (!data || !data.ok || !data.plan) { console.log("No saved plan for", repId, JSON.stringify(data)); process.exit(0); }

const plan = data.plan;
console.log("Source plan:", plan.meta.plan_name, "| rep:", plan.meta.rep_name);

const ep = toEarningsPlan(plan);
console.log("\nAdapted earnings plan:");
console.log(JSON.stringify(ep, null, 2));

console.log("\ncomputeEarnings at sample attainments:");
for (const a of [0, 0.3, 0.4, 0.5, 1.0, 1.5, 2.0]) {
  const e = computeEarnings(ep, a);
  console.log(`  ${Math.round(a * 100)}%  revenue ${Math.round(e.revenue).toLocaleString()}  commission ${Math.round(e.commission).toLocaleString()}  total ${Math.round(e.totalEarnings).toLocaleString()}${e.belowFloor ? "  (below floor)" : ""}`);
}

console.log("\nreconcilePlan (commission at 100% vs target variable):");
console.log("  " + JSON.stringify(reconcilePlan(ep)));

console.log("\nsummaryMetrics:");
console.log("  " + JSON.stringify(summaryMetrics(ep)));

const curve = buildPayoutCurve(ep, { maxAttainment: 2.0, steps: 8 });
console.log("\nbuildPayoutCurve (8 steps):");
for (const p of curve.points) console.log(`  ${p.attainmentPct}%  total ${p.totalEarnings.toLocaleString()}  (commission ${p.commission.toLocaleString()})`);
console.log("milestones: " + JSON.stringify(curve.milestones));
