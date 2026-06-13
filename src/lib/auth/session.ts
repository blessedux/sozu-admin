import { cookies } from "next/headers";
import {
  buildSessionCookieValue,
  getSessionCookieOptions,
  parseSessionCookie,
} from "@/lib/auth/session-cookie";
import { SESSION_COOKIE } from "@/lib/auth/session-constants";

export { SESSION_COOKIE };

export interface AdminSession {
  email: string;
  role: "sozu_admin";
}

const MOCK_SESSION: AdminSession = {
  email: "admin@sozu.capital",
  role: "sozu_admin",
};

function authMockEnabled(): boolean {
  return process.env.AUTH_MOCK === "true";
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const parsed = parseSessionCookie(cookieStore.get(SESSION_COOKIE)?.value);
  if (parsed) return parsed;
  if (authMockEnabled()) return MOCK_SESSION;
  return null;
}

export async function setSession(user: AdminSession): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, buildSessionCookieValue(user), getSessionCookieOptions());
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", { ...getSessionCookieOptions(), maxAge: 0 });
}
