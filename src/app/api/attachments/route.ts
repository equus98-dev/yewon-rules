export const runtime = "edge";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const attachments = await prisma.attachment.findMany({
      include: {
        rule: {
          select: {
            title: true,
            ruleNumber: true,
          },
        },
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json(attachments);
  } catch (error: any) {
    console.error("[Attachments API Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
