export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "field"; // field, dept, abc

    // 1. 분야별 규정 트리 조회
    if (type === "field") {
      const categories = await prisma.category.findMany({
        where: { parentId: null },
        include: {
          rules: {
            select: {
              id: true,
              title: true,
              ruleNumber: true,
              status: true,
            },
            orderBy: { title: "asc" },
          },
          children: {
            orderBy: { sortOrder: "asc" },
            include: {
              rules: {
                select: {
                  id: true,
                  title: true,
                  ruleNumber: true,
                  status: true,
                },
                orderBy: { title: "asc" },
              },
              children: {
                orderBy: { sortOrder: "asc" },
                include: {
                  rules: {
                    select: {
                      id: true,
                      title: true,
                      ruleNumber: true,
                      status: true,
                    },
                    orderBy: { title: "asc" },
                  },
                },
              },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      // MUI TreeView에 매핑할 트리 구조로 변환
      const treeData = categories.map((cat) => formatCategoryToNode(cat));
      return NextResponse.json(treeData);
    }

    // 2. 소관부서별 규정 트리 조회
    if (type === "dept") {
      const departments = await prisma.department.findMany({
        include: {
          rules: {
            select: {
              id: true,
              title: true,
              ruleNumber: true,
              status: true,
            },
            orderBy: { title: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      });

      const treeData = departments.map((dept) => ({
        id: `dept-${dept.id}`,
        name: dept.name,
        type: "folder",
        children: dept.rules.map((rule) => ({
          id: rule.id,
          name: `${rule.title} (${rule.ruleNumber})`,
          type: "file",
          status: rule.status,
        })),
      }));

      return NextResponse.json(treeData);
    }

    // 3. 가나다순 규정 트리 조회
    if (type === "abc") {
      const rules = await prisma.rule.findMany({
        select: {
          id: true,
          title: true,
          ruleNumber: true,
          initialSound: true,
          status: true,
        },
        orderBy: { title: "asc" },
      });

      // 초성별 그룹화
      const groups: { [key: string]: typeof rules } = {};
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
        .filter((group) => group.children.length > 0); // 규정이 존재하는 초성 폴더만 표시

      // 기타 그룹 추가 (존재하는 경우)
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
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("[Categories API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

// 분야별 Category 데이터를 트리 노드 형식으로 변환하는 재귀적 헬퍼 함수
function formatCategoryToNode(cat: any): any {
  const childrenNodes = (cat.children || []).map((child: any) => formatCategoryToNode(child));
  const ruleNodes = (cat.rules || []).map((rule: any) => ({
    id: rule.id,
    name: `${rule.title} (${rule.ruleNumber})`,
    type: "file",
    status: rule.status,
  }));

  return {
    id: `cat-${cat.id}`,
    name: cat.name,
    type: "folder",
    children: [...childrenNodes, ...ruleNodes],
  };
}
