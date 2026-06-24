import { NextResponse } from "next/server";
import { getD1 } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const db = getD1();
        const res = await db.prepare(`SELECT id, articleNumber, num, title, contentJson FROM Article WHERE articleNumber IN (71, 72)`).all();
        
        return NextResponse.json({ success: true, articles: res.results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message });
    }
}
