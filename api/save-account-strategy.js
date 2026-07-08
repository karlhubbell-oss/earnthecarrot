import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Persist the Coach interview output (ICP, close rate, metric set) for the caller.
// Rep-scoped: derived from the verified token. Stored as jsonb on reps.account_strategy,
// the metrics kept as portable objects. Explicit save path; a plain object writes, an
// explicit null clears.
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
    const strategy =
      body.account_strategy && typeof body.account_strategy === "object" && !Array.isArray(body.account_strategy)
        ? JSON.stringify(body.account_strategy)
        : null;

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);
    await sql`UPDATE reps SET account_strategy = ${strategy}::jsonb WHERE id = ${repId}`;
    return res.status(200).json({ ok: true, repId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
