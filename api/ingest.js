export const config = { maxDuration: 60 };

const SYSTEM_PROMPT = `You are a precise extraction engine for sales compensation plans. You read a comp plan PDF and return a single JSON object describing it. You never invent numbers. When a value is not stated in the plan, set it to null and record a clarifying question.

Return ONLY the JSON object. No preamble, no explanation, no markdown code fences.

Use exactly this schema:

{
  "schema_version": "1.0",
  "meta": {
    "rep_name": null,
    "rep_role": null,
    "plan_name": null,
    "plan_period": { "type": null, "start_date": null, "end_date": null },
    "currency": "USD"
  },
  "pay": {
    "base_salary": { "amount": null, "period": "annual" },
    "ote": { "amount": null, "period": "annual" },
    "target_variable": { "amount": null, "period": "annual" },
    "pay_mix": { "base_pct": null, "variable_pct": null }
  },
  "quota": {
    "total_quota": { "amount": null, "period": null },
    "components": []
  },
  "commission": {
    "rate_basis": null,
    "rate_basis_evidence": null,
    "rate_basis_confidence": null,
    "calculation": null,
    "floor": { "type": "none", "attainment_pct": null },
    "cap": { "type": "none", "attainment_pct": null },
    "tiers": []
  },
  "spiffs": [],
  "other_terms": {
    "draw": { "type": "none", "amount": null },
    "payout_frequency": null,
    "clawback_terms": null
  },
  "provenance": {
    "source_files": [],
    "parse_engine": "claude-sonnet-4-6",
    "parse_version": "1.0",
    "field_confidence": {},
    "needs_clarification": []
  }
}

Each quota component, when present, has the shape:
{ "name": "", "weight_pct": null, "quota_amount": null, "commission": null }
Set "commission" inside a component only when that component pays at a different rate or tier structure than the rest of the plan. Otherwise leave it null and use the plan level commission block.

Each tier has the shape:
{ "from_attainment_pct": 0, "to_attainment_pct": null, "rate": 0, "label": null }

Rules:

1. Rate basis detection. Decide whether the plan pays:
   - "pct_of_revenue": a commission rate applied to booked revenue dollars, for example 10 percent of revenue.
   - "pct_of_variable": a payout expressed as a percent of the rep's target variable, driven by percent of quota attained.
   - "dollar_per_unit": a fixed dollar amount per deal or unit.
   Primary signal: if the plan gives a worked dollar example, for example a rep at a stated attainment earning a stated dollar figure, reproduce that figure under each model and pick the model whose math matches the stated dollars. The worked example is the answer key.
   Backup signals from wording: "commission rate" plus a percent applied to revenue points to pct_of_revenue. "Target incentive" or payout tied to percent of quota points to pct_of_variable. Rates roughly in the 5 to 15 percent range usually mean revenue. A rate near 100 percent usually means target variable.
   Record the chosen basis in commission.rate_basis, a short plain explanation of the exact signal you used in commission.rate_basis_evidence, and high, medium, or low in commission.rate_basis_confidence.

2. Never fabricate. Any value not clearly stated in the plan is null. For every null that affects earnings, and for anything genuinely ambiguous, add an entry to provenance.needs_clarification of the form { "field": "<field path>", "question": "<specific question to ask the rep>", "source_quote": "<exact text from the plan, or null>" }. Every question must be written in the second person, addressed directly to the rep using "you" and "your". Never refer to "the rep" or "the representative" in a question. For example, write "What is your annual base salary for this plan year?" not "What is the rep's annual base salary?". Keep questions specific, plain, and friendly.
   source_quote rules:
   - source_quote is the exact text from the plan that the question relates to, copied verbatim from the document.
   - Keep it short: a single sentence or a brief phrase. Never quote a whole paragraph.
   - It must be exact text from the plan. Never paraphrase, summarize, or invent it.
   - If the question is about something the plan does not mention at all, so there is no relevant text to quote, set source_quote to null.

3. Confidence. For the money critical fields (base_salary, ote, target_variable, total_quota, tiers, floor, cap, rate_basis), add an entry to provenance.field_confidence mapping the field path to high, medium, or low.

4. Tiers. Capture every band with its from and to attainment percent and its rate. Model a floor as commission.floor with type "threshold" and the attainment percent below which nothing pays. Model a hard ceiling as commission.cap with type "hard" and the attainment percent above which nothing pays. Capture accelerators and super accelerators as their own tiers.

5. Calculation style. Set commission.calculation to "marginal" if higher rates apply only to the dollars within each band, or "retroactive" if reaching a tier lifts the rate on the whole amount. If the plan does not say, set it to null and add a clarifying question.

6. Provenance. Put the provided filename into provenance.source_files.`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY is not configured." });
    }
    const { pdfBase64, filename } = req.body || {};
    if (!pdfBase64) {
      return res.status(400).json({ ok: false, error: "Missing pdfBase64 in request body." });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: pdfBase64,
                },
              },
              {
                type: "text",
                text: "Extract this compensation plan into the schema. Return only the JSON object.",
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ ok: false, error: data.error });

    const rawText = (data.content || []).map((b) => b.text || "").join("");
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    let plan;
    try {
      plan = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({
        ok: false,
        error: "Failed to parse model output as JSON: " + String(parseErr),
        raw: rawText,
      });
    }

    if (plan.provenance) {
      plan.provenance.source_files = filename ? [filename] : [];
    }

    return res.status(200).json({ ok: true, plan });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
