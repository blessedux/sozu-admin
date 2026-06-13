import { NextResponse } from "next/server";
import { isAllowedAdminEmail } from "@/lib/auth/admin-allowlist";
import { setSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: { email?: string };
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  if (!isAllowedAdminEmail(email)) {
    return NextResponse.json(
      { error: "Access restricted to SozuCapital team" },
      { status: 403 }
    );
  }

  await setSession({ email, role: "sozu_admin" });
  return NextResponse.json({ ok: true });
}
