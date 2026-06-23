import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

// Neon Auth (Better Auth) client. We route every auth call through a SAME-ORIGIN
// /auth path (a Vercel rewrite in vercel.json proxies /auth/* to the Neon Auth
// host). That makes the session cookie first-party to this site, so the browser
// sends it on getAccessToken (/auth/token) and the client gets a JWT to attach to
// authed API calls. Talking to the Neon host directly set a third-party cookie
// that browsers block, so getAccessToken got no token and every authed request
// 401'd. The React adapter provides the useSession hook; without it
// createAuthClient returns the vanilla client (no hook).
//
// VITE_NEON_AUTH_URL still gates "configured": when absent, main.jsx shows a plain
// message instead of crashing. The client baseURL is the current origin plus
// /auth (resolved at runtime in the browser), so it is first-party on production
// and on previews alike. The Better Auth client already sends credentials, and
// same-origin requests carry the cookie, so no extra fetch config is needed.
const configured = !!import.meta.env.VITE_NEON_AUTH_URL;
const authBaseUrl = typeof window !== "undefined"
  ? `${window.location.origin}/auth`
  : import.meta.env.VITE_NEON_AUTH_URL;

export const authClient = configured
  ? createAuthClient(authBaseUrl, { adapter: BetterAuthReactAdapter() })
  : null;
