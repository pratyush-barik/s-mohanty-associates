import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

/**
 * Auth config WITHOUT Prisma adapter.
 * Used by middleware (Edge runtime) which can't load Node.js native modules.
 * The full auth config (with Prisma) is in auth.ts.
 */
export default {
  secret: process.env.AUTH_SECRET || 'fallback_secret_for_build_only_1234567890',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      // authorize is handled in the full auth.ts config
      authorize: () => null,
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const userRole = auth?.user?.role;
      const { pathname } = nextUrl;

      const authRoutes = ['/auth/login', '/auth/register', '/auth/forgot-password'];
      const dashboardRoutes = pathname.startsWith('/dashboard');
      const portalRoutes = pathname.startsWith('/portal');

      // Redirect logged-in users away from auth pages
      if (authRoutes.some((route) => pathname.startsWith(route))) {
        if (isLoggedIn) {
          const dest = userRole === 'CLIENT' ? '/dashboard' : '/portal/dashboard';
          return Response.redirect(new URL(dest, nextUrl));
        }
        return true;
      }

      // Protect dashboard routes
      if (dashboardRoutes) {
        return isLoggedIn;
      }

      // Protect portal routes (employee roles only)
      if (portalRoutes) {
        if (!isLoggedIn) return false;
        const employeeRoles = ['OWNER', 'MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'];
        if (!employeeRoles.includes(userRole)) {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        return true;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
