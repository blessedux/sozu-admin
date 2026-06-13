/**
 * SozuCapital team allowlist — only these emails may access admin.sozu.capital.
 */

export function getAdminAllowlist(): string[] {
  const raw = process.env.SOZU_ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedAdminEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const allowlist = getAdminAllowlist();
  if (allowlist.length === 0 && process.env.NODE_ENV !== "production") {
    return normalized.endsWith("@sozu.capital");
  }
  return allowlist.includes(normalized);
}
