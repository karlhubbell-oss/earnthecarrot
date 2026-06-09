export default async function handler(req, res) {
  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          { role: "user", content: "Reply with exactly one short sentence confirming the Earn The Carrot API connection is working." }
        ],
      }),
    });
    const data = await response.json();
    if (data.error) return res.status(500).json({ ok: false, error: data.error });
    const text = (data.content || []).map(b => b.text || "").join("");
    return res.status(200).json({ ok: true, message: text });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err) });
  }
}
