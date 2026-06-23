import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

// Neon Auth (Better Auth) client. The console quickstart pairs createAuthClient
// with the prebuilt NeonAuthUIProvider, but we use our own login and signup
// screens, so we pass the React adapter directly. That adapter is what provides
// the React hooks (authClient.useSession); no provider component is required.
// Without the adapter, createAuthClient defaults to the vanilla client and has
// no useSession hook. Null when the URL is missing (an unconfigured build) so
// main.jsx can say so plainly instead of crashing.
//
// STAGE 2: the browser talks to our same-origin proxy (/api/auth) instead of the
// Neon Auth host directly. That makes Neon's session cookie first-party, so the
// browser stores and resends it and getAccessToken()/token works — the cross-origin
// cookie was previously blocked as third-party. The proxy (api/auth/[...path].js)
// forwards each call to the real Neon host server-side. We still gate on
// VITE_NEON_AUTH_URL so an unconfigured build stays null.
const configured = Boolean(import.meta.env.VITE_NEON_AUTH_URL);
const baseURL = typeof window !== "undefined" ? `${window.location.origin}/api/auth` : null;

export const authClient = configured && baseURL
  ? createAuthClient(baseURL, { adapter: BetterAuthReactAdapter() })
  : null;
