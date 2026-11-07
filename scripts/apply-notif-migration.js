const mariadb = require('mariadb');
const fs = require('fs');
require('dotenv').config({ quiet: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL missing');
  const sql = fs.readFileSync('prisma/migrations/20261022000000_add_notifications/migration.sql', 'utf8');
  const statements = sql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  const pool = mariadb.createPool({ uri: url, multipleStatements: false, connectionLimit: 2 });
  const conn = await pool.getConnection();
  try {
    for (const st of statements) {
      if (!st) continue;
      console.log('exec:', st.slice(0, 60).replace(/\s+/g, ' '));
      await conn.query(st);
    }
    console.log('migration applied');
  } finally {
    conn.release();
    await pool.end();
  }
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
