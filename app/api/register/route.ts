import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';
import { categoriesToSubjectCodes } from '@/lib/subjects';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  grade: z.number().int().min(1).max(11),
  phone: z.string().min(3),
  categories: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });
    }

    // Категории → коды предметов
    const subjectCodes = categoriesToSubjectCodes(data.categories, data.grade);
    if (subjectCodes.length === 0) {
      return NextResponse.json(
        { error: 'Выбраны категории, недоступные для этого класса' },
        { status: 400 }
      );
    }

    // Находим ID предметов в БД
    const subjects = await prisma.subjects.findMany({
      where: { code: { in: subjectCodes } },
      select: { id: true, code: true },
    });

    if (subjects.length === 0) {
      return NextResponse.json({ error: 'Предметы не найдены' }, { status: 400 });
    }

    const hash = await bcrypt.hash(data.password, 12);

    // Создаём пользователя
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        grade: data.grade,
        phone: data.phone,
        status: 'PENDING',
      },
    });

    // Привязываем предметы
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
        `📚 Класс: ${data.grade}\n` +
        `💬 Связь: ${data.phone}\n` +
        `📖 Предметы: ${subjects.map((s) => s.code).join(', ')}`
    );

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}