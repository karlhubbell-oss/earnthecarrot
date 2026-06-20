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
    return res.status(200).json({ ok: true, repId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
