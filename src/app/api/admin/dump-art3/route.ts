import { NextResponse } from "next/server";
import { getD1 } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const db = getD1();
        const res = await db.prepare(`SELECT id, articleNumber, title, contentJson FROM Article WHERE articleNumber IN (3, 3.2) OR title LIKE '%학부(과) 및 정원%' OR title LIKE '%편제%'`).all();
        
        return NextResponse.json({ success: true, articles: res.results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
