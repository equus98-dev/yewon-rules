export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";

export async function GET(request: Request) {
  const pool = createPool();
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "field";

    if (type === "field") {
      const rCats = await pool.query('SELECT id, name, "parentId", "sortOrder" FROM "Category" ORDER BY "sortOrder" ASC');
      const rRules = await pool.query('SELECT id, title, "ruleNumber", status, "categoryId" FROM "Rule" ORDER BY "ruleNumber" ASC');

      const categories = rCats.rows;
      const rules = rRules.rows;

      const categoryMap = new Map<string, any>();
      categories.forEach((cat) => {
        categoryMap.set(cat.id, {
          id: `cat-${cat.id}`,
          name: cat.name,
          type: "folder",
          parentId: cat.parentId,
          sortOrder: cat.sortOrder,
          children: [],
          rawRules: [],
        });
      });

      rules.sort((a, b) => {
        if (!a.ruleNumber) return 1;
        if (!b.ruleNumber) return -1;
        return a.ruleNumber.localeCompare(b.ruleNumber, undefined, { numeric: true, sensitivity: "base" });
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

      const rootNodes: any[] = [];
      categories.forEach((cat) => {
        const node = categoryMap.get(cat.id);
        if (cat.parentId) {
          const parentNode = categoryMap.get(cat.parentId);
          if (parentNode) parentNode.children.push(node);
        } else {
          rootNodes.push(node);
        }
      });

      function formatNode(node: any): any {
        const childCategories = node.children.map((child: any) => formatNode(child));
        return {
          id: node.id,
          name: node.name,
          type: "folder",
          children: [...childCategories, ...node.rawRules],
        };
      }

      const formattedRootNodes = rootNodes.map((node) => formatNode(node));
      
      // 그룹화 로직 추가: "제3편 대학운영 (제1장 행정)" 형태를 상하위로 분리
      const groupedNodes: any[] = [];
      const parentMap = new Map<string, any>();

      formattedRootNodes.forEach((node) => {
        const match = node.name.match(/^(.*?)\s*\((.*?)\)$/);
        if (match) {
          const parentName = match[1].trim();
          const childName = match[2].trim();
          
          if (!parentMap.has(parentName)) {
            const newParent = {
              id: `virtual-${parentName}`,
              name: parentName,
              type: "folder",
              children: []
            };
            parentMap.set(parentName, newParent);
            groupedNodes.push(newParent);
          }
          
          parentMap.get(parentName).children.push({
            ...node,
            name: childName
          });
        } else {
          groupedNodes.push(node);
        }
      });

      return NextResponse.json(groupedNodes);
    }

    if (type === "dept") {
      const rDepts = await pool.query('SELECT id, name, "sortOrder" FROM "Department" ORDER BY "sortOrder" ASC');
      const rRules = await pool.query('SELECT id, title, "ruleNumber", status, "departmentId" FROM "Rule" ORDER BY title ASC');

      const treeData = rDepts.rows.map((dept) => ({
        id: `dept-${dept.id}`,
        name: dept.name,
        type: "folder",
        children: rRules.rows
          .filter((rule) => rule.departmentId === dept.id)
          .map((rule) => ({
            id: rule.id,
            name: `${rule.title} (${rule.ruleNumber})`,
            type: "file",
            status: rule.status,
          })),
      }));

      return NextResponse.json(treeData);
    }

    if (type === "abc") {
      const rRules = await pool.query('SELECT id, title, "ruleNumber", "initialSound", status FROM "Rule" ORDER BY title ASC');
      const rules = rRules.rows;

      const groups: { [key: string]: any[] } = {};
      const chosungOrder = ["ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
      chosungOrder.forEach((char) => { groups[char] = []; });
      groups["기타"] = [];

      rules.forEach((rule) => {
        const sound = rule.initialSound;
        if (groups[sound]) groups[sound].push(rule);
        else groups["기타"].push(rule);
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
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error: any) {
    console.error("[Categories API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
