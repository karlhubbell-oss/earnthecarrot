import { StackClientApp } from "@stackframe/react";

// Neon Auth (Stack) client app. Configured from build-time env vars so the
// real keys live in Vercel, never in the repo. When the keys are absent (for
// example a preview that has not been configured yet) this is null, and
// main.jsx shows a clear "not configured" message instead of crashing.
const projectId = import.meta.env.VITE_STACK_PROJECT_ID;
const publishableClientKey = import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY;

export const stackClientApp = projectId && publishableClientKey
  ? new StackClientApp({
      projectId,
      publishableClientKey,
      // Cookie token store keeps the session across page reloads.
      tokenStore: "cookie",
      // We drive our own screen navigation, so Stack should not redirect.
      redirectMethod: "none",
    })
  : null;
