import { createRemoteJWKSet, jwtVerify } from "jose";
import { randomUUID } from "node:crypto";

// Server-side Neon Auth (Better Auth) session verification for the API routes.
// The client sends the session JWT as `Authorization: Bearer <token>`. We verify
// it against Neon Auth's public JWKS (no secret needed) and read the user id from
// the `sub` claim. The rep identity is derived from that verified id, never from a
// client-supplied repId, so a caller can only touch their own rep's data.

const AUTH_URL = (process.env.NEON_AUTH_URL || process.env.VITE_NEON_AUTH_URL || "").replace(/\/+$/, "");

let _jwks = null;
function getJwks() {
  if (!AUTH_URL) throw new Error("NEON_AUTH_URL is not configured");
  if (!_jwks) _jwks = createRemoteJWKSet(new URL(`${AUTH_URL}/.well-known/jwks.json`));
  return _jwks;
}

// Returns { authUserId, email, name } for a valid token, or null. Signature and
// expiry are verified via JWKS; we intentionally do not enforce issuer/audience
// here, since a JWKS-valid signature already proves the Neon Auth server issued it.
export async function verifyIdentity(req) {
  try {
    const raw = req.headers["authorization"] || req.headers["Authorization"] || "";
    const m = /^Bearer\s+(.+)$/i.exec(String(raw).trim());
    if (!m) return null;
    const { payload } = await jwtVerify(m[1], getJwks());
    if (!payload || !payload.sub) return null;
    return {
      authUserId: String(payload.sub),
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
    };
  } catch {
    return null;
  }
}

// Resolve (creating if needed) the single rep row for a verified identity,
// keyed on reps.auth_user_id. Returns the rep id.
export async function resolveRepId(sql, identity, fallback = {}) {
  const email = identity.email || fallback.email || null;
  const name = identity.name || fallback.name || null;
  const existing = await sql`SELECT id FROM reps WHERE auth_user_id = ${identity.authUserId} ORDER BY created_at ASC`;
  if (existing.length) {
    // One identity should map to exactly one rep. If duplicates ever exist, stay
    // deterministic (earliest-created wins) and surface it; never delete anything.
    if (existing.length > 1) {
      console.warn(`resolveRepId: ${existing.length} reps share auth_user_id ${identity.authUserId}; using earliest-created ${existing[0].id}`);
    }
    await sql`UPDATE reps SET email = COALESCE(email, ${email}), name = COALESCE(name, ${name}) WHERE id = ${existing[0].id}`;
    return existing[0].id;
  }
  const id = randomUUID();
  try {
    await sql`INSERT INTO reps (id, auth_user_id, email, name) VALUES (${id}, ${identity.authUserId}, ${email}, ${name})`;
    return id;
  } catch (e) {
    // Unique-index race or email already linked: re-resolve before failing.
    const again = await sql`SELECT id FROM reps WHERE auth_user_id = ${identity.authUserId} ORDER BY created_at ASC LIMIT 1`;
    if (again.length) return again[0].id;
    throw e;
  }
}
