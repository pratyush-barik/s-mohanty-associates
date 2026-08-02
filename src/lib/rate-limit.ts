
/**
 * In-memory rate limiter for authentication endpoints.
 * Tracks failed attempts per IP and per account (email).
 * 
 * In production with multiple Vercel serverless instances,
 * this provides per-instance protection. For distributed
 * rate limiting, migrate to Redis/Upstash.
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number; // timestamp ms
}

// In-memory stores (reset on cold start — acceptable for serverless)
const ipStore = new Map<string, RateLimitEntry>();
const accountStore = new Map<string, RateLimitEntry>();

// Config
const IP_MAX_ATTEMPTS = 5;
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const ACCOUNT_MAX_ATTEMPTS = 10;
const ACCOUNT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Cleanup stale entries every 10 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of ipStore) {
    if (now - entry.firstAttempt > IP_WINDOW_MS) {
      ipStore.delete(key);
    }
  }
  for (const [key, entry] of accountStore) {
    if (now - entry.firstAttempt > ACCOUNT_WINDOW_MS) {
      accountStore.delete(key);
    }
  }
}

function checkLimit(
  store: Map<string, RateLimitEntry>,
  key: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  cleanupStaleEntries();
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.firstAttempt > windowMs) {
    // Window expired or first attempt — reset
    store.set(key, { count: 1, firstAttempt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= maxAttempts) {
    const elapsed = now - entry.firstAttempt;
    const remaining = Math.ceil((windowMs - elapsed) / 1000);
    return { allowed: false, retryAfterSeconds: Math.max(remaining, 1) };
  }

  entry.count++;
  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Check if a login attempt is rate-limited by IP.
 * Call this BEFORE processing the login.
 */
export function checkIpRateLimit(ip: string): { allowed: boolean; retryAfterSeconds: number } {
  return checkLimit(ipStore, ip, IP_MAX_ATTEMPTS, IP_WINDOW_MS);
}

/**
 * Check if a login attempt is rate-limited by account email.
 * Call this BEFORE processing the login.
 */
export function checkAccountRateLimit(email: string): { allowed: boolean; retryAfterSeconds: number } {
  return checkLimit(accountStore, email.toLowerCase(), ACCOUNT_MAX_ATTEMPTS, ACCOUNT_WINDOW_MS);
}

/**
 * Record a failed login attempt for both IP and account.
 */
export function recordFailedAttempt(ip: string, email: string): void {
  // IP tracking is already incremented during checkLimit, 
  // but account might not have been checked yet
  const now = Date.now();
  
  // Ensure account store is updated
  const accountEntry = accountStore.get(email.toLowerCase());
  if (!accountEntry || now - accountEntry.firstAttempt > ACCOUNT_WINDOW_MS) {
    accountStore.set(email.toLowerCase(), { count: 1, firstAttempt: now });
  } else {
    accountEntry.count++;
  }
}

/**
 * Reset rate limit counters on successful login.
 */
export function resetRateLimit(ip: string, email: string): void {
  ipStore.delete(ip);
  accountStore.delete(email.toLowerCase());
}
