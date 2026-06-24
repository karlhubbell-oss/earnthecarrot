import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// List a rep's non-archived plans for the comparison tabs. Rep is derived from the
// verified token. Ordered newest plan year first, so the client's leftmost/default
// tab is the current year. Returns lightweight rows; the full plan is fetched per id
// via get-plan?planId= when a tab is opened.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });
    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    const plans = await sql`
      SELECT id, name, plan_year, effective_from, effective_to, is_current, received_at
      FROM compensation_plans
      WHERE rep_id = ${repId} AND archived_at IS NULL
      ORDER BY plan_year DESC NULLS LAST, effective_from DESC NULLS LAST, received_at DESC NULLS LAST`;

    return res.status(200).json({ ok: true, plans });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
