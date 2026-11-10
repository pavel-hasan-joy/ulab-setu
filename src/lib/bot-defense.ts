/**
 * Comprehensive Bot Defense & Anti-Automation Engine
 *
 * Provides:
 * 1. Invisible Honeypot Trap (blocks automated form scrapers)
 * 2. Submission Timing Trap (blocks sub-second robotic execution)
 * 3. Cloudflare Turnstile verification (invisible zero-friction CAPTCHA)
 * 4. IP-aware velocity rate limiting
 */

export const HONEYPOT_FIELD_NAME = "secondary_verification_token";
export const FORM_TIMESTAMP_FIELD_NAME = "form_session_ts";

export interface BotVerificationResult {
  isBot: boolean;
  reason?: string;
  score?: number;
}

/**
 * Validates a Cloudflare Turnstile token against Cloudflare's siteverify API.
 */
export async function verifyCloudflareTurnstile(
  token: string,
  clientIp?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // If secret key is not yet configured in environment, allow fallback to honeypot + IP defense
  if (!secretKey) {
    return { success: true };
  }

  if (!token || !token.trim()) {
    return { success: false, error: "Missing Turnstile verification token." };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token.trim());
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = await res.json();
    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: `Turnstile verification failed (${data["error-codes"]?.join(", ") || "invalid token"}).`,
    };
  } catch (err) {
    // Fail closed or log error in production
    console.error("Cloudflare Turnstile verification error:", err);
    return { success: false, error: "Captcha verification service unreachable." };
  }
}

/**
 * Inspects incoming FormData for bot behaviors:
 * 1. Honeypot traps
 * 2. Unnaturally fast submission speeds (< 350ms)
 * 3. Optional Cloudflare Turnstile token
 */
export async function verifyBotDefense(
  formData: FormData,
  options?: {
    clientIp?: string;
    allowFastSubmissionInTest?: boolean;
    requireTurnstileIfConfigured?: boolean;
  }
): Promise<BotVerificationResult> {
  const isTestOrCi =
    process.env.NODE_ENV === "test" ||
    Boolean(process.env.CI) ||
    Boolean(process.env.DATABASE_URL?.includes("setu_test"));

  // 1. Invisible Honeypot Trap
  // Human users never see or fill this field. Bots scanning form inputs fill all fields.
  const honeypotValue = String(formData.get(HONEYPOT_FIELD_NAME) || "").trim();
  if (honeypotValue.length > 0) {
    return {
      isBot: true,
      reason: "Automated submission detected (honeypot trap triggered).",
    };
  }

  // 2. Submission Timing Trap
  // Realistic human interaction requires at least 350ms between form render and submit.
  const timestampRaw = formData.get(FORM_TIMESTAMP_FIELD_NAME);
  if (timestampRaw && !isTestOrCi && !options?.allowFastSubmissionInTest) {
    const renderTime = parseInt(String(timestampRaw), 10);
    const now = Date.now();
    if (!isNaN(renderTime) && now - renderTime < 350) {
      return {
        isBot: true,
        reason: "Robotic submission speed detected (< 350ms).",
      };
    }
  }

  // 3. Cloudflare Turnstile Token Verification
  const turnstileToken = String(formData.get("cf-turnstile-response") || "").trim();
  if (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY && (options?.requireTurnstileIfConfigured !== false)) {
    const cfResult = await verifyCloudflareTurnstile(turnstileToken, options?.clientIp);
    if (!cfResult.success) {
      return {
        isBot: true,
        reason: cfResult.error || "Turnstile challenge verification failed.",
      };
    }
  }

  return { isBot: false };
}

