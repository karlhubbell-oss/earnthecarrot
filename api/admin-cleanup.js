import { neon } from "@neondatabase/serverless";

// TEMPORARY, token-guarded admin endpoint for inventorying and deleting test reps
// and all of their associated data. Built for a one-off cleanup; remove after use.
//
// POST body:
//   { token, mode: "inventory" | "delete", repIds: [...], nameLike?: "Jane Doe", confirm?: true }
// - "inventory" (default) is read-only: returns each rep row and per-table row counts.
// - "delete" requires confirm === true and removes rows in FK-safe order.
//
// The token gates all access so the endpoint cannot be casually triggered while live.
const TOKEN = "b32e464d7eb617756422263a2a5eb3391d7f4aa12eadcc4e";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const body = req.body || {};
    if (body.token !== TOKEN) {
      return res.status(403).json({ ok: false, error: "Forbidden." });
    }
    const sql = neon(process.env.DATABASE_URL);
    const mode = body.mode === "delete" ? "delete" : "inventory";

    // Resolve the set of rep ids to act on: explicit ids plus any name matches.
    const requestedIds = Array.isArray(body.repIds) ? body.repIds.filter((x) => typeof x === "string" && x.length) : [];
    let nameMatchRows = [];
    if (body.nameLike) {
      nameMatchRows = await sql`SELECT id, name FROM reps WHERE name ILIKE ${"%" + body.nameLike + "%"}`;
    }
    const idSet = new Set(requestedIds);
    nameMatchRows.forEach((r) => idSet.add(r.id));
    const ids = [...idSet];

    // Build an inventory for every requested id (whether or not the rep row exists).
    const inventory = [];
    for (const id of ids) {
      const repRows = await sql`SELECT id, name, email, company, role, created_at FROM reps WHERE id = ${id}`;
      const [facts] = await sql`SELECT count(*)::int AS c FROM compensation_facts WHERE rep_id = ${id}`;
      const [periods] = await sql`
        SELECT count(*)::int AS c FROM plan_periods pp
        JOIN compensation_plans cp ON cp.id = pp.compensation_plan_id WHERE cp.rep_id = ${id}`;
      const [plans] = await sql`SELECT count(*)::int AS c FROM compensation_plans WHERE rep_id = ${id}`;
      const [docs] = await sql`SELECT count(*)::int AS c FROM uploaded_documents WHERE rep_id = ${id}`;
      inventory.push({
        repId: id,
        repExists: repRows.length > 0,
        name: repRows[0] ? repRows[0].name : null,
        email: repRows[0] ? repRows[0].email : null,
        company: repRows[0] ? repRows[0].company : null,
        role: repRows[0] ? repRows[0].role : null,
        counts: {
          uploaded_documents: docs.c,
          compensation_plans: plans.c,
          plan_periods: periods.c,
          compensation_facts: facts.c,
        },
      });
    }

    if (mode === "inventory") {
      return res.status(200).json({ ok: true, mode, requestedIds, nameMatches: nameMatchRows, inventory });
    }

    // ── delete ──
    if (body.confirm !== true) {
      return res.status(400).json({ ok: false, error: "Delete requires confirm: true." });
    }
    if (!ids.length) {
      return res.status(400).json({ ok: false, error: "No rep ids resolved to delete." });
    }
    const deleted = {};
    for (const id of ids) {
      // FK-safe order: facts -> periods -> plans -> documents -> rep.
      const f = await sql`DELETE FROM compensation_facts WHERE rep_id = ${id} RETURNING id`;
      const pp = await sql`
        DELETE FROM plan_periods WHERE compensation_plan_id IN
          (SELECT id FROM compensation_plans WHERE rep_id = ${id}) RETURNING id`;
      const cp = await sql`DELETE FROM compensation_plans WHERE rep_id = ${id} RETURNING id`;
      const ud = await sql`DELETE FROM uploaded_documents WHERE rep_id = ${id} RETURNING id`;
      const r = await sql`DELETE FROM reps WHERE id = ${id} RETURNING id`;
      deleted[id] = {
        compensation_facts: f.length,
        plan_periods: pp.length,
        compensation_plans: cp.length,
        uploaded_documents: ud.length,
        reps: r.length,
      };
    }
    return res.status(200).json({ ok: true, mode, deleted });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
