// 예원예술대학교 부서 데이터 갱신 스크립트 (pg 패키지 사용)
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 정의할 부서 목록 (계층 구조 반영)
// parentCode: 상위 부서 코드 (null이면 최상위)
const DEPARTMENTS = [
  // 총장직속
  { name: '총장직속', code: 'PRESIDENT', sortOrder: 10, parentCode: null },
  { name: '비서실', code: 'SECRETARY', sortOrder: 11, parentCode: 'PRESIDENT' },
  { name: '감사실', code: 'AUDIT', sortOrder: 12, parentCode: 'PRESIDENT' },
  { name: '인권센터', code: 'HUMANRIGHTS', sortOrder: 13, parentCode: 'PRESIDENT' },
  // 법인사무국
  { name: '법인사무국', code: 'LEGAL', sortOrder: 20, parentCode: null },
  // 교학지원처
  { name: '교학지원처', code: 'ACADEMIC', sortOrder: 30, parentCode: null },
  // 기획조정처
  { name: '기획조정처', code: 'PLANNING', sortOrder: 40, parentCode: null },
  // 행정지원처
  { name: '행정지원처', code: 'ADMIN', sortOrder: 50, parentCode: null },
  // 대학원
  { name: '대학원', code: 'GRADUATE', sortOrder: 60, parentCode: null },
  // 산학협력단
  { name: '산학협력단', code: 'INDUSTRY', sortOrder: 70, parentCode: null },
  // 국제교류협력단
  { name: '국제교류협력단', code: 'INTERNATIONAL', sortOrder: 80, parentCode: null },
  // 부설기관
  { name: '부설기관', code: 'ATTACHED_ORG', sortOrder: 90, parentCode: null },
  { name: '평생교육원', code: 'LIFELONG', sortOrder: 91, parentCode: 'ATTACHED_ORG' },
  // 부속기관
  { name: '부속기관', code: 'ATTACHED_INST', sortOrder: 100, parentCode: null },
  { name: '학생생활관', code: 'DORMITORY', sortOrder: 101, parentCode: 'ATTACHED_INST' },
  { name: '정보도서관', code: 'LIBRARY', sortOrder: 102, parentCode: 'ATTACHED_INST' },
];

async function main() {
  const client = await pool.connect();
  try {
    // 1. 현재 부서 목록 조회
    const existing = await client.query('SELECT id, name, code FROM "Department"');
    console.log('현재 부서 목록:');
    existing.rows.forEach(r => console.log(`  [${r.code || 'null'}] ${r.name} (id: ${r.id})`));

    // 2. code 기준으로 매핑: code별 기존 id 맵
    const codeToId = {};
    existing.rows.forEach(r => {
      if (r.code) codeToId[r.code] = r.id;
    });

    // 3. 각 부서 upsert (code 기준)
    console.log('\n부서 데이터 업데이트 시작...');
    
    for (const dept of DEPARTMENTS) {
      const existingById = existing.rows.find(r => r.code === dept.code);
      if (existingById) {
        // UPDATE: 이름, sortOrder 갱신
        await client.query(
          `UPDATE "Department" SET name = $1, "sortOrder" = $2, "updatedAt" = NOW() WHERE code = $3`,
          [dept.name, dept.sortOrder, dept.code]
        );
        console.log(`  [UPDATE] ${dept.name} (code: ${dept.code})`);
      } else {
        // INSERT: 새 부서
        const newId = require('crypto').randomUUID();
        await client.query(
          `INSERT INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, NOW(), NOW())`,
          [newId, dept.name, dept.code, dept.sortOrder]
        );
        codeToId[dept.code] = newId;
        console.log(`  [INSERT] ${dept.name} (code: ${dept.code}, id: ${newId})`);
      }
    }

    // 4. 최종 확인
    const final = await client.query('SELECT id, name, code, "sortOrder" FROM "Department" ORDER BY "sortOrder" ASC');
    console.log('\n최종 부서 목록:');
    final.rows.forEach(r => console.log(`  [${r.sortOrder}] ${r.name} (${r.code})`));
    
    console.log('\n✅ 부서 데이터 갱신 완료!');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
