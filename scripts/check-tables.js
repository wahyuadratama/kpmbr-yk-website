require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  const [r]=await c.query("SHOW TABLES LIKE 'member_applications'");
  console.log('member_applications:', r.length);
  const [r2]=await c.query("SHOW TABLES LIKE 'notifications'");
  console.log('notifications:', r2.length);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
