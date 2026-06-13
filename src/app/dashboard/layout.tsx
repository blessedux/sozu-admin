import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");

  return (
    <div className="min-h-screen bg-black">
      <AdminNav email={session.email} />
      <main className="mx-auto max-w-[1600px] px-4 py-8">{children}</main>
    </div>
  );
}
