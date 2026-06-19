import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

// Resolve a Neon Auth identity to exactly one rep row, creating it on first use.
// Keyed on reps.auth_user_id (unique), so repeated calls for the same identity
// always return the same rep. This replaces the old create-rep-every-signup flow.
//
// NOTE: for this pass the identity is taken from the request body, which the
// client reads from the authenticated Stack user. Verifying the Stack access
// token server-side (so the identity cannot be spoofed) is the committed next
// step and will also cover save-plan and get-plan.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const { authUserId, email, name } = req.body || {};
    if (!authUserId) {
      return res.status(400).json({ ok: false, error: "Missing authUserId." });
    }
    const sql = neon(process.env.DATABASE_URL);

    // Already linked? Return that rep, refreshing email/name if they were empty.
    const existing = await sql`SELECT id FROM reps WHERE auth_user_id = ${authUserId} LIMIT 1`;
    if (existing.length) {
      await sql`
        UPDATE reps
        SET email = COALESCE(email, ${email || null}),
            name = COALESCE(name, ${name || null})
        WHERE id = ${existing[0].id}`;
      return res.status(200).json({ ok: true, repId: existing[0].id, created: false });
    }

    // First time: create the rep linked to this identity.
    const id = randomUUID();
    try {
      await sql`
        INSERT INTO reps (id, auth_user_id, email, name)
        VALUES (${id}, ${authUserId}, ${email || null}, ${name || null})`;
      return res.status(200).json({ ok: true, repId: id, created: true });
    } catch (e) {
      // A unique-index conflict (race, or the email is already linked to a rep)
      // means a rep for this identity may now exist. Re-resolve before failing.
      const again = await sql`SELECT id FROM reps WHERE auth_user_id = ${authUserId} LIMIT 1`;
      if (again.length) {
        return res.status(200).json({ ok: true, repId: again[0].id, created: false });
      }
      return res.status(409).json({ ok: false, error: "Could not create rep: " + String(e && e.message ? e.message : e) });
    }
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
