import { neon } from "@neondatabase/serverless";

// One-time schema setup. Creates the five compensation tables if they do not exist,
// in foreign-key-safe order. Not wired into the app; call it once after deploy.
export default async function handler(req, res) {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ ok: false, error: "DATABASE_URL is not configured." });
    }
    const sql = neon(process.env.DATABASE_URL);

    const tableNames = ["reps", "uploaded_documents", "compensation_plans", "plan_periods", "compensation_facts"];

    // Record which tables already exist so we can report created vs already existed.
    const existingRows = await sql`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ANY(${tableNames})`;
    const existing = new Set(existingRows.map((r) => r.table_name));

    // 1. reps (no foreign keys)
    await sql`
      CREATE TABLE IF NOT EXISTS reps (
        id text PRIMARY KEY,
        email text,
        name text,
        company text,
        role text,
        timezone text,
        created_at timestamptz DEFAULT now()
      )`;

    // 2. uploaded_documents (referenced by the rest)
    await sql`
      CREATE TABLE IF NOT EXISTS uploaded_documents (
        id text PRIMARY KEY,
        rep_id text REFERENCES reps(id),
        document_type text,
        filename text,
        original_filename text,
        uploaded_at timestamptz,
        processed_at timestamptz,
        storage_path text,
        raw_content text,
        created_at timestamptz DEFAULT now()
      )`;

    // 3. compensation_plans
    await sql`
      CREATE TABLE IF NOT EXISTS compensation_plans (
        id text PRIMARY KEY,
        rep_id text REFERENCES reps(id),
        name text,
        effective_from date,
        effective_to date,
        received_at timestamptz,
        source_document_id text REFERENCES uploaded_documents(id),
        is_current boolean DEFAULT false,
        created_at timestamptz DEFAULT now()
      )`;

    // 4. plan_periods
    await sql`
      CREATE TABLE IF NOT EXISTS plan_periods (
        id text PRIMARY KEY,
        compensation_plan_id text REFERENCES compensation_plans(id),
        period_type text,
        start_date date,
        end_date date,
        label text,
        created_at timestamptz DEFAULT now()
      )`;

    // 5. compensation_facts
    await sql`
      CREATE TABLE IF NOT EXISTS compensation_facts (
        id text PRIMARY KEY,
        rep_id text REFERENCES reps(id),
        compensation_plan_id text REFERENCES compensation_plans(id),
        plan_period_id text REFERENCES plan_periods(id),
        fact_type text,
        value_numeric numeric,
        value_text text,
        effective_from date,
        effective_to date,
        received_at timestamptz,
        source_document_id text REFERENCES uploaded_documents(id),
        confidence_score text,
        notes text,
        created_at timestamptz DEFAULT now()
      )`;

    // Migration: cache for Coach's Take, stored on the plan row it was generated for.
    // Idempotent, so it is safe to re-run db-setup at any time.
    await sql`ALTER TABLE compensation_plans ADD COLUMN IF NOT EXISTS coach_take jsonb`;

    // Migration: plan_year, the organizing key for current-vs-prior comparison and
    // the year tabs. Derived from effective_from, falling back to received_at.
    // Backfills any existing rows that predate the column.
    await sql`ALTER TABLE compensation_plans ADD COLUMN IF NOT EXISTS plan_year integer`;
    await sql`
      UPDATE compensation_plans
      SET plan_year = COALESCE(EXTRACT(YEAR FROM effective_from), EXTRACT(YEAR FROM received_at))::int
      WHERE plan_year IS NULL`;

    // Migration: rep take-home profile, collected at signup and editable later.
    // Idempotent. Numeric fields carry the same defaults the UI pre-fills.
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS home_state text`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS age_bracket text`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS k401_pct numeric DEFAULT 6`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS health_monthly numeric DEFAULT 200`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS other_monthly numeric DEFAULT 0`;
    // Chosen target / stretch attainment goals (set on the earnings-goals screen).
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS target_pct numeric`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS stretch_pct numeric`;
    // Carrots: what the rep is fighting for at each goal (name + estimated cost).
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS target_carrot_name text`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS target_carrot_cost numeric`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS stretch_carrot_name text`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS stretch_carrot_cost numeric`;
    // Per-goal lock state (each card locks independently).
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS target_locked boolean DEFAULT false`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS stretch_locked boolean DEFAULT false`;
    // Strategy Step 2: the rep's deal-breakdown plan (per-component deal-size bands,
    // deals-per-year context, in-plan counts, and the editable per-component stretch
    // target). Structured JSON so the quarter planner can read back individual deals.
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS deal_plan jsonb`;

    // Usage limiter: per-op event log + per-user daily cap. Granular (event_type) so a
    // later admin panel / email summary can see what a user did, not just counts.
    await sql`
      CREATE TABLE IF NOT EXISTS usage_events (
        id text PRIMARY KEY,
        rep_id text REFERENCES reps(id),
        event_type text,
        created_at timestamptz DEFAULT now()
      )`;
    await sql`CREATE INDEX IF NOT EXISTS usage_events_rep_created_idx ON usage_events (rep_id, created_at)`;
    await sql`ALTER TABLE reps ADD COLUMN IF NOT EXISTS daily_op_limit integer DEFAULT 25`;

    const tables = tableNames.map((t) => ({ table: t, status: existing.has(t) ? "already existed" : "created" }));
    return res.status(200).json({ ok: true, tables, migrations: [
      "compensation_plans.coach_take jsonb",
      "compensation_plans.plan_year integer (+backfill)",
      "reps.{home_state,age_bracket,k401_pct,health_monthly,other_monthly}",
      "reps.{target_pct,stretch_pct}",
      "reps.{target_carrot_name,target_carrot_cost,stretch_carrot_name,stretch_carrot_cost}",
      "reps.{target_locked,stretch_locked}",
      "reps.deal_plan jsonb",
      "usage_events table (+rep_created_idx)",
      "reps.daily_op_limit integer (default 25)",
    ] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
