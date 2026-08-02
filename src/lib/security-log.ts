

import { prisma } from '@/lib/prisma';

export type SecurityEvent =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'ACCOUNT_LOCKED'
  | 'RATE_LIMIT_HIT'
  | 'PASSWORD_CHANGED'
  | 'OTP_REQUESTED'
  | 'REGISTRATION';

/**
 * Log a security event to the database.
 * Fire-and-forget — never blocks the auth flow.
 */
export async function logSecurityEvent(params: {
  event: SecurityEvent;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        event: params.event,
        email: params.email,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        metadata: params.metadata || null,
      },
    });
  } catch (error) {
    // Never let logging failures break the auth flow
    console.error('[SecurityLog] Failed to write log:', error);
  }
}
