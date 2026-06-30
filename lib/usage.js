import { randomUUID } from "node:crypto";

// Per-user daily usage limiter (phase 1 foundation).
//
// Storage: one row per expensive AI op in usage_events (rep_id, event_type,
// created_at). Granular on purpose, so a later admin panel / email summary can see
// WHAT a user did, not just how many. "How many today" is an indexed COUNT.
//
// Reset boundary: the US Pacific calendar day. We compare the Pacific-local date of
// each event to today's Pacific-local date, so the window resets at midnight Pacific
// and stays correct across DST.
//
// Per-user cap: reps.daily_op_limit (default below). Read per request, never
// hardcoded, so an admin can raise/lower one user's cap with a single UPDATE.

export const USAGE_TZ = "America/Los_Angeles";
export const DEFAULT_DAILY_LIMIT = 25;

export function usageBlockedMessage() {
  return "You've reached your daily usage limit. It resets at midnight Pacific.";
}

// Today's used count (Pacific day) + this rep's cap.
export async function getUsage(sql, repId) {
  const usedRows = await sql`
    SELECT count(*)::int AS used FROM usage_events
    WHERE rep_id = ${repId}
      AND (created_at AT TIME ZONE ${USAGE_TZ})::date = (now() AT TIME ZONE ${USAGE_TZ})::date`;
  const used = usedRows[0] ? usedRows[0].used : 0;
  const limRows = await sql`SELECT daily_op_limit FROM reps WHERE id = ${repId} LIMIT 1`;
  const limit = limRows[0] && limRows[0].daily_op_limit != null ? Number(limRows[0].daily_op_limit) : DEFAULT_DAILY_LIMIT;
  return { used, limit, remaining: Math.max(0, limit - used) };
}

export async function logUsageEvent(sql, repId, eventType) {
  await sql`INSERT INTO usage_events (id, rep_id, event_type) VALUES (${randomUUID()}, ${repId}, ${eventType})`;
}

// Gate one operation: returns { blocked, used, limit, remaining }. When not blocked it
// has already logged the event (increment-before-call). Caller proceeds only when
// blocked === false.
export async function gateUsage(sql, repId, eventType) {
  const { used, limit } = await getUsage(sql, repId);
  if (used >= limit) return { blocked: true, used, limit, remaining: 0 };
  await logUsageEvent(sql, repId, eventType);
  const nowUsed = used + 1;
  return { blocked: false, used: nowUsed, limit, remaining: Math.max(0, limit - nowUsed) };
}
