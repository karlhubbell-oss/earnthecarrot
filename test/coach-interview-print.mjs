// Increment-2 proof: Coach genuinely reads KarlTest4's real accounts and PROPOSES at
// every step (ICP, metrics, weights, close rate), then we persist the portable metric
// structure and read it back. Loads the 102-account messy sample into KarlTest4 (it was
// cleared for a re-upload), runs the SHIPPED interview logic, prints, then cleans up so
// KarlTest4 is empty again. Uses the real Anthropic API (claude-sonnet-4-6).
// Run: node --env-file=.env.local test/coach-interview-print.mjs

import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { parseAccountFile } from "../lib/accountImport.js";
import { shapeAccounts, summarizeAccounts, summarizeDealSizes } from "../lib/accountSummary.js";
import { callCoach } from "../lib/coachInterview.js";

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY not set in .env.local"); process.exit(1); }
const KEY = process.env.ANTHROPIC_API_KEY;
const sql = neon(process.env.DATABASE_URL);
const rule = (t) => console.log("\n" + "=".repeat(4) + " " + t + " " + "=".repeat(Math.max(0, 60 - t.length)));

// ── ensure column + load the sample into KarlTest4 ──────────────────────────
await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS account_strategy jsonb`;
const [rep] = await sql`SELECT id FROM reps WHERE email ILIKE ${"%karltest4%"}`;
const repId = rep.id;
const src = randomUUID();
const parsed = parseAccountFile(readFileSync("test/sample-accounts.csv"), "sample-accounts.csv");
for (const a of parsed.accounts) {
  const id = randomUUID();
  await sql`INSERT INTO accounts (id,rep_id,name,customer_status,parent_account_id,source_document_id) VALUES (${id},${repId},${a.name},${a.customer_status},NULL,${src})`;
  for (const f of a.fields) await sql`INSERT INTO account_fields (id,account_id,rep_id,field_name,value_text,value_numeric,source,received_at) VALUES (${randomUUID()},${id},${repId},${f.field_name},${f.value_text},${f.value_numeric},${"import"},${new Date().toISOString()})`;
}
console.log(`Loaded ${parsed.accounts.length} accounts into KarlTest4 (${parsed.accounts.filter(a=>a.customer_status==="customer").length} customers)`);

// ── build the same summary the endpoint builds ──────────────────────────────
const accountRows = await sql`SELECT id, name, customer_status FROM accounts WHERE rep_id=${repId} ORDER BY created_at ASC, id ASC`;
const fieldRows = await sql`SELECT account_id, field_name, value_text, value_numeric FROM account_fields WHERE rep_id=${repId} ORDER BY received_at ASC, id ASC`;
const summary = summarizeAccounts(shapeAccounts(accountRows, fieldRows));
console.log(`Summary handed to Coach: ${summary.counts.total} accounts, ${summary.counts.customers} customers, columns: ${summary.columns.join(", ")}`);

const state = { icp_text: "", metrics: [], close_rate: null };

// ── STEP 1: ICP ──
rule("STEP 1  COACH PROPOSES AN ICP (reading the real customers)");
const icp = await callCoach("icp", { summary, state }, KEY);
console.log("observation:", icp.observation);
console.log("draft ICP:  ", icp.draft_icp);
console.log("reasoning:  ", icp.reasoning);
console.log("question:   ", icp.question);
state.icp_text = icp.draft_icp; // rep accepts the draft for this print

// ── STEP 2: METRICS ──
rule("STEP 2  COACH PROPOSES A METRIC SET WITH REASONING");
const met = await callCoach("metrics", { summary, state }, KEY);
console.log("note:", met.note);
console.log("proposed metrics (" + (met.metrics || []).length + "):");
for (const m of met.metrics || []) console.log(`  - ${m.name}  [${m.source}${m.column ? " -> " + m.column : ""}]\n      ${m.reasoning}`);
console.log("left out:");
for (const s of met.skipped || []) console.log(`  - ${s.column}: ${s.reason}`);
// rep keeps Coach's proposed set for this print
const chosen = (met.metrics || []).map((m) => ({ id: "m_" + randomUUID().slice(0, 8), name: m.name, source: m.source, column: m.column, coach_reasoning: m.reasoning }));
state.metrics = chosen.map((m) => ({ name: m.name, source: m.source }));

// ── STEP 3: WEIGHTS ──
rule("STEP 3  COACH PROPOSES WEIGHTS WITH REASONING");
const wt = await callCoach("weights", { summary, state }, KEY);
console.log("note:", wt.note);
const byName = new Map((wt.weights || []).map((w) => [w.name, w]));
for (const m of chosen) {
  const w = byName.get(m.name);
  m.weight = w ? w.weight : "medium";
  console.log(`  - ${m.name}: ${m.weight.toUpperCase()}\n      ${w ? w.reasoning : "(defaulted, Coach did not weight this one)"}`);
}

// ── STEP 4: CLOSE RATE ──
rule("STEP 4  COACH ANCHORS A CLOSE RATE");
const [r2] = await sql`SELECT deal_plan FROM reps WHERE id=${repId}`;
const dealSizes = summarizeDealSizes(r2 && r2.deal_plan);
const cr = await callCoach("close_rate", { summary, state, dealSizes }, KEY);
console.log("anchor:   ", cr.anchor);
console.log("proposed: ", JSON.stringify(cr.proposed));
console.log("reasoning:", cr.reasoning);
console.log("question: ", cr.question);

// ── PERSIST the portable structure and read it back ──────────────────────────
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

// ── clean up: KarlTest4 back to empty + no strategy, ready for a fresh upload ─
await sql`UPDATE reps SET account_strategy = NULL WHERE id=${repId}`;
await sql`DELETE FROM account_fields WHERE rep_id=${repId} AND account_id IN (SELECT id FROM accounts WHERE rep_id=${repId} AND source_document_id=${src})`;
await sql`DELETE FROM accounts WHERE rep_id=${repId} AND source_document_id=${src}`;
const [{ n }] = await sql`SELECT COUNT(*)::int n FROM accounts WHERE rep_id=${repId}`;
rule("CLEANUP");
console.log(`KarlTest4 now has ${n} accounts and account_strategy cleared (fresh for your re-upload)`);
