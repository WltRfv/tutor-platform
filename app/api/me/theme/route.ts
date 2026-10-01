import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const VALID_THEMES = ['light', 'dark'] as const;
const VALID_DARK_ACCENTS = ['dark-classic', 'dark-slate', 'dark-emerald'] as const;

type Body = {
  theme?: string;
  accentDark?: string;
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { theme: true, accentDark: true },
  });

  return NextResponse.json({
    theme: user?.theme ?? null,
    accentDark: user?.accentDark ?? null,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const data: { theme?: string; accentDark?: string } = {};

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme as any)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }
    data.theme = body.theme;
  }

  if (body.accentDark !== undefined) {
    if (!VALID_DARK_ACCENTS.includes(body.accentDark as any)) {
      return NextResponse.json({ error: 'Invalid accentDark' }, { status: 400 });
    }
    data.accentDark = body.accentDark;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return NextResponse.json({ success: true });
}