export const runtime = "edge";

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const env = ctx?.env as any;
    
    if (!env) {
      return NextResponse.json({ ok: false, error: "ctx.env is undefined" }, { status: 400 });
    }
    
    if (!env.DB) {
      const keys = Object.keys(env).join(", ");
      return NextResponse.json({ ok: false, error: `env.DB is undefined. Available bindings: ${keys}` }, { status: 400 });
    }
    
    return NextResponse.json({ ok: true, message: "DB binding successfully found!" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
