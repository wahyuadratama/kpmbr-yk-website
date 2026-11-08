require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
const fs=require('fs');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  const file='prisma/migrations/20261022010000_add_member_applications/migration.sql';
  const sql=fs.readFileSync(file,'utf8');
  const sts=sql.split(/;\s*\r?\n/).map(s=>s.trim()).filter(s=>s && !s.startsWith('--'));
  for (const st of sts) {
    try { await c.query(st); console.log('OK'); } catch(e){ console.log('ERR',e.sqlMessage||e.message); }
  }
  const [r]=await c.query("SHOW TABLES LIKE 'member_applications'");
  console.log('count',r.length);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
