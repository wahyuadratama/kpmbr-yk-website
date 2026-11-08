require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  const [r]=await c.query("SELECT `key`,title,is_published,LEFT(body,120) b FROM organization_contents WHERE `key`='sejarah'");
  console.log(JSON.stringify(r,null,2));
  await c.end();
})();
