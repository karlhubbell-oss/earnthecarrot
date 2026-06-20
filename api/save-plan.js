import { neon } from "@neondatabase/serverless";
import { randomUUID } from "node:crypto";
import { verifyIdentity, resolveRepId } from "../lib/serverAuth.js";

// Persist a parsed comp plan into the five tables. Append-only facts; one atomic
// transaction. The rep is derived from the verified token, not a client repId.

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const parseDate = (s) => { if (!s) return null; const d = new Date(String(s).slice(0, 10) + "T00:00:00Z"); return isNaN(d.getTime()) ? null : d; };
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
const addDays = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
const toNum = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[^\d.]/g, ""));
  return isNaN(n) ? null : n;
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const body = req.body || {};
    const plan = body.plan;
    if (!plan || typeof plan !== "object") {
      return res.status(400).json({ ok: false, error: "Missing parsed plan in request body." });
    }
    const identity = await verifyIdentity(req);
    if (!identity) return res.status(401).json({ ok: false, error: "Not authenticated." });
    const sql = neon(process.env.DATABASE_URL);
    const repId = await resolveRepId(sql, identity, { email: body.repEmail, name: (plan.meta && plan.meta.rep_name) || null });

    const meta = plan.meta || {};
    const pay = plan.pay || {};
    const quota = plan.quota || {};
    const commission = plan.commission || {};
    const spiffs = Array.isArray(plan.spiffs) ? plan.spiffs : [];
    const other = plan.other_terms || {};
    const prov = plan.provenance || {};
    const fc = prov.field_confidence || {};

    const period = meta.plan_period || {};
    const effFromStr = period.start_date || null;
    const effToStr = period.end_date || null;

    const filename = body.filename || (Array.isArray(prov.source_files) && prov.source_files[0]) || "comp-plan.pdf";
    const originalFilename = body.originalFilename || filename;
    const rawContent = body.rawContent || null;

    // ── Plan periods (derive count from the plan's period structure) ──
    const rawPeriod = String((quota.total_quota && quota.total_quota.period) || period.type || "annual").toLowerCase();
    let periodType = "annual", count = 1, step = 12;
    if (/month/.test(rawPeriod)) { periodType = "monthly"; count = 12; step = 1; }
    else if (/quarter/.test(rawPeriod)) { periodType = "quarterly"; count = 4; step = 3; }
    else if (/(semi|half|bi-?annual)/.test(rawPeriod)) { periodType = "semiannual"; count = 2; step = 6; }
    else { periodType = "annual"; count = 1; step = 12; }

    const effFromDate = parseDate(effFromStr);
    const effToDate = parseDate(effToStr) || (effFromDate ? addDays(addMonths(effFromDate, 12), -1) : null);

    const periods = [];
    if (effFromDate) {
      for (let i = 0; i < count; i++) {
        const start = addMonths(effFromDate, i * step);
        const isLast = i === count - 1;
        const end = isLast && effToDate ? effToDate : addDays(addMonths(effFromDate, (i + 1) * step), -1);
        let label;
        if (periodType === "monthly") label = `${MONTHS[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
        else if (periodType === "quarterly") label = `Q${i + 1} ${start.getUTCFullYear()}`;
        else if (periodType === "semiannual") label = `H${i + 1} ${start.getUTCFullYear()}`;
        else label = `FY ${start.getUTCFullYear()}`;
        periods.push({ id: randomUUID(), periodType, start: ymd(start), end: ymd(end), label });
      }
    } else {
      periods.push({ id: randomUUID(), periodType, start: null, end: null, label: periodType });
    }

    // ── Compensation facts (append-only) ──
    const planId = randomUUID();
    const docId = randomUUID();
    const facts = [];
    const addFact = (factType, valueNumeric, valueText, opts = {}) => facts.push({
      id: randomUUID(), factType,
      valueNumeric: valueNumeric == null ? null : valueNumeric,
      valueText: valueText == null ? null : valueText,
      planPeriodId: opts.planPeriodId ?? null,
      confidence: opts.confidence ?? null,
      notes: opts.notes ?? null,
      effFrom: opts.effFrom ?? effFromStr,
      effTo: opts.effTo ?? effToStr,
    });

    if (pay.base_salary && pay.base_salary.amount != null) addFact("base_salary", toNum(pay.base_salary.amount), null, { confidence: fc["pay.base_salary"] });
    if (pay.ote && pay.ote.amount != null) addFact("ote", toNum(pay.ote.amount), null, { confidence: fc["pay.ote"] });
    if (pay.target_variable && pay.target_variable.amount != null) addFact("target_variable", toNum(pay.target_variable.amount), null, { confidence: fc["pay.target_variable"] });
    if (pay.pay_mix && pay.pay_mix.base_pct != null) addFact("pay_mix_base_pct", toNum(pay.pay_mix.base_pct), null, { confidence: fc["pay.pay_mix"] });
    if (pay.pay_mix && pay.pay_mix.variable_pct != null) addFact("pay_mix_variable_pct", toNum(pay.pay_mix.variable_pct), null, { confidence: fc["pay.pay_mix"] });

    if (quota.total_quota && quota.total_quota.amount != null) {
      addFact("quota", toNum(quota.total_quota.amount), null, { confidence: fc["quota.total_quota"], notes: quota.total_quota.period ? `period: ${quota.total_quota.period}` : null });
    }
    (Array.isArray(quota.components) ? quota.components : []).forEach((c) => {
      if (!c) return;
      addFact("component_quota", toNum(c.quota_amount), c.name || null, { notes: c.weight_pct != null ? `weight ${c.weight_pct}%` : null });
      // Persist a component's own commission rate when it differs from the plan.
      const cc = c.commission || null;
      const compRate = cc && Array.isArray(cc.tiers) && cc.tiers.length && cc.tiers[0].rate != null
        ? cc.tiers[0].rate
        : (cc && cc.rate != null ? cc.rate : null);
      if (compRate != null) addFact("component_rate", toNum(compRate), c.name || null, { notes: "component base rate" });
      // Accelerable: a component with its own commission does not ride the plan accelerators.
      addFact("component_accelerable", cc ? 0 : 1, c.name || null, { notes: cc ? "own rate, does not ride plan accelerators" : "rides plan accelerators" });
      // A component's own full tier ladder, so its real bands are not flattened to one rate.
      if (cc && Array.isArray(cc.tiers) && cc.tiers.length) {
        cc.tiers.forEach((t) => {
          if (!t) return;
          const range = `${t.from_attainment_pct == null ? "?" : t.from_attainment_pct} to ${t.to_attainment_pct == null ? "and up" : t.to_attainment_pct}`;
          addFact("component_tier", toNum(t.rate), c.name || null, { notes: range });
        });
      }
    });

    if (commission.rate_basis) addFact("commission_rate_basis", null, commission.rate_basis, { confidence: fc["commission.rate_basis"] || commission.rate_basis_confidence || null, notes: commission.rate_basis_evidence || null });
    if (commission.calculation) addFact("calculation", null, commission.calculation, { confidence: fc["commission.calculation"] });
    (Array.isArray(commission.tiers) ? commission.tiers : []).forEach((t) => {
      if (!t) return;
      const range = `${t.from_attainment_pct ?? "?"} to ${t.to_attainment_pct == null ? "and up" : t.to_attainment_pct}%`;
      addFact("commission_tier", toNum(t.rate), range, { confidence: fc["commission.tiers"], notes: t.label || null });
    });
    if (commission.floor && commission.floor.type && commission.floor.type !== "none") addFact("floor", toNum(commission.floor.attainment_pct), commission.floor.type, { confidence: fc["commission.floor"] });
    if (commission.cap && commission.cap.type && commission.cap.type !== "none") addFact("cap", toNum(commission.cap.attainment_pct), commission.cap.type, { confidence: fc["commission.cap"] });

    spiffs.forEach((s) => {
      if (s == null) return;
      if (typeof s === "string") { addFact("spiff", null, s); return; }
      const name = s.name || s.title || "SPIFF";
      const amount = toNum(s.amount != null ? s.amount : (s.payout != null ? s.payout : s.value));
      const noteParts = [];
      ["amount", "payout", "value", "condition", "trigger", "criteria", "description", "limit", "frequency", "payout_timing", "clawback"].forEach((k) => {
        if (s[k] != null && (typeof s[k] === "string" || typeof s[k] === "number")) noteParts.push(`${k}: ${s[k]}`);
      });
      addFact("spiff", amount, name, { notes: noteParts.length ? noteParts.join(" · ") : null });
    });

    if (other.draw && other.draw.type && other.draw.type !== "none") addFact("draw", toNum(other.draw.amount), other.draw.type);
    if (other.payout_frequency) addFact("payout_frequency", null, other.payout_frequency);
    if (other.clawback_terms) addFact("clawback", null, other.clawback_terms);

    // ── Build the transaction (FK-safe order) ──
    const queries = [];

    queries.push(sql`
      INSERT INTO reps (id, email, name, company, role)
      VALUES (${repId}, ${body.repEmail || null}, ${meta.rep_name || null}, ${meta.company || null}, ${meta.rep_role || null})
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, reps.name),
        company = COALESCE(EXCLUDED.company, reps.company),
        role = COALESCE(EXCLUDED.role, reps.role)`);

    queries.push(sql`
      INSERT INTO uploaded_documents (id, rep_id, document_type, filename, original_filename, uploaded_at, processed_at, raw_content)
      VALUES (${docId}, ${repId}, 'compensation_plan', ${filename}, ${originalFilename}, now(), now(), ${rawContent})`);

    // Exactly one current plan per rep: retire any prior current plans first.
    queries.push(sql`UPDATE compensation_plans SET is_current = false WHERE rep_id = ${repId} AND is_current = true`);

    queries.push(sql`
      INSERT INTO compensation_plans (id, rep_id, name, effective_from, effective_to, received_at, source_document_id, is_current)
      VALUES (${planId}, ${repId}, ${meta.plan_name || null}, ${effFromStr}, ${effToStr}, now(), ${docId}, true)`);

    periods.forEach((p) => {
      queries.push(sql`
        INSERT INTO plan_periods (id, compensation_plan_id, period_type, start_date, end_date, label)
        VALUES (${p.id}, ${planId}, ${p.periodType}, ${p.start}, ${p.end}, ${p.label})`);
    });

    facts.forEach((f) => {
      queries.push(sql`
        INSERT INTO compensation_facts (id, rep_id, compensation_plan_id, plan_period_id, fact_type, value_numeric, value_text, effective_from, effective_to, received_at, source_document_id, confidence_score, notes)
        VALUES (${f.id}, ${repId}, ${planId}, ${f.planPeriodId}, ${f.factType}, ${f.valueNumeric}, ${f.valueText}, ${f.effFrom}, ${f.effTo}, now(), ${docId}, ${f.confidence}, ${f.notes})`);
    });

    await sql.transaction(queries);

    return res.status(200).json({
      ok: true,
      repId,
      documentId: docId,
      planId,
      periodsCreated: periods.length,
      factsWritten: facts.length,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
