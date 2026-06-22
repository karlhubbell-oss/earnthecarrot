const SYSTEM_PROMPT = `You are a sharp sales compensation strategist. You read a parsed comp plan object and return a short, honest "Coach's read" of what the plan is really designed to do.

Return ONLY a single JSON object with exactly this shape. No preamble, no explanation, no markdown code fences:

{
  "thesis": "1 to 2 sentences naming what this plan is fundamentally built to make the rep do. Plain, sharp, like a sales leader who shoots straight.",
  "where_money_is": [
    { "name": "component or area name", "detail": "short plain description with its weight and quota", "rate": "its rate or rate range as a short string", "signal": "one of: highest, uncapped, gated, capped, steady, or empty string" }
  ],
  "pushing_toward": "1 short paragraph reading the INTENT behind the comp design. Compare the rates to infer what leadership wants the rep to do. This is the insight a comp document never gives.",
  "blind_spots": [
    { "title": "short name of the trap", "body": "1 to 2 sentences on the gate, floor, cap, or clawback and why it matters in real money terms" }
  ],
  "bridge": "1 short paragraph bridging into building the strategy together, in a co-creating voice (the rep brings the accounts, Coach helps make the math work). Never claim Coach builds the plan for them."
}

Critical rules:
- Reason ONLY from the plan object provided. Never invent numbers, rates, or terms that are not in the plan.
- If the plan is vague or missing key data, the read must be appropriately modest. Do not manufacture a confident thesis from a plan that says little. It is fine for where_money_is or blind_spots to be short or nearly empty when the plan does not support more.
- Every dollar or percentage claim must trace to the plan. When you reference a consequence (for example losing a gated commission), it must be grounded in an actual gate or term in the plan.
- Voice: sharp, direct, confident, like a sales leader who shoots straight. Never fluffy. Never salesy.
- Punctuation house style: never use a hyphen, en dash, or em dash as a sentence pause or aside. When you want that kind of break, rewrite it as two sentences or restructure the clause instead. Hyphens INSIDE compound words (for example floor-maintenance, over-invest, on-target) are correct and must be kept. This rule targets only dashes used as a pause, not compound-word hyphens.`;

// Strip em/en dashes used as punctuation from a single string (regular hyphens kept).
function stripDashes(s) {
  return s
    .replace(/[—–]/g, ", ")
    .replace(/ {2,}/g, " ")
    .replace(/ +,/g, ",")
    .replace(/,(?: *,)+/g, ",");
}

// Recursively strip dashes from every string value in the parsed read.
function deepStripDashes(value) {
  if (typeof value === "string") return stripDashes(value);
  if (Array.isArray(value)) return value.map(deepStripDashes);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepStripDashes(value[k]);
    return out;
  }
  return value;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY is not configured." });
    }
    const { plan } = req.body || {};
    if (!plan) {
      return res.status(400).json({ ok: false, error: "Missing plan in request body." });
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
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: "Here is the parsed comp plan object. Return your Coach's read as the JSON object described.\n\n" + JSON.stringify(plan, null, 2),
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ ok: false, error: data.error });

    const rawText = (data.content || []).map((b) => b.text || "").join("");
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();

    let read;
    try {
      read = JSON.parse(cleaned);
    } catch (parseErr) {
      return res.status(500).json({
        ok: false,
        error: "Failed to parse model output as JSON: " + String(parseErr),
        raw: rawText,
      });
    }

    // Safety net: strip stray em/en dashes from all string values in the read.
    read = deepStripDashes(read);

    return res.status(200).json({ ok: true, read });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
