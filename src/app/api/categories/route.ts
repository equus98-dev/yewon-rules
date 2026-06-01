// export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 초정밀 접속 설정 객체
const poolConfig = {
  host: "aws-1-ap-northeast-1.pooler.supabase.com",
  port: 6543,
  user: "postgres.jagpwxgasudlnaoxfroe",
  password: "Tmtmfh0022$&*",
  database: "postgres",
  ssl: {
    rejectUnauthorized: false
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "field"; // field, dept, abc

    // 1. 분야별 규정 트리 조회
    if (type === "field") {
      
      try {
        const rCats = await pool.query('SELECT id, name, "parentId", "sortOrder" FROM "Category" ORDER BY "sortOrder" ASC');
        const rRules = await pool.query('SELECT id, title, "ruleNumber", status, "categoryId" FROM "Rule" ORDER BY "ruleNumber" ASC');
        

        const categories = rCats.rows;
        const rules = rRules.rows;

        // 조립을 위한 맵 생성
        const categoryMap = new Map<string, any>();
        categories.forEach((cat) => {
          categoryMap.set(cat.id, {
            id: `cat-${cat.id}`,
            name: cat.name,
            type: "folder",
            parentId: cat.parentId,
            sortOrder: cat.sortOrder,
            children: [],
            rawRules: [] // 카테고리별 규정 리스트 임시 저장
          });
        });

        // 규정들을 카테고리에 할당
        // 먼저 rules를 자연 정렬(Natural Sort)하여 '2-0-2'가 '2-0-10'보다 앞에 오게 함
        rules.sort((a, b) => {
          if (!a.ruleNumber) return 1;
          if (!b.ruleNumber) return -1;
          return a.ruleNumber.localeCompare(b.ruleNumber, undefined, { numeric: true, sensitivity: 'base' });
        });

        rules.forEach((rule) => {
          if (rule.categoryId) {
            const catNode = categoryMap.get(rule.categoryId);
            if (catNode) {
              catNode.rawRules.push({
                id: rule.id,
                name: `${rule.ruleNumber} ${rule.title}`,
                type: "file",
                status: rule.status,
              });
            }
          }
        });

        // 카테고리 계층 구조 생성
        const rootNodes: any[] = [];
        categories.forEach((cat) => {
          const node = categoryMap.get(cat.id);
          if (cat.parentId) {
            const parentNode = categoryMap.get(cat.parentId);
            if (parentNode) {
              parentNode.children.push(node);
            }
          } else {
            rootNodes.push(node);
          }
        });

        // 최종 트리 구조로 포맷팅 (자식 카테고리를 앞에, 규정 파일을 뒤에 배치)
        function formatNode(node: any): any {
          const childCategories = node.children.map((child: any) => formatNode(child));
          const fileNodes = node.rawRules;
          return {
            id: node.id,
            name: node.name,
            type: "folder",
            children: [...childCategories, ...fileNodes],
          };
        }

        const treeData = rootNodes.map((node) => formatNode(node));
        return NextResponse.json(treeData);
      } catch (err: any) {
        
        throw err;
      }
    }

    // 2. 소관부서별 규정 트리 조회
    if (type === "dept") {
      
      try {
        const rDepts = await pool.query('SELECT id, name, "sortOrder" FROM "Department" ORDER BY "sortOrder" ASC');
        const rRules = await pool.query('SELECT id, title, "ruleNumber", status, "departmentId" FROM "Rule" ORDER BY title ASC');
        

        const depts = rDepts.rows;
        const rules = rRules.rows;

        const treeData = depts.map((dept) => ({
          id: `dept-${dept.id}`,
          name: dept.name,
          type: "folder",
          children: rules
            .filter((rule) => rule.departmentId === dept.id)
            .map((rule) => ({
              id: rule.id,
              name: `${rule.title} (${rule.ruleNumber})`,
              type: "file",
              status: rule.status,
            })),
        }));

        return NextResponse.json(treeData);
      } catch (err: any) {
        
        throw err;
      }
    }

    // 3. 가나다순 규정 트리 조회
    if (type === "abc") {
      
      try {
        const rRules = await pool.query('SELECT id, title, "ruleNumber", "initialSound", status FROM "Rule" ORDER BY title ASC');
        

        const rules = rRules.rows;

        const groups: { [key: string]: any[] } = {};
        const chosungOrder = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
        
        chosungOrder.forEach((char) => {
          groups[char] = [];
        });
        groups["기타"] = [];

        rules.forEach((rule) => {
          const sound = rule.initialSound;
          if (groups[sound]) {
            groups[sound].push(rule);
          } else {
            groups["기타"].push(rule);
          }
        });

        const treeData = chosungOrder
          .map((char) => ({
            id: `abc-${char}`,
            name: `${char} (${groups[char].length})`,
            type: "folder",
            children: groups[char].map((rule) => ({
              id: rule.id,
              name: `${rule.title} (${rule.ruleNumber})`,
              type: "file",
              status: rule.status,
            })),
          }))
          .filter((group) => group.children.length > 0);

        if (groups["기타"].length > 0) {
          treeData.push({
            id: "abc-etc",
            name: `기타 (${groups["기타"].length})`,
            type: "folder",
            children: groups["기타"].map((rule) => ({
              id: rule.id,
              name: `${rule.title} (${rule.ruleNumber})`,
              type: "file",
              status: rule.status,
            })),
          });
        }

        return NextResponse.json(treeData);
      } catch (err: any) {
        
        throw err;
      }
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("[Categories API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
