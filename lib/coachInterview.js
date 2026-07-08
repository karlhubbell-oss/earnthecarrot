// Coach's proposals for the Account Prioritization interview. One shared module so the
// endpoint and the tests run the exact same prompts and model call. Coach LEADS: at
// every step it reads the rep's real account data and proposes a smart starting point
// with its reasoning visible, then the rep reacts and owns the final call. Never a
// blank form.

const MODEL = "claude-sonnet-4-6";

// House style: strip em/en dashes used as punctuation (compound-word hyphens are kept
// by the model instruction; this is only a safety net for stray long dashes).
function stripDashes(s) {
  return String(s).replace(/[—–]/g, ", ").replace(/ {2,}/g, " ").replace(/ +,/g, ",").replace(/,(?: *,)+/g, ",");
}
export function deepStripDashes(value) {
  if (typeof value === "string") return stripDashes(value);
  if (Array.isArray(value)) return value.map(deepStripDashes);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) out[k] = deepStripDashes(value[k]);
    return out;
  }
  return value;
}

export const COACH_SYSTEM = `You are Coach, a sharp and warm sales strategist helping a sales rep decide which accounts to point their effort at. This is a partnership, never compliance. The rep always has the last word.

Your defining behavior: you LEAD with intelligence. At every step you have already read the rep's real account data, and you PROPOSE a concrete starting point with your reasoning visible. You never hand the rep a blank field or an unexplained checklist. You did the first pass and you explain it, so the rep can react and adjust, agreeing or disagreeing from a real starting point that they then own.

Hard rules:
- Reason ONLY from the data you are given: the account counts, the columns, the customer and prospect breakdown, the customer profile, the sample rows, the rep's ICP, and any deal-list data. Never invent a column, an industry, a number, or a fact that is not in the data. If the data is thin, be modest and say what you would want to confirm.
- Refer to the rep's actual data specifically. Name the industries, the columns, the counts you actually see. Generic advice is a failure. The whole value is that you read THEIR list.
- Money and counts in plain words. Never write a currency symbol; the app formats currency.
- Punctuation house style: never use a hyphen, en dash, or em dash as a sentence pause or aside. Rewrite as two sentences instead. Hyphens inside compound words are fine. No emoji.
- Voice: direct, confident, warm, like a sales leader who shoots straight and is on the rep's side.
- Return ONLY the single JSON object the step asks for. No preamble, no markdown code fences.`;

// Per-step instruction appended to the user message, defining the exact JSON to return.
const STEP_SHAPES = {
  icp: `This is the ICP step. Read the customer profile and samples and propose a first-draft Ideal Customer Profile the rep can edit. Return ONLY this JSON object:
{
  "observation": "1 to 2 sentences naming what the data actually shows about their current customers, with the real industries, sizes, or segments you see.",
  "draft_icp": "a concrete first-draft ICP written as the rep could keep it, for example 'Manufacturing and logistics companies, 500 to 5000 employees, headquartered in the US.' Ground every part in the data.",
  "reasoning": "why you drafted it this way from their data, naming the signals you used.",
  "question": "a short warm prompt inviting them to confirm or redirect, for example 'Is that your sweet spot, or are you chasing something different?'"
}`,
  metrics: `This is the metrics step, the biggest moment. Read the columns, the ICP, and the customer data and propose a starting set of fit-signal metrics with your reasoning per metric, and say which columns you left out and why. Aim for about 10 metrics. Never propose more than 25. Prefer columns that genuinely signal fit. You may add up to 2 metrics that are not literally columns in the file if they are clearly relevant to prioritizing these accounts (mark those source "coach_suggested"). Return ONLY this JSON object:
{
  "metrics": [ { "name": "the metric name", "source": "column" or "coach_suggested", "column": "the exact file column it maps to, or null", "reasoning": "why this is a good fit signal for THIS rep's accounts" } ],
  "skipped": [ { "column": "the file column you left out", "reason": "why it is not a fit signal, plainly" } ],
  "note": "a short line about the set, for example 'I picked 9 to start. Most reps land around 10, and you can add more up to 25.'"
}`,
  weights: `This is the weights step. The rep has chosen a set of metrics (listed below). Propose a weight of "high", "medium", or "low" for each, with a one-line reason. Higher weight means it matters more to the account score. Return ONLY this JSON object:
{
  "weights": [ { "name": "the metric name exactly as given", "weight": "high" or "medium" or "low", "reasoning": "one line on why it carries that weight" } ],
  "note": "a short closing line."
}`,
  close_rate: `This is the close-rate step. Give the rep a benchmark to react to, and propose a rate. If deal-list sizes are provided, propose a rate per size (bigger deals usually close at a lower rate). Otherwise propose one overall rate. Rates are percentages expressed as plain numbers (for example 20 means 20 percent). Return ONLY this JSON object:
{
  "anchor": "the benchmark to react to, for example 'Most enterprise reps run about 15 to 25 percent on new logo, higher on expansion.'",
  "proposed": { "mode": "overall" or "by_size", "overall": a number or null, "by_size": [ { "label": "the size label", "rate": a number } ] or null },
  "reasoning": "why you landed on this, referencing their mix of customers and prospects or their deal sizes.",
  "question": "a short prompt, for example 'Sound right, or do you know your actual numbers?'"
}`,
};

export function buildUserMessage(step, { summary, state, dealSizes }) {
  const parts = [];
  parts.push("Here is the rep's account data, already read and summarized for you:");
  parts.push(JSON.stringify(summary, null, 2));
  if (state && state.icp_text) parts.push(`\nThe rep's confirmed ICP is:\n"${state.icp_text}"`);
  if (step === "weights" && state && Array.isArray(state.metrics)) {
    parts.push(`\nThe rep has chosen these metrics to weight:\n${JSON.stringify(state.metrics.map((m) => ({ name: m.name, source: m.source })), null, 2)}`);
  }
  if (step === "close_rate") {
    parts.push(dealSizes ? `\nThe rep's deal list has these deal sizes (dollar values, largest first):\n${JSON.stringify(dealSizes, null, 2)}` : "\nNo deal-list sizes are available, so propose one overall close rate.");
  }
  parts.push("\n" + STEP_SHAPES[step]);
  return parts.join("\n");
}

// One model call for a step. Returns the parsed, dash-cleaned proposal object. Throws
// on API error or unparseable output so the caller can degrade.
export async function callCoach(step, ctx, apiKey) {
  if (!STEP_SHAPES[step]) throw new Error(`unknown interview step: ${step}`);
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      system: COACH_SYSTEM,
      messages: [{ role: "user", content: buildUserMessage(step, ctx) }],
    }),
  });
  const data = await response.json();
  if (data.error) { const e = new Error(typeof data.error === "string" ? data.error : data.error.message || "model error"); e.apiError = data.error; throw e; }
  const rawText = (data.content || []).map((b) => b.text || "").join("");
  const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  return deepStripDashes(JSON.parse(cleaned));
}
