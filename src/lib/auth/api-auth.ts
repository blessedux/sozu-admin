import { getSession, type AdminSession } from "@/lib/auth/session";

export async function requireAdminSession(): Promise<AdminSession> {
  const session = await getSession();
  if (!session || session.role !== "sozu_admin") {
    throw new Error("Unauthorized");
  }
  return session;
}
