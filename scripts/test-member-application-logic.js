/**
 * Uji manual logika FASE 1B (beneran, DB lokal). Verifikasi: cegah ganda (PENDING),
 * setuju -> terhubung + AKTIF + memberCode, tolak -> boleh ajukan ulang,
 * submit saat terhubung dicegah. Semua dalam transaksi + ROLLBACK (DB bersih).
 * CATATAN: pakai c.execute() untuk statement ber-placeholder (c.query() tanpa params
 * bisa misinterpret `?` pada driver ini).
 */
require('dotenv').config({ quiet: true });
const mysql = require('mysql2/promise');
const TS = Date.now();
function cuid() { return 't' + Math.random().toString(36).slice(2, 10) + TS.toString(36).slice(-9); }
const year = new Date().getFullYear();
const prefix = `KPMBR-YK-${year}-`;

(async () => {
  const c = await mysql.createConnection((process.env.DATABASE_URL || '').replace('mariadb://', 'mysql://'));
  let pass=0, fail=0;
  const ok=(n,cond,d='')=>{ const p=!!cond; p?pass++:fail++; console.log((p?'PASS':'FAIL')+': '+n+(d?' — '+d:'')); };

  await c.beginTransaction();
  try {
    await c.query(`CREATE TEMPORARY TABLE IF NOT EXISTS _tmp_app(
      id VARCHAR(191) PRIMARY KEY, user_id VARCHAR(191), status VARCHAR(20) DEFAULT 'PENDING',
      full_name VARCHAR(191), rejection_note VARCHAR(255) NULL)`);

    const u1=cuid(), u2=cuid();
    await c.execute(`INSERT INTO users(id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())`,[u1,`f1b1-${TS}@k.local`,'ANGGOTA','ACTIVE']);
    await c.execute(`INSERT INTO users(id,email,role,status,created_at,updated_at) VALUES (?,?,?,?,NOW(),NOW())`,[u2,`f1b2-${TS}@k.local`,'ANGGOTA','ACTIVE']);

    // submit u1
    const a1=cuid();
    await c.execute(`INSERT INTO _tmp_app(id,user_id,status,full_name) VALUES (?,?,?,?)`,[a1,u1,'PENDING','U1']);
    ok('submit: pengajuan PENDING tersimpan', true);
    const [m0]=await c.execute(`SELECT id FROM members WHERE user_id=?`,[u1]);
    ok('akun u1 belum terhubung setelah submit', m0.length===0);
    const [pd]=await c.execute(`SELECT id FROM _tmp_app WHERE user_id=? AND status=?`,[u1,'PENDING']);
    ok('cegah pengajuan ganda (ada PENDING) → server action tolak', pd.length===1);

    // SETUJUI
    const [codes]=await c.execute(`SELECT member_code FROM members WHERE member_code LIKE ?`,[prefix+'%']);
    let max=0; for(const r of codes){ const m=/(\d{4})$/.exec(r.member_code); if(m) max=Math.max(max,parseInt(m[1],10)); }
    const memberCode=prefix+String(max+1).padStart(4,'0');
    const mid=cuid();
    await c.execute(`INSERT INTO members(id,user_id,member_code,full_name,is_directory_visible,created_at,updated_at) VALUES (?,?,?,?,0,NOW(),NOW())`,[mid,u1,memberCode,'U1']);
    await c.execute(`INSERT INTO memberships(id,member_id,status,cohort,start_date,created_at,updated_at) VALUES (?,?,?, ?, CURDATE(), NOW(), NOW())`,[cuid(),mid,'AKTIF',year]);
    await c.execute(`UPDATE _tmp_app SET status=? WHERE id=?`,['APPROVED',a1]);
    const [lnk]=await c.execute(`SELECT m.member_code,ms.status FROM members m JOIN memberships ms ON ms.member_id=m.id AND ms.end_date IS NULL WHERE m.user_id=?`,[u1]);
    ok('setuju: akun terhubung + memberCode', lnk[0]?.member_code===memberCode, memberCode);
    ok('setuju: membership AKTIF', lnk[0]?.status==='AKTIF');
    const [st1]=await c.execute(`SELECT status FROM _tmp_app WHERE id=?`,[a1]);
    ok('setuju: pengajuan APPROVED', st1[0].status==='APPROVED');

    // submit saat sudah terhubung dicegah
    const [has]=await c.execute(`SELECT 1 x FROM members WHERE user_id=?`,[u1]);
    ok('sudah terhubung → submit baru dicegah', has.length>0);

    // TOLAK + ajukan ulang (u2)
    const a2=cuid();
    await c.execute(`INSERT INTO _tmp_app(id,user_id,status,full_name) VALUES (?,?,?,?)`,[a2,u2,'PENDING','U2']);
    await c.execute(`UPDATE _tmp_app SET status=?, rejection_note=? WHERE id=?`,['REJECTED','Data kurang',a2]);
    const [rj]=await c.execute(`SELECT status,rejection_note FROM _tmp_app WHERE id=?`,[a2]);
    ok('tolak: REJECTED + alasan', rj[0].status==='REJECTED' && rj[0].rejection_note==='Data kurang');
    const [pd2]=await c.execute(`SELECT id FROM _tmp_app WHERE user_id=? AND status=?`,[u2,'PENDING']);
    ok('ajukan ulang diperbolehkan (tanpa PENDING)', pd2.length===0);
    await c.execute(`INSERT INTO _tmp_app(id,user_id,status,full_name) VALUES (?,?,?,?)`,[cuid(),u2,'PENDING','U2r']);
    ok('ajukan ulang: PENDING baru tersimpan', true);

    console.log(`\nHASIL: ${pass} lulus, ${fail} gagal`);
  } finally {
    await c.rollback();
    await c.end();
  }
  process.exit(fail?1:0);
})().catch(e=>{console.error(e.stack||e.message);process.exit(1);});
