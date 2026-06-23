// Same-origin proxy to the Neon Auth host.
//
// The browser calls /api/auth/* (first-party to this site); this function fetches
// the matching Neon Auth endpoint server-side. A server fetch sets the correct
// upstream Host automatically, which is why this works where a vercel.json rewrite
// failed (the rewrite forwarded the app Host and Neon rejected it as
// INVALID_HOSTNAME). It forwards the request method, body, and Origin, and returns
// the upstream response with Set-Cookie unchanged, so Neon's session cookie lands
// first-party on the app domain and is sent on later auth calls.
//
// STAGE 1: dormant. The client is NOT pointed here yet, so this cannot affect login.

export const config = { maxDuration: 30 };

const NEON_BASE = (process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL || "").replace(/\/+$/, "");

export default async function handler(req, res) {
  try {
    if (!NEON_BASE) {
      return res.status(500).json({ error: "NEON_AUTH_URL is not configured" });
    }

    // Reconstruct the upstream path (+ query). Prefer the [...path] catch-all param,
    // but fall back to stripping the /api/auth prefix off req.url so this works the
    // same whether Vercel routes here via the auto-generated dynamic route or via the
    // explicit vercel.json rewrite. The query is taken from req.url (the rewrite may
    // inject a synthetic ?path= param into req.query, which we deliberately ignore).
    const segs = req.query && req.query.path;
    let pathStr = Array.isArray(segs) ? segs.join("/") : (typeof segs === "string" ? segs : "");
    const rawUrl = req.url || "";
    const qIdx = rawUrl.indexOf("?");
    const qs = qIdx >= 0 ? rawUrl.slice(qIdx) : "";
    if (!pathStr) {
      const pathOnly = qIdx >= 0 ? rawUrl.slice(0, qIdx) : rawUrl;
      pathStr = pathOnly.replace(/^\/api\/auth\/?/, "");
    }
    const target = `${NEON_BASE}/${pathStr}${qs}`;

    // Forward only an allowlist of request headers. Critically this drops Vercel's
    // x-forwarded-host / x-vercel-* headers: Neon derives its hostname check from
    // x-forwarded-host, so forwarding www.earnthecarrot.com made it reject with
    // INVALID_HOSTNAME. With these gone, fetch sets Host to the Neon host and the
    // check passes. We keep Cookie (session), Origin (CSRF), Content-Type, and Auth.
    const ALLOWED = new Set([
      "cookie", "content-type", "origin", "authorization",
      "accept", "accept-language", "user-agent", "x-neon-client-info",
    ]);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers || {})) {
      if (!ALLOWED.has(k.toLowerCase())) continue;
      if (v == null) continue;
      headers[k] = Array.isArray(v) ? v.join(", ") : v;
    }

    const method = req.method || "GET";
    let body;
    if (method !== "GET" && method !== "HEAD" && req.body != null && req.body !== "") {
      body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(target, { method, headers, body, redirect: "manual" });

    res.status(upstream.status);
    // Pass Set-Cookie through unchanged (and as separate headers, not comma-joined).
    const setCookies = typeof upstream.headers.getSetCookie === "function" ? upstream.headers.getSetCookie() : [];
    upstream.headers.forEach((value, key) => {
      const lk = key.toLowerCase();
      if (lk === "set-cookie" || lk === "content-encoding" || lk === "content-length" || lk === "transfer-encoding" || lk === "connection") return;
      res.setHeader(key, value);
    });
    if (setCookies.length) res.setHeader("set-cookie", setCookies);

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (err) {
    res.status(502).json({ error: "auth proxy error: " + String(err && err.message ? err.message : err) });
  }
}
