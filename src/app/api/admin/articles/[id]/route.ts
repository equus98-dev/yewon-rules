// export const runtime = "edge";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { contentText, contentJson } = body;

    if (!contentText) {
      return NextResponse.json({ error: "Missing required field: contentText" }, { status: 400 });
    }

    await prisma.article.update({
      where: { id },
      data: { 
        contentText,
        contentJson: contentJson || {} // contentJson이 제공되지 않으면 기존 로직에 맞춰 처리
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin Article API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
