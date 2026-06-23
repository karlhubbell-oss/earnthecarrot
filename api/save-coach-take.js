import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Persist Coach's Take onto the rep's plan row so it is served from cache on reopen.
// The take is keyed to the plan id; a materially changed plan is a new plan row with
// a null take, which is what triggers regeneration. Rep-scoped: a rep can only write
// the take for one of their own plans.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const { planId, take } = req.body || {};
    if (!planId || take == null) {
      return res.status(400).json({ ok: false, error: "Missing planId or take." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });
    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    const rows = await sql`
      UPDATE compensation_plans
      SET coach_take = ${JSON.stringify(take)}::jsonb
      WHERE id = ${planId} AND rep_id = ${repId}
      RETURNING id`;
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: "Plan not found for this rep." });
    }
    return res.status(200).json({ ok: true, planId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
