import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Resolve the verified Neon Auth identity to exactly one rep, creating it on first
// use. The identity comes from the verified Bearer token (never from the body), so
// a caller can only resolve their own rep. Keyed on reps.auth_user_id.
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

    const body = req.body || {};
    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity, { email: body.email, name: body.name });

    // Return the stored take-home profile so the client can seed its inputs on load.
    // Read-only here; writes go through save-rep-profile so a reload can't clobber.
    const rows = await sql`SELECT home_state, age_bracket, k401_pct, health_monthly, other_monthly, target_pct, stretch_pct, target_carrot_name, target_carrot_cost, stretch_carrot_name, stretch_carrot_cost FROM reps WHERE id = ${repId} LIMIT 1`;
    const r = rows[0] || {};
    const profile = {
      home_state: r.home_state ?? null,
      age_bracket: r.age_bracket ?? null,
      k401_pct: r.k401_pct == null ? null : Number(r.k401_pct),
      health_monthly: r.health_monthly == null ? null : Number(r.health_monthly),
      other_monthly: r.other_monthly == null ? null : Number(r.other_monthly),
      target_pct: r.target_pct == null ? null : Number(r.target_pct),
      stretch_pct: r.stretch_pct == null ? null : Number(r.stretch_pct),
      target_carrot_name: r.target_carrot_name ?? null,
      target_carrot_cost: r.target_carrot_cost == null ? null : Number(r.target_carrot_cost),
      stretch_carrot_name: r.stretch_carrot_name ?? null,
      stretch_carrot_cost: r.stretch_carrot_cost == null ? null : Number(r.stretch_carrot_cost),
    };
    return res.status(200).json({ ok: true, repId, profile });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
