import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Read the caller's saved Coach interview output (ICP, close rate, metric set), so the
// interview can be revisited and edited later. Rep-scoped via the verified token.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);
    const [rep] = await sql`SELECT account_strategy FROM reps WHERE id = ${repId}`;
    return res.status(200).json({ ok: true, strategy: (rep && rep.account_strategy) || null });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
