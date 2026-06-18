import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";

// Creates a real rep row (simple identity, not secure auth yet) and returns its id.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const body = req.body || {};
    const repId = body.repId || randomUUID();
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO reps (id, email, name, company, role)
      VALUES (${repId}, ${body.email || null}, ${body.name || null}, ${body.company || null}, ${body.role || null})
      ON CONFLICT (id) DO UPDATE SET name = COALESCE(EXCLUDED.name, reps.name)`;
    return res.status(200).json({ ok: true, repId });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
