import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// List the caller's accounts with their imported field facts, for the minimal
// "did the data land" view. Rep-scoped: derived from the verified token, so a caller
// only ever sees their own accounts. Read-only; no scoring, no sorting logic here.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    const accountRows = await sql`
      SELECT id, name, customer_status, source_document_id, created_at
      FROM accounts WHERE rep_id = ${repId}
      ORDER BY created_at ASC, id ASC`;
    const fieldRows = await sql`
      SELECT account_id, field_name, value_text, value_numeric, received_at
      FROM account_fields WHERE rep_id = ${repId}
      ORDER BY received_at ASC, id ASC`;

    // Group fields under their account; keep the latest received value per field name
    // (append-only means a field can appear more than once; the newest fact wins for
    // display, older facts stay in the table as history).
    const byAccount = new Map();
    for (const a of accountRows) byAccount.set(a.id, { ...a, fields: {} });
    const columnOrder = [];
    for (const f of fieldRows) {
      const bucket = byAccount.get(f.account_id);
      if (!bucket) continue;
      if (!columnOrder.includes(f.field_name)) columnOrder.push(f.field_name);
      bucket.fields[f.field_name] = { value_text: f.value_text, value_numeric: f.value_numeric };
    }

    const accounts = accountRows.map((a) => byAccount.get(a.id));
    return res.status(200).json({ ok: true, accounts, columns: columnOrder });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
