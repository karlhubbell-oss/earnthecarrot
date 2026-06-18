import { neon } from "@neondatabase/serverless";

// Read a rep's CURRENT plan from the database and reshape stored facts back into
// the plan object the screens expect (inverse of api/save-plan). Read-only.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const repId = (req.query && req.query.repId) || (req.body && req.body.repId);
    if (!repId) {
      return res.status(400).json({ ok: false, error: "Missing repId." });
    }
    const sql = neon(process.env.DATABASE_URL);

    // Current plan: prefer is_current, then in-force-today, then most recent.
    let plans = await sql`SELECT * FROM compensation_plans WHERE rep_id = ${repId} AND is_current = true ORDER BY received_at DESC NULLS LAST LIMIT 1`;
    if (!plans.length) {
      plans = await sql`SELECT * FROM compensation_plans WHERE rep_id = ${repId} AND effective_from <= CURRENT_DATE AND (effective_to IS NULL OR effective_to >= CURRENT_DATE) ORDER BY received_at DESC NULLS LAST LIMIT 1`;
    }
    if (!plans.length) {
      plans = await sql`SELECT * FROM compensation_plans WHERE rep_id = ${repId} ORDER BY received_at DESC NULLS LAST LIMIT 1`;
    }
    if (!plans.length) {
      return res.status(200).json({ ok: true, plan: null });
    }
    const planRow = plans[0];

    const repRows = await sql`SELECT * FROM reps WHERE id = ${repId} LIMIT 1`;
    const rep = repRows[0] || {};
    const facts = await sql`SELECT * FROM compensation_facts WHERE compensation_plan_id = ${planRow.id}`;
    const periods = await sql`SELECT period_type FROM plan_periods WHERE compensation_plan_id = ${planRow.id} LIMIT 1`;

    let docName = null;
    if (planRow.source_document_id) {
      const docs = await sql`SELECT original_filename, filename FROM uploaded_documents WHERE id = ${planRow.source_document_id} LIMIT 1`;
      if (docs.length) docName = docs[0].original_filename || docs[0].filename || null;
    }

    const num = (v) => (v == null ? null : Number(v));
    const dstr = (v) => (v == null ? null : String(v).slice(0, 10));

    const plan = {
      schema_version: "1.0",
      meta: {
        rep_name: rep.name || null,
        rep_role: rep.role || null,
        company: rep.company || null,
        plan_name: planRow.name || null,
        plan_period: { type: periods.length ? (periods[0].period_type || null) : null, start_date: dstr(planRow.effective_from), end_date: dstr(planRow.effective_to) },
        currency: "USD",
      },
      pay: {
        base_salary: { amount: null, period: "annual" },
        ote: { amount: null, period: "annual" },
        target_variable: { amount: null, period: "annual" },
        pay_mix: { base_pct: null, variable_pct: null },
      },
      quota: { total_quota: { amount: null, period: null }, components: [] },
      commission: { rate_basis: null, rate_basis_evidence: null, rate_basis_confidence: null, calculation: null, floor: { type: "none", attainment_pct: null }, cap: { type: "none", attainment_pct: null }, tiers: [] },
      spiffs: [],
      other_terms: { draw: { type: "none", amount: null }, payout_frequency: null, clawback_terms: null },
      provenance: { source_files: docName ? [docName] : [], parse_engine: null, parse_version: null, field_confidence: {}, needs_clarification: [] },
    };
    const fc = plan.provenance.field_confidence;
    const compRateByName = {}; // component name -> its own commission rate

    for (const f of facts) {
      const vn = num(f.value_numeric);
      const vt = f.value_text;
      const conf = f.confidence_score || null;
      switch (f.fact_type) {
        case "base_salary": plan.pay.base_salary.amount = vn; if (conf) fc["pay.base_salary"] = conf; break;
        case "ote": plan.pay.ote.amount = vn; if (conf) fc["pay.ote"] = conf; break;
        case "target_variable": plan.pay.target_variable.amount = vn; if (conf) fc["pay.target_variable"] = conf; break;
        case "pay_mix_base_pct": plan.pay.pay_mix.base_pct = vn; break;
        case "pay_mix_variable_pct": plan.pay.pay_mix.variable_pct = vn; break;
        case "quota": {
          plan.quota.total_quota.amount = vn;
          if (conf) fc["quota.total_quota"] = conf;
          const m = f.notes && String(f.notes).match(/period:\s*(.+)/i);
          if (m) plan.quota.total_quota.period = m[1].trim();
          break;
        }
        case "component_quota": {
          const wm = f.notes && String(f.notes).match(/weight\s*([\d.]+)/i);
          plan.quota.components.push({ name: vt || "", weight_pct: wm ? Number(wm[1]) : null, quota_amount: vn, rate: null, commission: null });
          break;
        }
        case "component_rate": { if (vt != null) compRateByName[vt] = vn; break; }
        case "commission_rate_basis":
          plan.commission.rate_basis = vt || null;
          plan.commission.rate_basis_evidence = f.notes || null;
          plan.commission.rate_basis_confidence = conf;
          if (conf) fc["commission.rate_basis"] = conf;
          break;
        case "calculation": plan.commission.calculation = vt || null; if (conf) fc["commission.calculation"] = conf; break;
        case "commission_tier": {
          let from = null, to = null;
          const tm = vt && String(vt).match(/([\d.]+)\s*to\s*(and up|[\d.]+)/i);
          if (tm) { from = Number(tm[1]); to = /and up/i.test(tm[2]) ? null : Number(tm[2]); }
          plan.commission.tiers.push({ from_attainment_pct: from, to_attainment_pct: to, rate: vn, label: f.notes || null });
          if (conf) fc["commission.tiers"] = conf;
          break;
        }
        case "floor": plan.commission.floor = { type: vt || "threshold", attainment_pct: vn }; if (conf) fc["commission.floor"] = conf; break;
        case "cap": plan.commission.cap = { type: vt || "hard", attainment_pct: vn }; if (conf) fc["commission.cap"] = conf; break;
        case "spiff": {
          const s = { name: vt || "SPIFF" };
          if (vn != null) s.payout = vn;
          if (f.notes) s.detail = f.notes;
          plan.spiffs.push(s);
          break;
        }
        case "draw": plan.other_terms.draw = { type: vt || "none", amount: vn }; break;
        case "payout_frequency": plan.other_terms.payout_frequency = vt || null; break;
        case "clawback": plan.other_terms.clawback_terms = vt || null; break;
        default: break;
      }
    }

    plan.commission.tiers.sort((a, b) => (a.from_attainment_pct || 0) - (b.from_attainment_pct || 0));
    plan.quota.components.forEach((c) => { if (compRateByName[c.name] != null) c.rate = compRateByName[c.name]; });

    return res.status(200).json({ ok: true, plan });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
