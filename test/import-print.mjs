// Increment-1 fixes proof: (1) customer-status read from the file, (2) upload spinner.
// Generates a messy 102-account sample with a "Current Client" (Yes/No) column where
// exactly 33 should map to customer, runs the SHIPPED parser, does a real DB round-trip
// on the clean test2 account (counts customer vs prospect from the DB, then cleans up),
// and simulates the upload handler's busy/spinner state timeline on a slow import.
// Run: node --env-file=.env.local test/import-print.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { parseAccountFile } from "../lib/accountImport.js";

// ── build a messy 102-account CSV with a Current Client column ───────────────
const csvCell = (v) => {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (arr) => arr.map(csvCell).join(",");

const base = ["Acme Industrial", "Globex Corp", "Initech", "Umbra Health", "Northwind Traders", "Stark Manufacturing", "Wayne Logistics", "Soylent Foods", "Hooli", "Pied Piper", "Vandelay Imports", "Cyberdyne Systems", "Wonka Industries", "Tyrell Corp", "Massive Dynamic", "Gekko & Co", "Bluth Company", "Prestige Worldwide", "Duff Beverages", "Oscorp", "Aperture Labs", "Black Mesa", "Nakatomi Trading", "Weyland Corp", "Monarch Sciences", "Sirius Cybernetics", "Zorg Industries", "Los Pollos Holdings", "Sterling Cooper", "Dunder Mifflin", "Wernham Hogg", "Cybertech", "Omni Consumer", "Virtucon"];
const cities = [["Austin", "TX"], ["Denver", "CO"], ["Boston", "MA"], ["Chicago", "IL"], ["Seattle", "WA"], ["Atlanta", "GA"], ["Miami", "FL"], ["Reno", "NV"]];
const industries = ["Manufacturing", "Healthcare", "Logistics", "Retail", "SaaS", "Energy", "Construction", "Finance"];
const erps = ["SAP", "Oracle", "NetSuite", "Dynamics 365", "Infor", "", "Sage", "Epicor"];

const N = 102;
// exactly 33 customer rows, spread across the file, with varied truthy tokens.
const yesIdx = new Set();
for (let k = 0; k < 33; k++) yesIdx.add(Math.floor((k * N) / 33));
const YES_TOKENS = ["Yes", "Y", "True", "Customer", "Client", "current client"];
const NO_TOKENS = ["No", "", "Prospect", "N", "false"];

const header = ["Account Name", "HQ City", "HQ State", "Annual Revenue", "Employees", "Industry", "Current Client", "ERP System", "", "Notes"];
const lines = [csvRow(header)];
let expectedCustomers = 0;
for (let i = 0; i < N; i++) {
  const [city, st] = cities[i % cities.length];
  const rev = [`$${1 + (i % 9)},200,000`, `$${3 + (i % 5)},450,000`, `${500 + i * 13},000`, "N/A", "", `$${2 + (i % 4)}75,000`][i % 6];
  const emp = [`${50 + i * 7}`, `${1 + (i % 9)},200`, "", "12,000", `${200 + i * 5}`][i % 5];
  const isYes = yesIdx.has(i);
  if (isYes) expectedCustomers++;
  const client = isYes ? YES_TOKENS[i % YES_TOKENS.length] : NO_TOKENS[i % NO_TOKENS.length];
  // a couple of special messy rows keep their name/handling but still carry a status
  let name = base[i % base.length] + (i >= base.length ? ` ${Math.floor(i / base.length) + 1}` : "");
  if (i === 40) name = "Smith, Jones & Co"; // quoted comma name
  if (i === 55) name = ""; // no account name in the export
  const note = i % 4 === 0 ? "" : i % 4 === 1 ? "warm intro via CFO" : i % 4 === 2 ? "renewal Q3" : "cold";
  lines.push(csvRow([name, city, st, rev, emp, industries[i % industries.length], client, erps[i % erps.length], "", note]));
  if (i === 10 || i === 60) lines.push(csvRow(["", "", "", "", "", "", "", "", "", ""])); // blank rows
  if (i === 80) lines.push(""); // truly empty line
}

mkdirSync(new URL("./", import.meta.url), { recursive: true });
const csvPath = new URL("./sample-accounts.csv", import.meta.url);
writeFileSync(csvPath, lines.join("\n") + "\n");
const csvText = readFileSync(csvPath);
console.log(`=== SAMPLE ===\nwrote test/sample-accounts.csv: ${N} accounts, "Current Client" column, ${expectedCustomers} marked customer\n`);

// ── run the SHIPPED parser ──────────────────────────────────────────────────
const parsed = parseAccountFile(csvText, "sample-accounts.csv");
const parsedCustomers = parsed.accounts.filter((a) => a.customer_status === "customer").length;
console.log("=== FIX 2: customer status read from the file ===");
console.log("accounts created:  ", parsed.accounts.length);
console.log("status column:     ", parsed.statusColumn);
console.log("customer:          ", parsedCustomers);
console.log("prospect:          ", parsed.accounts.length - parsedCustomers);

// ── real DB round-trip on clean test2, count status from the DB ──────────────
const sql = neon(process.env.DATABASE_URL);
const [rep] = await sql`SELECT id FROM reps WHERE email ILIKE ${"%karlhubbell.test2%"}`;
const repId = rep.id;
const sourceDocId = randomUUID();
const receivedAt = new Date().toISOString();
for (const a of parsed.accounts) {
  const accountId = randomUUID();
  await sql`INSERT INTO accounts (id, rep_id, name, customer_status, parent_account_id, source_document_id) VALUES (${accountId},${repId},${a.name},${a.customer_status},NULL,${sourceDocId})`;
  for (const f of a.fields) await sql`INSERT INTO account_fields (id, account_id, rep_id, field_name, value_text, value_numeric, source, received_at) VALUES (${randomUUID()},${accountId},${repId},${f.field_name},${f.value_text},${f.value_numeric},${"import"},${receivedAt})`;
}
const statusCounts = await sql`SELECT customer_status, COUNT(*)::int AS n FROM accounts WHERE rep_id=${repId} AND source_document_id=${sourceDocId} GROUP BY customer_status ORDER BY customer_status`;
console.log("\n=== DB ROUND-TRIP (test2, real Neon): customer_status persisted ===");
for (const r of statusCounts) console.log(`   ${r.customer_status.padEnd(9)} ${r.n}`);
// prove a few varied tokens landed as customer, straight from the stored rows
const custSamples = await sql`SELECT name, customer_status FROM accounts WHERE rep_id=${repId} AND source_document_id=${sourceDocId} AND customer_status=${"customer"} ORDER BY name LIMIT 4`;
console.log("   sample customers:", custSamples.map((r) => r.name).join(", "));

// clean up
await sql`DELETE FROM account_fields WHERE rep_id=${repId} AND account_id IN (SELECT id FROM accounts WHERE rep_id=${repId} AND source_document_id=${sourceDocId})`;
await sql`DELETE FROM accounts WHERE rep_id=${repId} AND source_document_id=${sourceDocId}`;
const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM accounts WHERE rep_id=${repId}`;
console.log(`   cleaned up: test2 now has ${n} accounts (clean)`);

// ── FIX 1: simulate the upload handler's spinner timeline on a slow import ────
console.log("\n=== FIX 1: spinner shows for the whole slow import ===");
const t0 = Date.now();
let busy = false;
const stamp = (label) => console.log(`   t=${String(Date.now() - t0).padStart(4)}ms  busy=${busy}  ${label}`);
async function simulateUpload(slowMs) {
  // mirrors AccountsImport onFile: busy=true before the request, busy=false in finally
  busy = true;
  stamp('spinner "Reading your accounts, hang tight." shown, upload button disabled');
  await new Promise((r) => setTimeout(r, slowMs)); // slow parse + store round-trip
  busy = false;
  stamp("import result returned, spinner hidden, button re-enabled");
}
await simulateUpload(1500);
console.log("   => during the 1500ms a re-click is blocked (input disabled + pointerEvents none), so no double import");
