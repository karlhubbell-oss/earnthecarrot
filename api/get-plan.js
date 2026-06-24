import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";
import { loadPlanFromRow } from "../lib/planShape.js";

// Read one of a rep's plans and reshape stored facts back into the plan object the
// screens expect. The rep is derived from the verified token, never a client repId.
//
// Default (no planId): returns the rep's CURRENT plan, where "current" is the plan
// with the latest effective date (NOT the is_current flag) so a prior-year upload can
// never read back as current. With ?planId=<id>: returns that specific plan, scoped
// to the rep (a rep cannot read another rep's plan by guessing an id). Archived plans
// are excluded everywhere.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });
    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    const planId = req.query && req.query.planId;
    let planRow;
    if (planId) {
      const rows = await sql`SELECT * FROM compensation_plans WHERE id = ${planId} AND rep_id = ${repId} AND archived_at IS NULL LIMIT 1`;
      if (!rows.length) return res.status(404).json({ ok: false, error: "Plan not found for this rep." });
      planRow = rows[0];
    } else {
      // Current = latest effective date, falling back to received_at when dates are null.
      const rows = await sql`SELECT * FROM compensation_plans WHERE rep_id = ${repId} AND archived_at IS NULL ORDER BY effective_from DESC NULLS LAST, received_at DESC NULLS LAST LIMIT 1`;
      if (!rows.length) return res.status(200).json({ ok: true, plan: null });
      planRow = rows[0];
    }

    const { plan, coachTake } = await loadPlanFromRow(sql, planRow);
    return res.status(200).json({ ok: true, plan, coachTake });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
