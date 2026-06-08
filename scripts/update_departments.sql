-- 예원예술대학교 부서 구조 업데이트
-- 기존 부서 이름/코드 갱신 및 신규 부서 추가

-- 1. 기존 부서 업데이트 (이름 정정 포함)
UPDATE "Department" SET name = '교학지원처', code = 'ACADEMIC', "sortOrder" = 30, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '3e0b42f2-7f0e-42b0-9533-0007e6b6a3bc';
UPDATE "Department" SET name = '기획조정처', code = 'PLANNING', "sortOrder" = 40, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '67af6863-efea-40e2-818c-0c0a78dc7d21';
UPDATE "Department" SET name = '행정지원처', code = 'ADMIN', "sortOrder" = 50, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '297bec42-b9d0-4072-acec-c00b01ca2773';
UPDATE "Department" SET name = '법인사무국', code = 'LEGAL', "sortOrder" = 20, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '7e5fa9bb-1421-46b9-80b3-fa3293536427';
UPDATE "Department" SET name = '산학협력단', code = 'INDUSTRY', "sortOrder" = 70, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '33005c82-82c8-430f-93d1-219a7faf7d2b';
-- 입학홍보처는 행정지원처로 소관부서 이전 후 제거 또는 유지 (일단 코드만 정비)
UPDATE "Department" SET name = '입학홍보처', code = 'ADMISSIONS', "sortOrder" = 55, "updatedAt" = CURRENT_TIMESTAMP WHERE id = '65476709-5b33-4b6b-b27a-d7a476026659';

-- 2. 신규 부서 추가 (총장직속 그룹)
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-president-001', '총장직속', 'PRESIDENT', 10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-secretary-001', '비서실', 'SECRETARY', 11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-audit-001', '감사실', 'AUDIT', 12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-humanrights-001', '인권센터', 'HUMANRIGHTS', 13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. 대학원, 국제교류협력단 추가
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-graduate-001', '대학원', 'GRADUATE', 60, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-intl-001', '국제교류협력단', 'INTERNATIONAL', 80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. 부설기관 그룹
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-attached-org-001', '부설기관', 'ATTACHED_ORG', 90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-lifelong-001', '평생교육원', 'LIFELONG', 91, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. 부속기관 그룹
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-attached-inst-001', '부속기관', 'ATTACHED_INST', 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-dormitory-001', '학생생활관', 'DORMITORY', 101, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "Department" (id, name, code, "sortOrder", "createdAt", "updatedAt") VALUES ('dept-library-001', '정보도서관', 'LIBRARY', 102, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
