export const config = { maxDuration: 60 };

import { neon } from "@neondatabase/serverless";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";
import { gateUsage, usageBlockedMessage } from "../lib/usage.js";
import { shapeAccounts, summarizeAccounts, summarizeDealSizes } from "../lib/accountSummary.js";
import { callCoach } from "../lib/coachInterview.js";

// Coach's proposal for one interview step (icp | metrics | weights | close_rate).
// Rep-scoped: reads the caller's own accounts (from the verified token), summarizes
// them, and asks the model to propose with reasoning. The rep's in-progress state
// (confirmed ICP, chosen metrics) rides along so later steps read earlier answers.
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY is not configured." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });

    const { step, state } = req.body || {};
    if (!["icp", "metrics", "weights", "close_rate"].includes(step)) {
      return res.status(400).json({ ok: false, error: "Missing or invalid step." });
    }

    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity);

    // Usage gate (fail open on limiter error, like the other AI endpoints).
    let usage = null;
    try {
      const gate = await gateUsage(sql, repId, "coach_interview");
      if (gate.blocked) return res.status(429).json({ ok: false, code: "DAILY_LIMIT", error: usageBlockedMessage(), usage: gate });
      usage = gate;
    } catch (e) {
      console.error("coach-interview usage gate error (allowing):", e && e.message ? e.message : e);
    }

    const accountRows = await sql`SELECT id, name, customer_status FROM accounts WHERE rep_id = ${repId} ORDER BY created_at ASC, id ASC`;
    if (!accountRows.length) {
      return res.status(400).json({ ok: false, error: "No accounts yet. Import your account list first, then Coach can read it." });
    }
    const fieldRows = await sql`SELECT account_id, field_name, value_text, value_numeric FROM account_fields WHERE rep_id = ${repId} ORDER BY received_at ASC, id ASC`;
    const summary = summarizeAccounts(shapeAccounts(accountRows, fieldRows));

    let dealSizes = null;
    if (step === "close_rate") {
      const [rep] = await sql`SELECT deal_plan FROM reps WHERE id = ${repId}`;
      dealSizes = summarizeDealSizes(rep && rep.deal_plan);
    }

    let proposal;
    try {
      proposal = await callCoach(step, { summary, state: state || {}, dealSizes }, process.env.ANTHROPIC_API_KEY);
    } catch (e) {
      return res.status(502).json({ ok: false, error: `Coach could not put together a proposal just now. ${e && e.message ? e.message : e}` });
    }

    return res.status(200).json({ ok: true, step, proposal, usage });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
