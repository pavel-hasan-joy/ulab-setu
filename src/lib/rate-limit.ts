/**
 * In-memory login rate limiter with a sliding window.
 * Protects authentication endpoints from credential-stuffing and brute-force attacks.
 */

type AttemptRecord = {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
};

// Global map surviving hot-reloads in non-production
const globalForRateLimit = global as unknown as { loginAttempts?: Map<string, AttemptRecord> };
const loginAttempts = globalForRateLimit.loginAttempts ?? new Map<string, AttemptRecord>();
if (process.env.NODE_ENV !== "production") {
  globalForRateLimit.loginAttempts = loginAttempts;
}

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export function checkLoginRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterMinutes?: number;
  error?: string;
} {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record) return { allowed: true };

  // Check if currently locked out
  if (record.blockedUntil && record.blockedUntil > now) {
    const remainingMs = record.blockedUntil - now;
    const retryAfterMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
    return {
      allowed: false,
      retryAfterMinutes,
      error: `Too many failed login attempts. For security reasons, please try again in ${retryAfterMinutes} minute(s).`,
    };
  }

  // Clear if observation window has elapsed
  if (now - record.firstAttempt > WINDOW_DURATION_MS) {
    loginAttempts.delete(key);
    return { allowed: true };
  }

  // Lock out if exceeded max failed attempts
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS;
    loginAttempts.set(key, record);
    const retryAfterMinutes = Math.ceil(BLOCK_DURATION_MS / (60 * 1000));
    return {
      allowed: false,
      retryAfterMinutes,
      error: `Too many failed login attempts. Account temporarily locked for ${retryAfterMinutes} minutes.`,
    };
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string): void {
  const key = identifier.trim().toLowerCase();
  const now = Date.now();
  const record = loginAttempts.get(key);

  if (!record || now - record.firstAttempt > WINDOW_DURATION_MS) {
    loginAttempts.set(key, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.blockedUntil = now + BLOCK_DURATION_MS;
    }
    loginAttempts.set(key, record);
  }
}

export function clearLoginRateLimit(identifier: string): void {
  loginAttempts.delete(identifier.trim().toLowerCase());
}

