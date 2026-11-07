require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
const fs=require('fs');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  for (const file of [
    'prisma/migrations/20261022000000_add_notifications/migration.sql',
    'prisma/migrations/20261022010000_add_member_applications/migration.sql',
  ]) {
    const sql=fs.readFileSync(file,'utf8');
    const sts=sql.split(/;\s*\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith('--'));
    for (const st of sts) {
      try { await c.query(st); console.log('ok', file.split('/').pop()); }
      catch(e){ if(String(e.message).includes('already exists')||String(e.message).includes('Duplicate')) console.log('skip exists'); else console.log('ERR',e.sqlMessage||e.message); }
    }
  }
  const [r1]=await c.query("SHOW TABLES LIKE 'notifications'");
  const [r2]=await c.query("SHOW TABLES LIKE 'member_applications'");
  console.log('notifications',r1.length,'member_applications',r2.length);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
