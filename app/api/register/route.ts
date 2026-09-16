import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendTelegramNotification } from '@/lib/telegram';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  grade: z.number().int().min(1).max(11),
  phone: z.string().min(5),
  subjects: z.array(z.string()).min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 400 });
    }

    const hash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hash,
        grade: data.grade,
        phone: data.phone,
        subjects: data.subjects as any,
        status: 'PENDING',
      },
    });

    await sendTelegramNotification(
      `🔔 <b>Новая заявка</b>\n\n` +
        `👤 ${data.name}\n` +
        `📧 ${data.email}\n` +
        `📚 Класс: ${data.grade}\n` +
        `💬 Связь: ${data.phone}\n` +
        `📖 Предметы: ${data.subjects.join(', ')}`
    );

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}