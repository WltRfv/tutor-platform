import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { eventType, metadata } = await req.json();

  await prisma.activity.create({
    data: {
      userId: (session.user as any).id,
      eventType,
      metadata: metadata || {},
    },
  });

  return NextResponse.json({ ok: true });
}