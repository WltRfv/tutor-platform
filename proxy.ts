import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  const isProtected =
    pathname.startsWith('/student') || pathname.startsWith('/teacher');

  if (!isProtected) return NextResponse.next();

  // Не авторизован → на логин
  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Учитель попал на /student → отправляем в /teacher
  if (pathname.startsWith('/student') && role === 'TEACHER') {
    return NextResponse.redirect(new URL('/teacher', req.url));
  }

  // Ученик попал на /teacher → отправляем в /student
  if (pathname.startsWith('/teacher') && role === 'STUDENT') {
    return NextResponse.redirect(new URL('/student', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/student/:path*', '/teacher/:path*'],
};