import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import authConfig from '@/auth.config';

/**
 * Full auth config WITH Prisma adapter.
 * Used in server components, server actions, and API routes (Node.js runtime).
 * Middleware uses the lightweight auth.config.ts instead.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        otp: { label: 'OTP', type: 'text' },
        portal: { label: 'Portal', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;
        const otp = credentials.otp as string;
        const portal = (credentials.portal as string || '').toUpperCase();

        // 1. Verify OTP if provided
        if (otp) {
          const otpRecord = await prisma.otp.findFirst({
            where: {
              email,
              code: otp,
              expiresAt: { gte: new Date() },
            },
          });
          if (!otpRecord) return null;
          
          // Clear OTPs on success
          await prisma.otp.deleteMany({ where: { email } });
        }

        if (portal === 'CLIENT') {
          const client = await prisma.client.findUnique({
            where: { email },
            include: { individual: true, organisation: true },
          });

          if (!client) {
            return null;
          }

          // Verify password if OTP wasn't used
          if (!otp) {
            if (!client.password) return null;
            const isValid = await bcrypt.compare(password, client.password);
            if (!isValid) return null;
          }

          const name = client.clientType === 'INDIVIDUAL'
            ? client.individual?.name
            : client.organisation?.organisationName;

          return {
            id: client.id,
            name: name || 'Client',
            email: client.email,
            role: 'CLIENT',
          };
        } else {
          const employee = await prisma.employee.findUnique({
            where: { email },
          });

          if (!employee || !employee.isActive) {
            return null;
          }

          // Verify password if OTP wasn't used
          if (!otp) {
            if (!employee.password) return null;
            const isValid = await bcrypt.compare(password, employee.password);
            if (!isValid) return null;
          }

          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            image: employee.profilePhoto,
            role: employee.role,
          };
        }
      },
    }),
  ],
});
