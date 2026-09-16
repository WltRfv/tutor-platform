import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnStudent = nextUrl.pathname.startsWith('/student');
      const isOnTeacher = nextUrl.pathname.startsWith('/teacher');
      if (isOnStudent || isOnTeacher) {
        if (isLoggedIn) {
          const role = (auth?.user as any)?.role;
          if (isOnStudent && role !== 'STUDENT') return false;
          if (isOnTeacher && role !== 'TEACHER') return false;
          return true;
        }
        return false;
      }
      return true;
    },
  },
};