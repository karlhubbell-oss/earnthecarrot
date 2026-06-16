const SYSTEM_PROMPT = `You help a sales rep write a short, professional email to their manager to clarify points in their compensation plan. You will receive clarifying questions that were originally written addressed to the rep. Rewrite them into one brief, warm, confident email FROM the rep TO their manager.

Rules:
- The rep is asking the manager to confirm details about the rep's OWN comp plan. Reframe each question accordingly. For example, "What is your annual base salary for this plan year?" becomes a request to confirm the rep's base salary.
- Tone: the email must make the rep look sharp, engaged, and detail-oriented, like a top performer who wants to model their plan correctly. Never difficult, never like an audit or a complaint.
- Keep it brief: a short greeting, one sentence of context such as wanting to make sure they are modeling the plan correctly, the questions as a short bulleted or numbered list, a brief thank you, and a sign off.
- Use [Manager] as a placeholder if no manager name is given. Sign with the rep's name if provided, otherwise [Your name].
- Output only the email text. You may start with a "Subject:" line. No preamble, no commentary, no markdown code fences.`;

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed. Use POST." });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ ok: false, error: "ANTHROPIC_API_KEY is not configured." });
    }
    const { questions, repName, planName, planYear } = req.body || {};
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ ok: false, error: "Missing questions in request body." });
    }

    const lines = [];
    if (repName) lines.push(`Rep name: ${repName}`);
    if (planName) lines.push(`Plan name: ${planName}`);
    if (planYear) lines.push(`Plan year: ${planYear}`);
    lines.push("");
    lines.push("Clarifying questions (originally addressed to the rep):");
    questions.forEach((q, i) => lines.push(`${i + 1}. ${q}`));
    const userText = lines.join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userText,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ ok: false, error: data.error });

    const email = (data.content || []).map((b) => b.text || "").join("");
    return res.status(200).json({ ok: true, email });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
