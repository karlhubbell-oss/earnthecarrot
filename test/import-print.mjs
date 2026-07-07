// Increment-1 proof: generate a messy sample CSV, run it through the SHIPPED parser
// (lib/accountImport.js), then do a real DB round-trip on the clean test2 account
// (create tables, insert accounts + append-only fields, read back, print, clean up).
// Also smoke-tests the xlsx path with a hand-built zip and the name-column detection.
// Run: node --env-file=.env.local test/import-print.mjs

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import zlib from "node:zlib";
import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { parseAccountFile, buildImport, parseDelimited, parseXlsxBuffer } from "../lib/accountImport.js";

// ── build a realistic, messy 40-row account CSV ─────────────────────────────
const csvCell = (v) => {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csvRow = (arr) => arr.map(csvCell).join(",");

const cities = [["Austin", "TX"], ["Denver", "CO"], ["Boston", "MA"], ["Chicago", "IL"], ["Seattle", "WA"], ["Atlanta", "GA"], ["Miami", "FL"], ["Reno", "NV"]];
const industries = ["Manufacturing", "Healthcare", "Logistics", "Retail", "SaaS", "Energy", "Construction", "Finance"];
const erps = ["SAP", "Oracle", "NetSuite", "Dynamics 365", "Infor", "", "Sage", "Epicor"];
const names = ["Acme Industrial", "Globex Corp", "Initech", "Umbra Health", "Northwind Traders", "Stark Manufacturing", "Wayne Logistics", "Soylent Foods", "Hooli", "Pied Piper", "Vandelay Imports", "Cyberdyne Systems", "Wonka Industries", "Tyrell Corp", "Massive Dynamic", "Gekko & Co", "Bluth Company", "Prestige Worldwide", "Duff Beverages", "Oscorp", "Aperture Labs", "Black Mesa", "Nakatomi Trading", "Weyland Corp", "Monarch Sciences", "Sirius Cybernetics", "Zorg Industries", "Los Pollos Holdings", "Sterling Cooper", "Dunder Mifflin", "Prospect A", "Prospect B", "Prospect C", "Prospect D"];

const header = ["Account Name", "HQ City", "HQ State", "Annual Revenue", "Employees", "Industry", "ERP System", "", "Notes"];
const lines = [csvRow(header)];

for (let i = 0; i < names.length; i++) {
  const [city, st] = cities[i % cities.length];
  // messy revenue: some with $ and commas, some plain, some N/A, some blank
  const revPool = [`$${(1 + (i % 9)) },200,000`, `$${(3 + i % 5)},450,000`, `${(500 + i * 13)},000`, "N/A", "", `$${(2 + i % 4)}75,000`];
  const rev = revPool[i % revPool.length];
  const empPool = [`${(50 + i * 37)}`, `${(1 + i % 9)},200`, "", "12,000", `${(200 + i * 5)}`];
  const emp = empPool[i % empPool.length];
  const erp = erps[i % erps.length];
  const note = i % 4 === 0 ? "" : i % 4 === 1 ? "warm intro via CFO" : i % 4 === 2 ? "renewal Q3" : "cold";
  lines.push(csvRow([names[i], city, st, rev, emp, industries[i % industries.length], erp, "", note]));
  // sprinkle blank rows and one commas-in-name quoted row and one no-name row
  if (i === 7) lines.push(csvRow(["", "", "", "", "", "", "", "", ""])); // blank row
  if (i === 12) lines.push(csvRow(["Smith, Jones & Co", "Portland", "OR", "$4,000,000", "800", "Legal", "Oracle", "", 'says "call me Q4"'])); // quoted comma + quote
  if (i === 20) lines.push(csvRow(["", "Fresno", "CA", "$900,000", "150", "Agriculture", "SAP", "", "no name in export"])); // no account name
  if (i === 28) lines.push(""); // a truly empty line
}

mkdirSync(new URL("./", import.meta.url), { recursive: true });
const csvPath = new URL("./sample-accounts.csv", import.meta.url);
writeFileSync(csvPath, lines.join("\n") + "\n");
const csvText = readFileSync(csvPath, "utf8");

console.log("=== SAMPLE FILE ===");
console.log("wrote test/sample-accounts.csv:", lines.length, "lines total (1 header +", lines.length - 1, "body lines incl. blanks)\n");

// ── run the SHIPPED parser ──────────────────────────────────────────────────
const parsed = parseAccountFile(Buffer.from(csvText, "utf8"), "sample-accounts.csv");
console.log("=== PARSE RESULT (real lib/accountImport.js) ===");
console.log("accounts created:   ", parsed.accounts.length);
console.log("name column:        ", parsed.nameColumn, parsed.nameColumnGuessed ? "(guessed)" : "(matched header)");
console.log("columns detected:   ", parsed.columns.join(" | "));
console.log("rows skipped:       ", parsed.skipped.map((s) => `row ${s.row}: ${s.reason}`).join("; ") || "none");
console.log("rows flagged:       ", parsed.warnings.map((w) => `row ${w.row}: ${w.reason}`).join("; ") || "none");

console.log("\n--- three parsed accounts with their field facts (note numeric vs text split) ---");
for (const a of [parsed.accounts[0], parsed.accounts.find((x) => x.name === "Smith, Jones & Co"), parsed.accounts.find((x) => x.name === null)]) {
  console.log(`\n  account: ${a.name === null ? "(unnamed)" : a.name}`);
  for (const f of a.fields) {
    const v = f.value_numeric != null ? `numeric ${f.value_numeric.toLocaleString()}` : `text "${f.value_text}"`;
    console.log(`     ${f.field_name.padEnd(16)} -> ${v}`);
  }
}

// ── name-column detection variants ──────────────────────────────────────────
console.log("\n=== NAME-COLUMN DETECTION VARIANTS ===");
const alt = buildImport(parseDelimited("Company,City,Revenue\nAcme,Austin,$1,000,000\nGlobex,Denver,$2,000,000\n"));
console.log(`header "Company":        picked "${alt.nameColumn}" ${alt.nameColumnGuessed ? "(guessed)" : "(matched)"}`);
const noname = buildImport(parseDelimited("Code,Region,Spend\nX1,West,$500,000\nAcme Foods West,East,$700,000\n"));
console.log(`no name-ish header:      picked "${noname.nameColumn}" ${noname.nameColumnGuessed ? "(guessed, flagged)" : "(matched)"}`);

// ── xlsx path smoke test (hand-built zip, no external lib) ───────────────────
function storedZip(entries) {
  const chunks = [], central = [];
  let offset = 0;
  const crcTable = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  for (const [name, dataStr] of entries) {
    const nameBuf = Buffer.from(name, "utf8");
    const data = Buffer.from(dataStr, "utf8");
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(0, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(data.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    chunks.push(lh, nameBuf, data);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(data.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    central.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + data.length;
  }
  const centralBuf = Buffer.concat(central);
  const body = Buffer.concat(chunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(entries.length, 8); eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12); eocd.writeUInt32LE(body.length, 16);
  return Buffer.concat([body, centralBuf, eocd]);
}
const sst = `<?xml version="1.0"?><sst count="4" uniqueCount="4"><si><t>Company</t></si><si><t>Annual Revenue</t></si><si><t>Acme Excel Co</t></si><si><t>Globex Excel</t></si></sst>`;
const sheet = `<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>1500000</v></c></row><row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3"><v>2750000</v></c></row></sheetData></worksheet>`;
const xlsxBuf = storedZip([["xl/sharedStrings.xml", sst], ["xl/worksheets/sheet1.xml", sheet]]);
const xlsxRows = parseXlsxBuffer(xlsxBuf);
const xlsxParsed = buildImport(xlsxRows);
console.log("\n=== XLSX PATH SMOKE TEST (built + read with Node zlib, no library) ===");
console.log("raw rows read:", JSON.stringify(xlsxRows));
console.log("accounts:", xlsxParsed.accounts.map((a) => `${a.name} [rev ${a.fields.find((f) => f.field_name === "Annual Revenue")?.value_numeric?.toLocaleString()}]`).join(", "));

// ── real DB round-trip on the clean test2 account ────────────────────────────
const sql = neon(process.env.DATABASE_URL);
console.log("\n=== DB ROUND-TRIP (test2, real Neon) ===");
// 1. create tables (same DDL as db-setup, idempotent)
await sql`CREATE TABLE IF NOT EXISTS accounts (id text PRIMARY KEY, rep_id text REFERENCES reps(id), name text, customer_status text DEFAULT 'prospect', parent_account_id text REFERENCES accounts(id), source_document_id text, created_at timestamptz DEFAULT now())`;
await sql`CREATE TABLE IF NOT EXISTS account_fields (id text PRIMARY KEY, account_id text REFERENCES accounts(id), rep_id text REFERENCES reps(id), field_name text, value_text text, value_numeric numeric, source text, received_at timestamptz, created_at timestamptz DEFAULT now())`;
await sql`CREATE INDEX IF NOT EXISTS accounts_rep_idx ON accounts (rep_id, created_at)`;
await sql`CREATE INDEX IF NOT EXISTS account_fields_account_idx ON account_fields (account_id)`;
await sql`CREATE INDEX IF NOT EXISTS account_fields_rep_idx ON account_fields (rep_id)`;
console.log("tables ensured: accounts, account_fields (+indexes)");

const [rep] = await sql`SELECT id FROM reps WHERE email ILIKE ${"%karlhubbell.test2%"}`;
const repId = rep.id;
const sourceDocId = randomUUID();
const receivedAt = new Date().toISOString();

// 2. insert exactly as the endpoint does
let created = 0;
for (const acct of parsed.accounts) {
  const accountId = randomUUID();
  await sql`INSERT INTO accounts (id, rep_id, name, customer_status, parent_account_id, source_document_id) VALUES (${accountId}, ${repId}, ${acct.name}, 'prospect', NULL, ${sourceDocId})`;
  created++;
  for (const f of acct.fields) {
    await sql`INSERT INTO account_fields (id, account_id, rep_id, field_name, value_text, value_numeric, source, received_at) VALUES (${randomUUID()}, ${accountId}, ${repId}, ${f.field_name}, ${f.value_text}, ${f.value_numeric}, 'import', ${receivedAt})`;
  }
}
console.log(`inserted ${created} accounts for test2`);

// 3. read back exactly as list-accounts does
const accountRows = await sql`SELECT id, name, customer_status, source_document_id, created_at FROM accounts WHERE rep_id = ${repId} ORDER BY created_at ASC, id ASC`;
const fieldRows = await sql`SELECT account_id, field_name, value_text, value_numeric FROM account_fields WHERE rep_id = ${repId} ORDER BY received_at ASC, id ASC`;
const fieldsByAcct = new Map();
for (const f of fieldRows) { if (!fieldsByAcct.has(f.account_id)) fieldsByAcct.set(f.account_id, []); fieldsByAcct.get(f.account_id).push(f); }
console.log(`read back ${accountRows.length} accounts, ${fieldRows.length} field facts\n`);
console.log("--- three stored accounts with their field data from the DB ---");
for (const a of accountRows.slice(0, 3)) {
  console.log(`\n  ${a.name} [status ${a.customer_status}] [source ${a.source_document_id.slice(0, 8)}...]`);
  for (const f of fieldsByAcct.get(a.id) || []) {
    console.log(`     ${f.field_name.padEnd(16)} text=${f.value_text === null ? "NULL" : `"${f.value_text}"`} numeric=${f.value_numeric === null ? "NULL" : f.value_numeric}`);
  }
}

// 4. clean up so the account stays clean (increment 1 is a proof, not seeding)
await sql`DELETE FROM account_fields WHERE rep_id = ${repId} AND account_id IN (SELECT id FROM accounts WHERE rep_id = ${repId} AND source_document_id = ${sourceDocId})`;
await sql`DELETE FROM accounts WHERE rep_id = ${repId} AND source_document_id = ${sourceDocId}`;
const [{ n }] = await sql`SELECT COUNT(*)::int AS n FROM accounts WHERE rep_id = ${repId}`;
console.log(`\n=== cleaned up: test2 now has ${n} accounts (clean) ===`);
