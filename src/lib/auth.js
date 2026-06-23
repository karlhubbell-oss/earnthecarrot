import { createAuthClient } from "@neondatabase/neon-js/auth";
import { BetterAuthReactAdapter } from "@neondatabase/neon-js/auth/react/adapters";

// Neon Auth (Better Auth) client. The console quickstart pairs createAuthClient
// with the prebuilt NeonAuthUIProvider, but we use our own login and signup
// screens, so we pass the React adapter directly. That adapter is what provides
// the React hooks (authClient.useSession); no provider component is required.
// Without the adapter, createAuthClient defaults to the vanilla client and has
// no useSession hook. Null when the URL is missing (an unconfigured build) so
// main.jsx can say so plainly instead of crashing.
const url = import.meta.env.VITE_NEON_AUTH_URL;

export const authClient = url
  ? createAuthClient(url, { adapter: BetterAuthReactAdapter() })
  : null;
