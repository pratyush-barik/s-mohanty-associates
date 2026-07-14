import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

/**
 * Middleware using lightweight auth config (no Prisma/pg imports).
 * Route protection logic is in auth.config.ts → callbacks.authorized
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
