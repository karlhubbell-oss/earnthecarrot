import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Persist the rep's take-home profile (collected at signup, editable later). Hard
// overwrite of the provided fields, scoped to the verified rep, so a rep can only
// write their own profile. Unlike ensure-rep (which only fills NULLs on resolve so a
// reload can't clobber), this is the explicit save path: signup and the Step-3 edit.
const numOrNull = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

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
    const homeState = typeof body.home_state === "string" && body.home_state.trim() ? body.home_state.trim() : null;
    const ageBracket = typeof body.age_bracket === "string" && body.age_bracket.trim() ? body.age_bracket.trim() : null;
    const k401 = numOrNull(body.k401_pct);
    const health = numOrNull(body.health_monthly);
    const other = numOrNull(body.other_monthly);
    const targetPct = numOrNull(body.target_pct);
    const stretchPct = numOrNull(body.stretch_pct);
    const tCarrotName = typeof body.target_carrot_name === "string" && body.target_carrot_name.trim() ? body.target_carrot_name.trim() : null;
    const tCarrotCost = numOrNull(body.target_carrot_cost);
    const sCarrotName = typeof body.stretch_carrot_name === "string" && body.stretch_carrot_name.trim() ? body.stretch_carrot_name.trim() : null;
    const sCarrotCost = numOrNull(body.stretch_carrot_cost);
    const targetLocked = body.target_locked === true;
    const stretchLocked = body.stretch_locked === true;
    // deal_plan: a structured object (Strategy Step 2). Stored as jsonb. Accept only a
    // plain object; anything else (including an explicit null) clears it to NULL.
    const dealPlan =
      body.deal_plan && typeof body.deal_plan === "object" && !Array.isArray(body.deal_plan)
        ? JSON.stringify(body.deal_plan)
        : null;

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    await sql`
      UPDATE reps SET
        home_state = ${homeState},
        age_bracket = ${ageBracket},
        k401_pct = ${k401},
        health_monthly = ${health},
        other_monthly = ${other},
        target_pct = ${targetPct},
        stretch_pct = ${stretchPct},
        target_carrot_name = ${tCarrotName},
        target_carrot_cost = ${tCarrotCost},
        stretch_carrot_name = ${sCarrotName},
        stretch_carrot_cost = ${sCarrotCost},
        target_locked = ${targetLocked},
        stretch_locked = ${stretchLocked},
        deal_plan = ${dealPlan}::jsonb
      WHERE id = ${repId}`;

    return res.status(200).json({ ok: true, repId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
