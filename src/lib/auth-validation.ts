/**
 * Strict institutional ULAB email validation and role security utilities.
 * Enforces exact domain '@ulab.edu.bd' and protects role boundaries.
 */

export const OFFICIAL_ULAB_DOMAIN = "ulab.edu.bd";

export type EmailValidationResult = {
  valid: boolean;
  error?: string;
  normalizedEmail: string;
};

/**
 * Validates that an email belongs strictly to the '@ulab.edu.bd' domain.
 * Rejects:
 * - Personal domains (gmail.com, yahoo.com, etc.)
 * - Subdomain accounts (cse.ulab.edu.bd, mail.ulab.edu.bd)
 * - Lookalike or spoofed domains (e.g., user@ulab.edu.bd.attacker.com, user@myulab.edu.bd)
 * - Invalid RFC formats or multiple '@' signs
 */
export function validateOfficialUlabEmail(emailRaw: unknown): EmailValidationResult {
  if (typeof emailRaw !== "string") {
    return { valid: false, error: "Email must be a valid text string.", normalizedEmail: "" };
  }

  const email = emailRaw.trim().toLowerCase();
  if (!email) {
    return { valid: false, error: "Please enter your official ULAB email address.", normalizedEmail: "" };
  }

  // Reject whitespace within the email
  if (/\s/.test(email)) {
    return { valid: false, error: "Email address cannot contain spaces.", normalizedEmail: email };
  }

  // Must have exactly one '@' sign
  const parts = email.split("@");
  if (parts.length !== 2) {
    return { valid: false, error: "Invalid email format. Must contain exactly one '@'.", normalizedEmail: email };
  }

  const [username, domain] = parts;

  // Local part (username) validation
  if (!username || username.length < 1) {
    return { valid: false, error: "Email username cannot be empty.", normalizedEmail: email };
  }

  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(username)) {
    return { valid: false, error: "Email contains invalid characters before '@'.", normalizedEmail: email };
  }

  // Exact domain check: MUST be exactly 'ulab.edu.bd'
  if (domain !== OFFICIAL_ULAB_DOMAIN) {
    if (domain.endsWith(`.${OFFICIAL_ULAB_DOMAIN}`)) {
      return {
        valid: false,
        error: `Subdomain emails (@${domain}) are not permitted. Please use your exact @${OFFICIAL_ULAB_DOMAIN} address.`,
        normalizedEmail: email,
      };
    }
    if (domain.includes(OFFICIAL_ULAB_DOMAIN)) {
      return {
        valid: false,
        error: `Lookalike or spoofed email domains (@${domain}) are strictly forbidden. Use @${OFFICIAL_ULAB_DOMAIN}.`,
        normalizedEmail: email,
      };
    }
    return {
      valid: false,
      error: `Personal and third-party email domains (@${domain}) are not allowed. Access is restricted to official @${OFFICIAL_ULAB_DOMAIN} emails.`,
      normalizedEmail: email,
    };
  }

  return { valid: true, normalizedEmail: `${username}@${OFFICIAL_ULAB_DOMAIN}` };
}

export type PublicRole = "STUDENT" | "ALUMNI" | "TEACHER";

/**
 * Validates and sanitizes the requested public role.
 * Explicitly rejects unauthorized roles like "ADMIN" or malformed strings.
 */
export function sanitizeAndValidatePublicRole(roleRaw: unknown): {
  valid: boolean;
  role: PublicRole;
  error?: string;
} {
  const normalized = String(roleRaw || "").trim().toUpperCase();

  // Strict check: Block public ADMIN registration
  if (normalized === "ADMIN" || normalized === "SUPERADMIN" || normalized === "MODERATOR") {
    return {
      valid: false,
      role: "STUDENT",
      error: "The Admin role is restricted and cannot be created through public registration.",
    };
  }

  if (normalized === "ALUMNI") {
    return { valid: true, role: "ALUMNI" };
  }

  if (normalized === "TEACHER" || normalized === "FACULTY") {
    return { valid: true, role: "TEACHER" };
  }

  if (normalized === "STUDENT") {
    return { valid: true, role: "STUDENT" };
  }

  // Fallback for unexpected or missing values
  return {
    valid: false,
    role: "STUDENT",
    error: "Invalid role selected. Allowed roles are Student, Alumni, or Faculty.",
  };
}

