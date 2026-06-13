import { createHmac, timingSafeEqual } from "crypto";
import type { AdminSession } from "@/lib/auth/session";

const SECRET = process.env.AUTH_SECRET ?? "dev-secret-change-in-production";

export function buildSessionCookieValue(user: AdminSession): string {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  const sig = signPayload(payload);
  return `${payload}.${sig}`;
}

function signPayload(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  };
}

export function parseSessionCookie(raw: string | undefined): AdminSession | null {
  if (!raw) return null;

  const lastDot = raw.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const payload = raw.slice(0, lastDot);
  const sig = raw.slice(lastDot + 1);
  const expected = signPayload(payload);

  try {
    if (
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    ) {
      const json = Buffer.from(payload, "base64url").toString("utf-8");
      return JSON.parse(json) as AdminSession;
    }
  } catch {
    return null;
  }

  return null;
}
