export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. 공지사항 전체 목록 조회 (GET)
export async function GET() {
  try {
    const notices = await prisma.notice.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notices);
  } catch (error: any) {
    console.error("[Notice GET API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. 신규 공지사항 작성 (POST)
export async function POST(request: Request) {
  try {
    const { title, content, dept, date } = await request.json();

    if (!title || !content || !dept || !date) {
      return NextResponse.json(
        { error: "필수 입력 항목(제목, 내용, 부서, 일자)이 누락되었습니다." },
        { status: 400 }
      );
    }

    const newNotice = await prisma.notice.create({
      data: {
        title,
        content,
        dept,
        date,
      },
    });

    return NextResponse.json(newNotice, { status: 201 });
  } catch (error: any) {
    console.error("[Notice POST API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 3. 기존 공지사항 수정 (PUT)
export async function PUT(request: Request) {
  try {
    const { id, title, content, dept, date } = await request.json();

    if (!id || !title || !content || !dept || !date) {
      return NextResponse.json(
        { error: "필수 수정 항목이 누락되었습니다." },
        { status: 400 }
      );
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        dept,
        date,
      },
    });

    return NextResponse.json(updatedNotice);
  } catch (error: any) {
    console.error("[Notice PUT API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 4. 공지사항 삭제 (DELETE)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "삭제 대상 공지사항 ID가 필요합니다." },
        { status: 400 }
      );
    }

    await prisma.notice.delete({
      where: { id },
    });

    return NextResponse.json({ message: "공지사항이 성공적으로 삭제되었습니다." });
  } catch (error: any) {
    console.error("[Notice DELETE API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
