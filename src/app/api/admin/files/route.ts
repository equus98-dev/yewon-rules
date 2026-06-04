import { NextResponse } from "next/server";
import { createPool } from "@/lib/db";
import { writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function GET(request: Request) {
  const pool = createPool();
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("ruleId");

    if (!ruleId) {
      return NextResponse.json({ error: "Missing ruleId" }, { status: 400 });
    }

    const res = await pool.query(
      `SELECT id, title, "fileUrl", "fileSize", "fileType", "createdAt" 
       FROM "Attachment" 
       WHERE "ruleId" = $1
       ORDER BY "createdAt" ASC`,
      [ruleId]
    );

    return NextResponse.json(res.rows);
  } catch (error: any) {
    console.error("[Admin Files API GET Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

export async function POST(request: Request) {
  const pool = createPool();
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const ruleId = formData.get("ruleId") as string;
    const attachmentId = formData.get("attachmentId") as string | null;

    if (!file || !ruleId) {
      return NextResponse.json({ error: "Missing file or ruleId" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Create unique filename to prevent cache issues and overwrites
    const uniqueSuffix = crypto.randomBytes(6).toString("hex");
    const originalName = file.name;
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);
    const newFileName = `${basename}_${uniqueSuffix}${extension}`;
    
    // Save to public/files/rules
    const uploadDir = path.join(process.cwd(), "public", "files", "rules");
    const filePath = path.join(uploadDir, newFileName);
    
    // Ensure directory exists (in production, we assume it's created, but good to be safe)
    try {
      await writeFile(filePath, buffer);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        const fs = require('fs');
        fs.mkdirSync(uploadDir, { recursive: true });
        await writeFile(filePath, buffer);
      } else {
        throw e;
      }
    }

    const fileUrl = `/files/rules/${encodeURIComponent(newFileName)}`;
    const fileSize = file.size;
    const fileType = extension.replace(".", "");

    let resultId = attachmentId;

    if (attachmentId) {
      // 교체 (Replace existing attachment)
      await pool.query(
        `UPDATE "Attachment" 
         SET "fileUrl" = $1, "fileSize" = $2, "fileType" = $3, "updatedAt" = NOW() 
         WHERE id = $4`,
        [fileUrl, fileSize, fileType, attachmentId]
      );
    } else {
      // 신규 추가 (Add new attachment)
      resultId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO "Attachment" (id, "ruleId", title, "fileUrl", "fileSize", "fileType", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        [resultId, ruleId, basename, fileUrl, fileSize, fileType]
      );
    }

    return NextResponse.json({ success: true, id: resultId, fileUrl });
  } catch (error: any) {
    console.error("[Admin Files API POST Error]:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  } finally {
    await pool.end();
  }
}
