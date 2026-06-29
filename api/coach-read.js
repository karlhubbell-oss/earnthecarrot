import { diffPlans, formatDiffBrief } from "../lib/planDiff.js";

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

// Comparison commentary: only runs when the rep has a prior-year plan. The diff is
// computed deterministically (lib/planDiff) and handed to the model; the model writes
// only the plain-language read around those facts, never new numbers.
export const COMPARE_SYSTEM_PROMPT = `You are a sharp sales compensation strategist comparing a rep's CURRENT comp plan to their PRIOR-year plan. You are given a deterministic diff of exactly what changed. Explain it to the rep straight.

Return ONLY a single JSON object with exactly this shape. No preamble, no markdown code fences:

{
  "headline": "1 sentence naming the real shift from the prior plan to this one. Plain, sharp, no hedging.",
  "points": [
    { "change": "the specific thing that changed, in plain words with the actual numbers", "meaning": "what it does to YOUR money, concretely", "move": "the move it suggests you make" }
  ],
  "bottom_line": "the net effect across the changes, and the play. Be honest about what got worse. A short paragraph when several things changed; a single sentence when little did."
}

Critical rules:
- Reason ONLY from the diff provided. Never invent numbers or changes that are not in the diff. Every number you cite must appear in the diff.
- Tone: plain truth plus agency. State what changed, what it means for the rep's money, and the move it suggests. This is NOT a good-news-bad-news-good-news sandwich. Do not soften a cut by burying it between two positives. If something got worse for the rep (a lower rate, a smaller share, a cut quota), say so plainly and say what it means in real money.
- Scale the whole commentary to how much actually changed. The diff drives the length: the number of "points" should track the number of material changes. Several distinct changes warrant several points; one or two changes warrant just one or two points and a brief bottom line. Do NOT pad to look thorough, do not invent secondary angles, and do not split one change into multiple points to fill space. If only one thing changed, make that single point well and stop.
- One "points" entry per material change (or tightly related group, e.g. a component's weight and rate together). Keep each concrete and specific to the numbers.
- Voice: sharp, direct, like a sales leader who shoots straight. Never fluffy, never salesy, never corporate-cheerful about a takeaway.
- Punctuation house style: never use a hyphen, en dash, or em dash as a sentence pause or aside. Rewrite as two sentences instead. Hyphens inside compound words are fine.`;

// Build the user message for the comparison call from the deterministic diff brief.
export function buildComparisonUserMessage(diff) {
  return "Here is the deterministic diff between the prior-year plan and the current plan. Write your comparison as the JSON object described.\n\n" + formatDiffBrief(diff);
}

// One Anthropic messages call -> parsed JSON object (strips code fences). Throws on
// API error or unparseable output so the caller can decide how to degrade.
async function callModelJSON(system, userContent, maxTokens) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  const data = await response.json();
  if (data.error) { const e = new Error(typeof data.error === "string" ? data.error : (data.error.message || "model error")); e.apiError = data.error; throw e; }
  const rawText = (data.content || []).map((b) => b.text || "").join("");
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned);
}

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
    const { plan, priorPlan } = req.body || {};
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

    // Comparison commentary: only when a prior plan is supplied and the diff has
    // material changes. Best-effort: a failure here never blocks the base read.
    if (priorPlan) {
      try {
        const diff = diffPlans(plan, priorPlan);
        if (diff.hasPrior && diff.summary.total > 0) {
          const comparison = await callModelJSON(COMPARE_SYSTEM_PROMPT, buildComparisonUserMessage(diff), 1536);
          read.comparison = { prior_year: diff.priorYear, current_year: diff.currentYear, ...comparison };
        }
      } catch (cmpErr) {
        // Leave the take without a comparison rather than failing the whole read.
        console.error("coach-read comparison failed:", cmpErr && cmpErr.message ? cmpErr.message : cmpErr);
      }
    }

    // Safety net: strip stray em/en dashes from all string values in the read
    // (includes the comparison section attached above).
    read = deepStripDashes(read);

    return res.status(200).json({ ok: true, read });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
