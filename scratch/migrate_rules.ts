import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import "dotenv/config";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

// 한글 첫 글자 초성 추출 함수
function getInitialSound(text: string): string {
  if (!text) return "ㄱ";
  // 공백 및 기호 제거하고 첫 번째 진짜 글자 탐색
  const cleanText = text.replace(/[^가-힣a-zA-Z0-9]/g, "");
  if (cleanText.length === 0) return "ㄱ";
  
  const char = cleanText.charAt(0);
  const code = char.charCodeAt(0) - 0xac00;
  
  if (code >= 0 && code < 11172) {
    const chooseongList = [
      "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
      "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"
    ];
    return chooseongList[Math.floor(code / 588)];
  }
  
  // 영문일 경우 대문자 반환, 그 외는 그냥 첫 글자 반환
  return char.toUpperCase();
}

// HTML 태그 제거 및 파일명 정제 함수
function cleanTitle(rawText: string): { title: string; fileNo: string | null } {
  // 예: "제 1 편 학교법인<a onclick ='url_location(this)' href='filedown.php?menu=366&amp;no=46558' class='data_down'>다운로드</a>"
  let title = rawText;
  let fileNo: string | null = null;
  
  // <a> 태그 제거 및 no 매칭
  const hrefMatch = rawText.match(/href=['"]filedown\.php\?menu=366&amp;no=(\d+)['"]/);
  if (hrefMatch) {
    fileNo = hrefMatch[1];
  }
  
  title = rawText.replace(/<[^>]*>/g, "").replace(/다운로드/g, "").trim();
  return { title, fileNo };
}

// 날짜 파싱 안전장치
function parseDate(dateStr: string | null): Date {
  if (!dateStr || dateStr === "0000-00-00" || dateStr.trim() === "") {
    return new Date("2024-03-01");
  }
  const cleanDate = dateStr.replace(/[^0-9-]/g, "");
  const parsed = new Date(cleanDate);
  return isNaN(parsed.getTime()) ? new Date("2024-03-01") : parsed;
}

// 규정명 성격에 맞게 소관부서 스마트 매핑
function getDepartmentId(title: string, depts: { [key: string]: string }): string {
  if (title.includes("산학") || title.includes("연구비") || title.includes("특허")) {
    return depts["산학협력단"];
  }
  if (title.includes("학칙") || title.includes("학사") || title.includes("수업") || title.includes("성적") || title.includes("장학") || title.includes("대학원")) {
    return depts["교학지원처"];
  }
  if (title.includes("인사") || title.includes("직제") || title.includes("급여") || title.includes("회계") || title.includes("정관")) {
    return depts["행정지원처"];
  }
  return depts["기획조정처"]; // 기본값
}

interface JSTreeNode {
  id: string;
  parent: string;
  text: string;
  type: string;
  a_attr?: {
    href: string;
    isfile: string;
    tree_order: string;
  };
  li_attr?: {
    "data-isfile": string;
    "data-birthday"?: string;
    "data-type"?: string;
  };
}

async function migrate() {
  console.log("🚀 Supabase PostgreSQL 데이터 이전(Migration) 작업을 시작합니다...");

  // 1. JSON 파일 로드
  const filePath = path.join(__dirname, "all_rules.json");
  if (!fs.existsSync(filePath)) {
    console.error("오류: all_rules.json 파일이 존재하지 않습니다. 먼저 fetch_all.ts를 기동하세요.");
    return;
  }
  
  const rawData = fs.readFileSync(filePath, "utf-8");
  const nodes: JSTreeNode[] = JSON.parse(rawData);
  console.log(`불러온 노드 개수: ${nodes.length}개`);

  // 2. 기존 데이터 초기화 (외래키 제약조건 고려 순서 정렬)
  console.log("🧹 기존 데이터베이스 테이블 비우는 중...");
  await prisma.attachment.deleteMany();
  await prisma.articleComparison.deleteMany();
  await prisma.article.deleteMany();
  await prisma.revision.deleteMany();
  await prisma.rule.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();
  console.log("초기화 완료.");

  // 3. 소관 부서 기본 생성
  console.log("🏢 기본 소관부서 생성 중...");
  const deptPlanning = await prisma.department.create({
    data: { name: "기획조정처", code: "DEPT_PLANNING", sortOrder: 1 }
  });
  const deptAcademic = await prisma.department.create({
    data: { name: "교학지원처", code: "DEPT_ACADEMIC", sortOrder: 2 }
  });
  const deptAdmin = await prisma.department.create({
    data: { name: "행정지원처", code: "DEPT_ADMIN", sortOrder: 3 }
  });
  const deptSanhak = await prisma.department.create({
    data: { name: "산학협력단", code: "DEPT_SANHAK", sortOrder: 4 }
  });
  
  const deptMap = {
    "기획조정처": deptPlanning.id,
    "교학지원처": deptAcademic.id,
    "행정지원처": deptAdmin.id,
    "산학협력단": deptSanhak.id
  };
  console.log("부서 생성 완료.");

  // 4. 폴더 노드 추출 및 카테고리 트리 구축
  console.log("🗂️ 카테고리 구조 매핑 및 생성 중...");
  const folderNodes = nodes.filter(n => n.type === "folder" || (n.a_attr && n.a_attr.isfile === "off"));
  
  // 루트가 아닌 진짜 대분류(parent: "1") 정렬 순서 보장
  folderNodes.sort((a, b) => {
    const aOrder = parseInt(a.a_attr?.tree_order || "0", 10);
    const bOrder = parseInt(b.a_attr?.tree_order || "0", 10);
    return aOrder - bOrder;
  });

  const categoryMap = new Map<string, string>(); // jstree ID -> Prisma Category UUID

  // 1단계: parent가 "1"인 노드들 (대분류 카테고리, depth: 1) 생성
  // (루트 "1"인 "예원예술대학교 규정집"은 데이터 분류가 모호하여 건너뛰고 자식을 depth 1로 처리)
  const rootGroupNodes = folderNodes.filter(n => n.parent === "1");
  for (const node of rootGroupNodes) {
    const cleanName = node.text.replace(/<[^>]*>/g, "").replace(/다운로드/g, "").trim();
    const cat = await prisma.category.create({
      data: {
        name: cleanName,
        depth: 1,
        sortOrder: parseInt(node.a_attr?.tree_order || "1", 10),
      }
    });
    categoryMap.set(node.id, cat.id);
  }

  // 2단계: 나머지 하위 폴더들 (중분류/소분류 카테고리, depth: 2 이상) 재귀적 구조 처리
  // parent가 categoryMap에 존재하는 자식 폴더들 순회
  let added = true;
  let currentDepth = 2;
  
  while (added && currentDepth <= 5) {
    added = false;
    const childGroupNodes = folderNodes.filter(n => {
      return !categoryMap.has(n.id) && categoryMap.has(n.parent);
    });
    
    for (const node of childGroupNodes) {
      const parentUuid = categoryMap.get(node.parent)!;
      const cleanName = node.text.replace(/<[^>]*>/g, "").replace(/다운로드/g, "").trim();
      const cat = await prisma.category.create({
        data: {
          name: cleanName,
          depth: currentDepth,
          parentId: parentUuid,
          sortOrder: parseInt(node.a_attr?.tree_order || "1", 10),
        }
      });
      categoryMap.set(node.id, cat.id);
      added = true;
    }
    currentDepth++;
  }
  console.log(`카테고리 생성 완료 (총 ${categoryMap.size}개 카테고리 트리 완성)`);

  // 5. 규정 파일 노드 추출 및 DB 적재
  console.log("📄 규정 파일 데이터 분석 및 적재 중...");
  const fileNodes = nodes.filter(n => n.type !== "folder" && n.a_attr && n.a_attr.isfile === "on");
  console.log(`규정 파일 개수: ${fileNodes.length}개`);

  let ruleCount = 0;
  for (const node of fileNodes) {
    const { title, fileNo } = cleanTitle(node.text);
    if (!fileNo) {
      // 파일 번호가 없으면 다운로드 링크가 깨진 노드이므로 스킵하거나 로깅
      console.log(`경고: 다운로드 번호가 없는 파일 스킵 (${title})`);
      continue;
    }
    
    // 이 파일이 소속될 카테고리 찾기
    // 만약 부모 폴더가 카테고리 맵에 없으면 루트 대분류 중 아무데나 매핑하거나 기획조정 카테고리에 귀속
    let categoryId = categoryMap.get(node.parent);
    if (!categoryId) {
      // 차선책으로 대분류 중 첫 번째 카테고리로 매핑
      const firstCat = Array.from(categoryMap.values())[0];
      if (firstCat) {
        categoryId = firstCat;
      } else {
        console.log(`경고: 카테고리가 존재하지 않아 생성 스킵 (${title})`);
        continue;
      }
    }

    // 소관 부서 판정
    const departmentId = getDepartmentId(title, deptMap);

    // 규정 번호 파싱 (예: "2-0-2 예원예술대학교 학칙" -> "제2-0-2호")
    const numMatch = title.match(/^([0-9-]+)/);
    let ruleNumber = `제REG-${node.id}호`;
    let displayTitle = title;
    
    if (numMatch) {
      ruleNumber = `제${numMatch[1]}호`;
      displayTitle = title.replace(/^[0-9-\s]+/, "").trim(); // 타이틀에서 앞의 숫자 분류 제거
    }

    try {
      // 1) Rule 생성
      const rule = await prisma.rule.create({
        data: {
          title: displayTitle,
          ruleNumber: ruleNumber,
          initialSound: getInitialSound(displayTitle),
          status: "EFFECTIVE",
          categoryId: categoryId,
          departmentId: departmentId,
        }
      });

      // 2) 제/개정 연혁 Revision 생성
      const isAmendment = node.li_attr?.["data-type"] === "개정";
      const revDate = parseDate(node.li_attr?.["data-birthday"] || null);
      
      const revision = await prisma.revision.create({
        data: {
          ruleId: rule.id,
          version: isAmendment ? 2 : 1,
          versionName: node.li_attr?.["data-type"] || "제정",
          revisionType: isAmendment ? "AMENDMENT" : "ENACTMENT",
          enactmentDate: revDate,
          effectiveDate: revDate,
          announcementNumber: isAmendment ? "개정공포" : "최초공포",
          description: `${displayTitle} ${node.li_attr?.["data-type"] || "제정"} 완료 (홈페이지 공시 반영)`
        }
      });

      // 3) 첨부파일 Attachment 생성
      const fileUrl = `https://yewon.ac.kr/main/filedown.php?menu=366&no=${fileNo}`;
      await prisma.attachment.create({
        data: {
          ruleId: rule.id,
          title: `${displayTitle}.${node.type}`,
          fileUrl: fileUrl,
          fileType: node.type,
          fileSize: null
        }
      });

      ruleCount++;
    } catch (e: any) {
      // 유니크 제약조건(ruleNumber 중복 등) 오류 시 예외 처리
      if (e.code === "P2002") {
        try {
          // 중복 발생 시 ruleNumber 뒤에 일련번호 붙여 우회 생성
          const displayTitleUnique = displayTitle;
          const ruleNumberUnique = ruleNumber.replace("호", `-${node.id}호`);
          
          const rule = await prisma.rule.create({
            data: {
              title: displayTitleUnique,
              ruleNumber: ruleNumberUnique,
              initialSound: getInitialSound(displayTitleUnique),
              status: "EFFECTIVE",
              categoryId: categoryId,
              departmentId: departmentId,
            }
          });
          
          const revDate = parseDate(node.li_attr?.["data-birthday"] || null);
          await prisma.revision.create({
            data: {
              ruleId: rule.id,
              version: 1,
              versionName: node.li_attr?.["data-type"] || "제정",
              revisionType: "ENACTMENT",
              enactmentDate: revDate,
              effectiveDate: revDate,
              announcementNumber: "공포",
              description: `${displayTitleUnique} 제정/반영`
            }
          });
          
          await prisma.attachment.create({
            data: {
              ruleId: rule.id,
              title: `${displayTitleUnique}.${node.type}`,
              fileUrl: `https://yewon.ac.kr/main/filedown.php?menu=366&no=${fileNo}`,
              fileType: node.type
            }
          });
          ruleCount++;
        } catch (innerError) {
          console.error(`실패: ${title} 삽입 중 에러`, innerError);
        }
      } else {
        console.error(`실패: ${title} 삽입 중 에러`, e);
      }
    }
  }

  console.log(`\n🎉 마이그레이션이 성공적으로 완료되었습니다!`);
  console.log(`- 생성된 소관 부서: 4개`);
  console.log(`- 생성된 카테고리: ${categoryMap.size}개`);
  console.log(`- 생성된 실제 규정 목록: ${ruleCount}개`);
}

migrate()
  .catch(e => {
    console.error("마이그레이션 도중 예외 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
