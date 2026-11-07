require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const fs = require('fs');
(async () => {
  const c = await mysql.createConnection((process.env.DATABASE_URL || '').replace('mariadb://', 'mysql://'));
  const sql = fs.readFileSync('prisma/migrations/20261022000000_add_notifications/migration.sql', 'utf8');
  for (const st of sql.split(/;\s*\r?\n/).map(s => s.trim()).filter(s => s && !s.startsWith('--'))) {
    try { await c.query(st); console.log('exec ok'); } catch(e){ console.log('skip/err:', e.sqlMessage||e.message); }
  }
  console.log('done');
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
