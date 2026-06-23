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

    const tables = tableNames.map((t) => ({ table: t, status: existing.has(t) ? "already existed" : "created" }));
    return res.status(200).json({ ok: true, tables, migrations: ["compensation_plans.coach_take jsonb"] });
  } catch (err) {
    return res.status(500).json({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}
