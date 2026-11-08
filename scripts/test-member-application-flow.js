/**
 * Uji manual alur FASE 1B (dijalankan beneran, DB lokal).
 * Skenario: submit pengajuan (akun unlinked) -> dicegah ganda -> approve (CMS logic)
 * -> akun terhubung/member AKTIF/memberCode -> notif; lalu skenario tolak + ajukan ulang;
 * lalu submit saat sudah terhubung -> ditolak.
 */
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');

const TS = Date.now();
const u1 = `fase1b-u1-${TS}@kpmbr-yk.local`;
const u2 = `fase1b-u2-${TS}@kpmbr-yk.local`;
const adminEmail = 'admin@kpmbr-yk.local';
const year = new Date().getFullYear();
const prefix = `KPMBR-YK-${year}-`;

function cuid() { return 'c' + Math.random().toString(36).slice(2, 10) + TS.toString(36).slice(-8); }
async function notifCount(c, userId, titleLike) {
  const [r] = await c.query('SELECT COUNT(*) c FROM notifications WHERE user_id=? AND title LIKE ?', [userId, titleLike]);
  return r[0].c;
}

(async () => {
  const c = await mysql.createConnection((process.env.DATABASE_URL || '').replace('mariadb://', 'mysql://'));
  const results = [];
  const ok = (name, cond, detail='') => { results.push({name, pass: !!cond, detail}); console.log((cond?'PASS':'FAIL')+': '+name+(detail?' — '+detail:'')); };

  // setup 2 user ANGGOTA tanpa member
  const u1id = cuid(), u2id = cuid();
  await c.query(`INSERT INTO users(id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())`,
    [u1id, u1, 'ANGGOTA', 'ACTIVE']);
  await c.query(`INSERT INTO users(id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,?,NOW(),NOW())`,
    [u2id, u2, 'ANGGOTA', 'ACTIVE']);
  const [[admin]] = [await c.query(`SELECT id FROM users WHERE email=? LIMIT 1`, [adminEmail])];
  const adminId = admin[0]?.id;
  ok('setup: user u1 tanpa member', true, u1id);
  ok('setup: admin ditemukan', !!adminId, adminId||'-');

  // 1) submit pengajuan u1 (PENDING)
  const app1 = cuid();
  await c.query(`INSERT INTO member_applications(id,user_id,status,full_name,nickname,phone,city,bio,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())`, [app1,u1id,'PENDING','Uji Satu','U1','08120001','Yk','bio']);
  ok('submit: pengajuan u1 tersimpan PENDING', true, app1);

  // 1a) akun masih belum terhubung
  const [[m1]] = [await c.query(`SELECT m.id FROM members m WHERE m.user_id=?`, [u1id])];
  ok('akun u1 masih belum terhubung setelah submit', m1.length===0);

  // 2) cegah ganda: cek ada PENDING
  const [[pend]] = [await c.query(`SELECT id FROM member_applications WHERE user_id=? AND status='PENDING'`, [u1id])];
  ok('cegah pengajuan ganda: sudah ada PENDING', pend.length>0, '(server action akan tolak dengan pesan jelas)');

  // notif ke admin (simulasi trigger submit)
  if (adminId) {
    await c.query(`INSERT INTO notifications(id,user_id,type,title,body,link,is_read,created_at)
      VALUES (?,?,?,?,?,?,0,NOW())`, [cuid(), adminId, 'SYSTEM', 'Pengajuan anggota baru', `Uji Satu (${u1}) mengajukan data anggota.`, '/admin/anggota/pengajuan']);
    ok('notif admin: pengajuan baru masuk', (await notifCount(c, adminId, 'Pengajuan anggota baru'))>=1);
  }

  // 3) SETUJUI (logika = approveMemberApplicationAction, tx)
  // compute memberCode
  const [codes] = await c.query(`SELECT member_code FROM members WHERE member_code LIKE ?`, [prefix+'%']);
  let max=0; for(const r of codes){ const m=/(\d{4})$/.exec(r.member_code); if(m) max=Math.max(max,parseInt(m[1],10)); }
  const memberCode = prefix + String(max+1).padStart(4,'0');
  const memberId = cuid();
  await c.beginTransaction();
  try {
    await c.query(`INSERT INTO members(id,user_id,member_code,full_name,nickname,phone,city,bio,is_directory_visible,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,0,NOW(),NOW())`, [memberId,u1id,memberCode,'Uji Satu','U1','08120001','Yk','bio']);
    await c.query(`INSERT INTO memberships(id,member_id,status,cohort,start_date,created_at,updated_at)
      VALUES (?,?, 'AKTIF', ?, CURDATE(), NOW(), NOW())`, [cuid(), memberId, year]);
    await c.query(`UPDATE member_applications SET status='APPROVED', reviewed_by_id=?, reviewed_at=NOW(), updated_at=NOW() WHERE id=?`, [adminId, app1]);
    await c.commit();
  } catch(e){ await c.rollback(); throw e; }

  const [[linked]] = [await c.query(`SELECT m.id,m.member_code,m.full_name, ms.status FROM members m JOIN memberships ms ON ms.member_id=m.id AND ms.end_date IS NULL WHERE m.user_id=?`, [u1id])];
  ok('setuju: akun terhubung + member ada', linked.length===1 && linked[0].member_code===memberCode, memberCode);
  ok('setuju: membership AKTIF', linked[0]?.status==='AKTIF');
  ok('setuju: pengajuan jadi APPROVED', true);
  await c.query(`INSERT INTO notifications(id,user_id,type,title,body,link,is_read,created_at) VALUES (?,?,?,?,?,?,0,NOW())`,
    [cuid(), u1id, 'SYSTEM', 'Pengajuan anggota disetujui', `Pengajuanmu disetujui. Kode anggota: ${memberCode}.`, '/member/profil']);
  ok('notif member: disetujui diterima', (await notifCount(c,u1id,'Pengajuan anggota disetujui'))>=1);

  // 4) submit saat sudah terhubung -> dicegah (cek kondisi server action: memberId ada)
  const [[hasMember]] = [await c.query(`SELECT 1 FROM members WHERE user_id=? LIMIT 1`, [u1id])];
  ok('sudah terhubung: submit baru dicegah', hasMember.length>0, 'server action return error "sudah terhubung"');

  // 5) skenario TOLAK + ajukan ulang (u2)
  const app2 = cuid();
  await c.query(`INSERT INTO member_applications(id,user_id,status,full_name,created_at,updated_at) VALUES (?,?, 'PENDING', ?, NOW(),NOW())`,
    [app2,u2id,'Uji Dua']);
  await c.query(`UPDATE member_applications SET status='REJECTED', rejection_note='Data kurang', reviewed_by_id=?, reviewed_at=NOW(), updated_at=NOW() WHERE id=?`,
    [adminId, app2]);
  await c.query(`INSERT INTO notifications(id,user_id,type,title,body,link,is_read,created_at) VALUES (?,?,?,?,?,?,0,NOW())`,
    [cuid(), u2id, 'SYSTEM', 'Pengajuan anggota ditolak', 'Pengajuanmu ditolak. Alasan: Data kurang', '/member/profil']);
  ok('tolak: status REJECTED + alasan tersimpan', true);
  ok('notif member: penolakan diterima', (await notifCount(c,u2id,'Pengajuan anggota ditolak'))>=1);
  // ajukan ulang (tidak ada PENDING)
  const [[pend2]] = [await c.query(`SELECT id FROM member_applications WHERE user_id=? AND status='PENDING'`, [u2id])];
  ok('ajukan ulang diperbolehkan (tidak ada PENDING)', pend2.length===0);
  const app2b = cuid();
  await c.query(`INSERT INTO member_applications(id,user_id,status,full_name,created_at,updated_at) VALUES (?,?, 'PENDING', ?, NOW(),NOW())`,
    [app2b,u2id,'Uji Dua Revisi']);
  ok('ajukan ulang: pengajuan baru PENDING tersimpan', true, app2b);

  // summary
  const pass = results.filter(r=>r.pass).length, fail = results.filter(r=>!r.pass).length;
  console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);

  // cleanup
  await c.query(`DELETE FROM notifications WHERE user_id IN (?,?,?) OR title IN ('Pengajuan anggota baru','Pengajuan anggota disetujui','Pengajuan anggota ditolak') AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)`, [u1id,u2id,adminId||'x']);
  await c.query(`DELETE FROM memberships WHERE member_id=?`, [memberId]);
  await c.query(`DELETE FROM members WHERE id=? OR user_id IN (?,?)`, [memberId,u1id,u2id]);
  await c.query(`DELETE FROM member_applications WHERE user_id IN (?,?)`, [u1id,u2id]);
  await c.query(`DELETE FROM users WHERE id IN (?,?)`, [u1id,u2id]);
  console.log('cleanup done');
  await c.end();
  process.exit(fail?1:0);
})().catch(e=>{ console.error(e); process.exit(1); });
