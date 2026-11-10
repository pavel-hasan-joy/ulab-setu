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

/**
 * Generic sliding-window action rate limiter to protect mutations (jobs, reports, tickets)
 * from abuse, script spamming, or denial-of-service.
 */
const globalActionLimits = global as unknown as { actionAttempts?: Map<string, number[]> };
const actionAttempts = globalActionLimits.actionAttempts ?? new Map<string, number[]>();
if (process.env.NODE_ENV !== "production") {
  globalActionLimits.actionAttempts = actionAttempts;
}

export function checkActionRateLimit(
  actionKey: string,
  maxAllowed: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfterSeconds?: number; error?: string } {
  const key = actionKey.trim().toLowerCase();
  const now = Date.now();
  const timestamps = (actionAttempts.get(key) ?? []).filter((ts) => now - ts < windowMs);

  if (timestamps.length >= maxAllowed) {
    const oldest = timestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    return {
      allowed: false,
      retryAfterSeconds,
      error: `Action rate limit reached. Please wait ${retryAfterSeconds} second(s) before trying again.`,
    };
  }

  timestamps.push(now);
  actionAttempts.set(key, timestamps);
  return { allowed: true };
}

/**
 * Extracts client IP address safely from request headers.
 */
export function getClientIpFromHeaders(headers: Headers): string {
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp && cfConnectingIp.trim()) {
    return cfConnectingIp.trim();
  }

  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor && xForwardedFor.trim()) {
    const firstIp = xForwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp && xRealIp.trim()) {
    return xRealIp.trim();
  }

  return "127.0.0.1";
}

/**
 * Rate limits an operation by client IP address to prevent multi-account credential stuffing or bot spam.
 */
export function checkIpRateLimit(
  ip: string,
  actionKey: string,
  maxAllowed: number = 10,
  windowMs: number = 60 * 1000
): { allowed: boolean; retryAfterSeconds?: number; error?: string } {
  const sanitizedIp = ip.trim().replace(/[^a-zA-Z0-9.:_-]/g, "");
  return checkActionRateLimit(`ip:${actionKey}:${sanitizedIp}`, maxAllowed, windowMs);
}


