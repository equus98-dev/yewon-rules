import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
  const rule = await prisma.rule.findFirst({
    where: { title: { contains: '학교법인 감사규정' } },
    include: { currentRevision: { include: { articles: true } } }
  });
  if (!rule) return NextResponse.json({ error: 'not found' });
  const a19 = rule.currentRevision.articles.find(a => a.articleNumber === 19);
  return NextResponse.json({ a19 });
}
