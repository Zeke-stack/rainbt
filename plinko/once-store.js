// Once-only markers in Postgres (Neon) so one-time grants apply exactly once across serverless instances.
let pool = null;
function url() {
  return process.env.DATABASE_URL_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}
async function claim(id) {
  const u = url();
  if (!u) return false;
  if (!pool) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: u, max: 1, ssl: { rejectUnauthorized: false } });
    await pool.query('CREATE TABLE IF NOT EXISTS once_claims (id text PRIMARY KEY, at timestamptz DEFAULT now())');
  }
  const r = await pool.query('INSERT INTO once_claims (id) VALUES ($1) ON CONFLICT DO NOTHING', [id]);
  return r.rowCount === 1;
}
module.exports = { claim };
