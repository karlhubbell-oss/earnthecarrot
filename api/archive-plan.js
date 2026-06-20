import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Soft-delete (archive) a plan. The append-only compensation_facts ledger is NEVER
// touched: we only set compensation_plans.archived_at and is_current = false, and
// tombstone the source document, so get-plan stops surfacing it. The caller must
// own the plan (rep derived from the verified token), so one rep cannot archive
// another rep's plan.
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

    const { planId } = req.body || {};
    if (!planId) return res.status(400).json({ ok: false, error: "Missing planId." });

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    const rows = await sql`
      UPDATE compensation_plans
      SET archived_at = now(), is_current = false
      WHERE id = ${planId} AND rep_id = ${repId} AND archived_at IS NULL
      RETURNING id, source_document_id`;
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "No matching active plan for this rep." });
    }
    // Tombstone the source document too (facts are left intact as history).
    if (rows[0].source_document_id) {
      await sql`UPDATE uploaded_documents SET deleted_at = now() WHERE id = ${rows[0].source_document_id} AND rep_id = ${repId}`;
    }
    return res.status(200).json({ ok: true, archivedPlanId: rows[0].id });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
