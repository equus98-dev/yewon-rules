export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    ok: true, 
    message: "ping successful! Next.js Edge Runtime is working perfectly." 
  });
}
