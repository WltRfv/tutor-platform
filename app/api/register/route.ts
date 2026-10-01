import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { getSubjectCode } from '@/lib/subjects';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  messengerType: z.enum(['telegram', 'whatsapp', 'max', 'vk', 'other']),
  messengerHandle: z.string().min(2),
  selections: z
    .array(
      z.object({
        grade: z.number().int().min(1).max(11),
        categories: z.array(z.string()).min(1),
      })
    )
    .min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });
    }

    // Собираем коды предметов и уникальные классы
    const subjectCodesSet = new Set<string>();
    const gradesSet = new Set<number>();

    for (const sel of data.selections) {
      gradesSet.add(sel.grade);
      for (const catId of sel.categories) {
        const code = getSubjectCode(catId, sel.grade);
        if (code) subjectCodesSet.add(code);
      }
    }

    const subjectCodes = Array.from(subjectCodesSet);
    const uniqueGrades = Array.from(gradesSet).sort((a, b) => a - b);

    if (subjectCodes.length === 0) {
      return NextResponse.json(
        { error: 'Не выбрано ни одного предмета' },
        { status: 400 }
      );
    }

    const subjects = await prisma.subjects.findMany({
      where: { code: { in: subjectCodes } },
      select: { id: true, code: true },
    });

    if (subjects.length === 0) {
      return NextResponse.json({ error: 'Предметы не найдены' }, { status: 400 });
    }

    const hash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        grade: uniqueGrades[0] ?? null,
        grades: uniqueGrades,
        messengerType: data.messengerType,
        messengerHandle: data.messengerHandle,
        status: 'PENDING',
      },
    });

    await prisma.userSubject.createMany({
      data: subjects.map((s) => ({
        userId: user.id,
        subjectId: s.id,
        addedBy: 'AUTO',
      })),
    });

    await sendTelegramNotification(
      `🔔 <b>Новая заявка</b>\n\n` +
        `👤 ${data.name}\n` +
        `📧 ${data.email}\n` +
        `📚 Классы: ${uniqueGrades.join(', ')}\n` +
        `💬 ${data.messengerType}: ${data.messengerHandle}\n` +
        `📖 Предметы: ${subjects.map((s) => s.code).join(', ')}`
    );

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}