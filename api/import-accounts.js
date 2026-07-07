export const config = { maxDuration: 60 };

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";
import { parseAccountFile } from "../lib/accountImport.js";

// Account import (Account Prioritization, increment 1). Authenticated like /api/ingest:
// the rep is derived from the verified token, never from the client, so a caller can
// only write their own accounts. Accepts a CSV or Excel file as base64 in the JSON
// body (same shape as ingest's pdfBase64), parses it tolerantly, and stores one
// account row per data row plus its columns as append-only account_fields. It imports
// what it can and reports what it skipped; it does not hard-fail on a messy file.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });

    const { fileBase64, filename } = req.body || {};
    if (!fileBase64) {
      return res.status(400).json({ ok: false, error: "Missing fileBase64 in request body." });
    }

    let buffer;
    try {
      buffer = Buffer.from(String(fileBase64), "base64");
    } catch {
      return res.status(400).json({ ok: false, error: "fileBase64 is not valid base64." });
    }
    if (!buffer || !buffer.length) {
      return res.status(400).json({ ok: false, error: "The uploaded file was empty." });
    }

    let parsed;
    try {
      parsed = parseAccountFile(buffer, filename);
    } catch (e) {
      return res.status(422).json({ ok: false, error: `Could not read that file. ${e && e.message ? e.message : e}` });
    }

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);
    const sourceDocId = randomUUID();
    const receivedAt = new Date().toISOString();

    // Insert accounts first (root record), then their append-only field facts.
    let created = 0;
    for (const acct of parsed.accounts) {
      const accountId = randomUUID();
      await sql`
        INSERT INTO accounts (id, rep_id, name, customer_status, parent_account_id, source_document_id)
        VALUES (${accountId}, ${repId}, ${acct.name}, 'prospect', NULL, ${sourceDocId})`;
      created++;
      for (const f of acct.fields) {
        await sql`
          INSERT INTO account_fields (id, account_id, rep_id, field_name, value_text, value_numeric, source, received_at)
          VALUES (${randomUUID()}, ${accountId}, ${repId}, ${f.field_name}, ${f.value_text}, ${f.value_numeric}, 'import', ${receivedAt})`;
      }
    }

    return res.status(200).json({
      ok: true,
      sourceDocId,
      accountsCreated: created,
      columnsDetected: parsed.columns,
      nameColumn: parsed.nameColumn,
      nameColumnGuessed: parsed.nameColumnGuessed,
      rowsSkipped: parsed.skipped,
      warnings: parsed.warnings,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
