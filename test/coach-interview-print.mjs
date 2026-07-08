// Increment-2 proof, run against the REAL accounts already in KarlTest4. Reads the
// existing accounts from the DB (does not load any sample, does not insert or delete
// anything), runs the SHIPPED Coach interview logic for all four steps, prints the
// proposals, then persists the portable structure and reads it back. The imported
// accounts are LEFT IN PLACE. account_strategy is captured first and restored to its
// prior value at the end, so a fresh UI interview is not pre-seeded by this run.
// Uses the real Anthropic API (claude-sonnet-4-6).
// Run: ANTHROPIC_API_KEY="sk-ant-..." node --env-file=/tmp/etc-prod.env test/coach-interview-print.mjs

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { shapeAccounts, summarizeAccounts, summarizeDealSizes } from "../lib/accountSummary.js";
import { callCoach } from "../lib/coachInterview.js";

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set. Pass it inline: ANTHROPIC_API_KEY=... node --env-file=/tmp/etc-prod.env test/coach-interview-print.mjs"); process.exit(1); }
const KEY = process.env.ANTHROPIC_API_KEY;
const sql = neon(process.env.DATABASE_URL);
const rule = (t) => console.log("\n" + "=".repeat(4) + " " + t + " " + "=".repeat(Math.max(0, 60 - t.length)));

const [rep] = await sql`SELECT id FROM reps WHERE email ILIKE ${"%karltest4%"}`;
if (!rep) { console.error("No KarlTest4 rep found."); process.exit(1); }
const repId = rep.id;

// Read the REAL accounts already in KarlTest4. No inserts, no sample.
const accountRows = await sql`SELECT id, name, customer_status FROM accounts WHERE rep_id=${repId} ORDER BY created_at ASC, id ASC`;
if (!accountRows.length) { console.error("KarlTest4 has no accounts. Upload your file first."); process.exit(1); }
const fieldRows = await sql`SELECT account_id, field_name, value_text, value_numeric FROM account_fields WHERE rep_id=${repId} ORDER BY received_at ASC, id ASC`;
const summary = summarizeAccounts(shapeAccounts(accountRows, fieldRows));

console.log(`Reading YOUR real KarlTest4 accounts: ${summary.counts.total} total, ${summary.counts.customers} customers, ${summary.counts.prospects} prospects`);
console.log(`Columns Coach sees: ${summary.columns.join(", ")}`);

// capture prior strategy so we can restore it (accounts are never touched)
const [priorRow] = await sql`SELECT account_strategy FROM reps WHERE id=${repId}`;
const priorStrategy = priorRow ? priorRow.account_strategy : null;

const state = { icp_text: "", metrics: [], close_rate: null };
try {
  rule("STEP 1  COACH PROPOSES AN ICP (reading your real customers)");
  const icp = await callCoach("icp", { summary, state }, KEY);
  console.log("observation:", icp.observation);
  console.log("draft ICP:  ", icp.draft_icp);
  console.log("reasoning:  ", icp.reasoning);
  console.log("question:   ", icp.question);
  state.icp_text = icp.draft_icp;

  rule("STEP 2  COACH PROPOSES A METRIC SET WITH REASONING");
  const met = await callCoach("metrics", { summary, state }, KEY);
  console.log("note:", met.note);
  console.log("proposed metrics (" + (met.metrics || []).length + "):");
  for (const m of met.metrics || []) console.log(`  - ${m.name}  [${m.source}${m.column ? " -> " + m.column : ""}]\n      ${m.reasoning}`);
  console.log("left out:");
  for (const s of met.skipped || []) console.log(`  - ${s.column}: ${s.reason}`);
  const chosen = (met.metrics || []).map((m) => ({ id: "m_" + randomUUID().slice(0, 8), name: m.name, source: m.source, column: m.column, coach_reasoning: m.reasoning }));
  state.metrics = chosen.map((m) => ({ name: m.name, source: m.source }));

  rule("STEP 3  COACH PROPOSES WEIGHTS WITH REASONING");
  const wt = await callCoach("weights", { summary, state }, KEY);
  console.log("note:", wt.note);
  const byName = new Map((wt.weights || []).map((w) => [w.name, w]));
  for (const m of chosen) {
    const w = byName.get(m.name);
    m.weight = w ? w.weight : "medium";
    console.log(`  - ${m.name}: ${m.weight.toUpperCase()}\n      ${w ? w.reasoning : "(defaulted, Coach did not weight this one)"}`);
  }

  rule("STEP 4  COACH ANCHORS A CLOSE RATE");
  const [r2] = await sql`SELECT deal_plan FROM reps WHERE id=${repId}`;
  const dealSizes = summarizeDealSizes(r2 && r2.deal_plan);
  const cr = await callCoach("close_rate", { summary, state, dealSizes }, KEY);
  console.log("deal sizes available:", dealSizes ? `yes (${dealSizes.deal_count} deals)` : "no, anchoring overall");
  console.log("anchor:   ", cr.anchor);
  console.log("proposed: ", JSON.stringify(cr.proposed));
  console.log("reasoning:", cr.reasoning);
  console.log("question: ", cr.question);

  rule("PERSIST + READ BACK (portable metric objects)");
  const WEIGHT_VALUE = { high: 3, medium: 2, low: 1 };
  const account_strategy = {
    version: 1,
    icp_text: state.icp_text,
    close_rate: cr.proposed,
    metrics: chosen.map((m) => ({ id: m.id, name: m.name, source: m.source, column: m.column, weight: m.weight, weight_value: WEIGHT_VALUE[m.weight] || 2, coach_reasoning: m.coach_reasoning })),
  };
  await sql`UPDATE reps SET account_strategy = ${JSON.stringify(account_strategy)}::jsonb WHERE id=${repId}`;
  const [saved] = await sql`SELECT account_strategy FROM reps WHERE id=${repId}`;
  console.log(JSON.stringify(saved.account_strategy, null, 2));
} finally {
  // restore account_strategy to its prior value; accounts are never touched
  await sql`UPDATE reps SET account_strategy = ${priorStrategy ? JSON.stringify(priorStrategy) : null}::jsonb WHERE id=${repId}`;
  const [{ n }] = await sql`SELECT COUNT(*)::int n FROM accounts WHERE rep_id=${repId}`;
  rule("LEFT IN PLACE");
  console.log(`Your ${n} KarlTest4 accounts are untouched. account_strategy restored to its prior state (a fresh UI interview will re-propose).`);
}
