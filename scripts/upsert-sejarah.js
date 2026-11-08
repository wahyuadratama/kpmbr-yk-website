require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const body = `Keluarga Pelajar dan Mahasiswa Bandung Raya – Yogyakarta (KPMBR-YK) adalah organisasi daerah (orda) yang menjadi rumah bagi para pelajar dan mahasiswa asal Bandung Raya — Kota Bandung, Kabupaten Bandung, Kabupaten Bandung Barat, dan Kota Cimahi — yang sedang menempuh studi di Yogyakarta.

Organisasi ini berdiri pada 12 Desember 1972. Sejak awal, KPMBR-YK hadir sebagai wadah pemersatu bagi pelajar dan mahasiswa Bandung Raya di perantauan: tempat menjaga silaturahmi, menumbuhkan rasa persaudaraan dan kekeluargaan, serta mengkader generasi muda agar kreatif, kritis, dan peduli terhadap daerah asal maupun bangsa.

Sebagai organisasi kedaerahan, KPMBR-YK berasaskan Pancasila dan Undang-Undang Dasar 1945, serta bersifat pengkaderan, kemahasiswaan, kemasyarakatan, dan independen. Dalam kiprahnya, KPMBR-YK berada dalam naungan IKPM Jawa Barat.

Selama lebih dari lima dekade, KPMBR-YK terus menjadi ruang bertumbuh bagi pelajar dan mahasiswa Bandung Raya — dari generasi ke generasi, dari satu kepengurusan ke kepengurusan berikutnya, hingga Kabinet Sabilulungan pada periode 2026–2027.`;

(async () => {
  const c = await mysql.createConnection((process.env.DATABASE_URL || '').replace('mariadb://', 'mysql://'));
  const title = 'Sejarah KPMBR-YK';
  const key = 'sejarah';
  const kind = 'SEJARAH';
  const [rows] = await c.execute("SELECT id FROM organization_contents WHERE `key`=?", [key]);
  if (rows.length) {
    await c.execute(
      "UPDATE organization_contents SET title=?, body=?, is_published=1, published_at=COALESCE(published_at,NOW()), updated_at=NOW() WHERE `key`=?",
      [title, body, key]
    );
    console.log('updated', rows[0].id);
  } else {
    const id = 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-8);
    await c.execute(
      "INSERT INTO organization_contents(id,`key`,kind,title,body,is_published,published_at,created_at,updated_at) VALUES (?,?,?,?,?,1,NOW(),NOW(),NOW())",
      [id, key, kind, title, body]
    );
    console.log('inserted', id);
  }
  const [r] = await c.execute("SELECT title,LEFT(body,60) b FROM organization_contents WHERE `key`=?", [key]);
  console.log(r[0]);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
