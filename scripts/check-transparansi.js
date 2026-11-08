require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  const [u]=await c.query("SELECT email,role FROM users WHERE status='ACTIVE' AND deleted_at IS NULL AND role='ANGGOTA' LIMIT 1");
  console.log('anggota',u);
  const [p]=await c.query("SELECT count(*) c FROM financial_reports WHERE deleted_at IS NULL AND status='PUBLISHED'");
  console.log('published_reports',p);
  const [t]=await c.query("SELECT count(*) c FROM financial_transactions WHERE deleted_at IS NULL");
  console.log('tx_count',t);
  await c.end();
})();