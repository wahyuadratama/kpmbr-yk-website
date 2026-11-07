require('dotenv').config({quiet:true});
const m=require('mysql2/promise'); const fs=require('fs');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  for(const file of [
    'prisma/migrations/20261022000000_add_notifications/migration.sql',
    'prisma/migrations/20261022010000_add_member_applications/migration.sql',
  ]){
    const sql=fs.readFileSync(file,'utf8');
    const sts=sql.split(/;\s*\r?\n/).map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/^--[^\n]*\n/gm,'').trim()).filter(Boolean);
    for(const st of sts){ try{await c.query(st);console.log('OK',file.includes('notif')?'notif':'app');}catch(e){console.log('E',e.sqlMessage);} }
  }
  const [a]=await c.query("SHOW TABLES LIKE 'notifications'");
  const [b]=await c.query("SHOW TABLES LIKE 'member_applications'");
  console.log('tables:',a.length,b.length);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
