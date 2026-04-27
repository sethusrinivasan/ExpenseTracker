/**
 * Unified DB query helper.
 *
 * - Production (Neon): DATABASE_URL contains "neon.tech" or "neon.database"
 *   Uses @neondatabase/serverless over HTTP — the correct driver for Vercel/edge.
 *
 * - Local (plain Postgres): any other postgres:// URL
 *   Uses the standard `pg` Pool over TCP — works with Docker Postgres.
 *
 * Both paths accept the same ($1, $2, ...) parameterized query syntax.
 */

export async function dbQuery(sql: string, params: unknown[] = []): Promise<Record<string, unknown>[]> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured. Set it in your environment variables.")
  }

  const isNeon = url.includes("neon.tech") || url.includes("neon.database")

  if (isNeon) {
    // neon serverless driver — sql.query() returns rows[] directly (not { rows })
    const { neon } = await import("@neondatabase/serverless")
    const db = neon(url)
    return db.query(sql, params) as Promise<Record<string, unknown>[]>
  }

  // Standard pg Pool for local / self-hosted Postgres
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: url })
  try {
    const result = await pool.query(sql, params)
    return result.rows
  } finally {
    await pool.end()
  }
}

export function dbErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "An unexpected database error occurred."
  const msg = error.message
  if (msg.includes("DATABASE_URL")) return msg
  if (msg.includes("ECONNREFUSED") || msg.includes("fetch failed") || msg.includes("connect ETIMEDOUT"))
    return "Unable to reach the database. Check your DATABASE_URL and network connectivity."
  if (msg.includes("password") || msg.includes("authentication"))
    return "Database authentication failed. Check your credentials."
  if (msg.includes("does not exist") || msg.includes("relation"))
    return "Database table not found. Run the migration script to set up the schema."
  return msg
}
