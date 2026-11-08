require('dotenv').config({quiet:true});
const m=require('mysql2/promise');
(async()=>{
  const c=await m.createConnection(process.env.DATABASE_URL.replace('mariadb://','mysql://'));
  const [r]=await c.query("SELECT body FROM organization_contents WHERE `key`='sejarah'");
  const b=r[0].body;
  console.log('has 12 Desember 1972', b.includes('12 Desember 1972'));
  console.log('has Kabinet Sabilulungan 2026–2027', b.includes('Kabinet Sabilulungan pada periode 2026–2027.'));
  console.log('has IKPM Jawa Barat', b.includes('naungan IKPM Jawa Barat'));
  console.log('has placeholder', b.includes('[Konten belum diisi'));
  console.log('len', b.length);
  await c.end();
})();