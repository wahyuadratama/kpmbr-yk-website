require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const url = (process.env.DATABASE_URL || '').replace('mariadb://', 'mysql://');
  const c = await mysql.createConnection(url);
  const sql = fs.readFileSync('prisma/migrations/20261022010000_add_member_applications/migration.sql', 'utf8');
  const statements = sql.split(/;\s*\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('--'));
  for (const st of statements) {
    console.log('exec:', st.slice(0, 55).replace(/\s+/g, ' '));
    await c.query(st);
  }
  console.log('applied');
  await c.end();
})().catch(e => { console.error(e.sqlMessage || e.message); process.exit(1); });
