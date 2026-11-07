require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  await c.query('CREATE TABLE IF NOT EXISTS _fase1b_probe (id VARCHAR(10) PRIMARY KEY)');
  let [r]=await c.query("SHOW TABLES LIKE '_fase1b_probe'");
  console.log('probe',r.length);
  await c.query('DROP TABLE _fase1b_probe');
  [r]=await c.query("SHOW TABLES LIKE 'member_applications'");
  console.log('member_applications',r.length);
  [r]=await c.query("SHOW TABLES LIKE 'notifications'");
  console.log('notifications',r.length);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
