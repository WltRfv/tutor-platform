import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'STUDENT' | 'TEACHER';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'STUDENT' | 'TEACHER';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'STUDENT' | 'TEACHER';
  }
}