import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth as Session | null;
  const role = session?.user?.role;

  const isProtected =
    pathname.startsWith('/student') || pathname.startsWith('/teacher');

  if (!isProtected) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/student') && role === 'TEACHER') {
    return NextResponse.redirect(new URL('/teacher', req.url));
  }

  if (pathname.startsWith('/teacher') && role === 'STUDENT') {
    return NextResponse.redirect(new URL('/student', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Исключаем из проверки:
     * - /_next/static (статические файлы)
     * - /_next/image (оптимизация изображений)
     * - /api/auth (эндпоинты NextAuth)
     * - favicon.ico (иконка сайта)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
}