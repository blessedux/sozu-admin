"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/network-map", label: "Network Map" },
  { href: "/dashboard/growth", label: "Growth" },
  { href: "/dashboard/orbs", label: "Orbs" },
  { href: "/dashboard/merchants", label: "Merchants" },
  { href: "/dashboard/users", label: "Users" },
  { href: "/dashboard/transactions", label: "Transactions" },
  { href: "/dashboard/settlements", label: "Settlements" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/credit", label: "Credit" },
] as const;

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-sozu-border bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/sozucapital_logo_transparent.png"
            alt="Sozu Capital"
            className="h-7 w-auto"
          />
          <div>
            <p className="text-sm font-semibold text-white">Network Intelligence</p>
            <p className="text-xs text-gray-500">admin.sozu.capital</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/invest"
            target="_blank"
            className="hidden text-xs text-sozu-cyan hover:underline sm:inline"
          >
            Investor mode ↗
          </Link>
          <span className="hidden text-xs text-gray-500 md:inline">{email}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-sozu-border px-3 py-1.5 text-xs text-gray-300 hover:bg-sozu-panel"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
      <nav className="mx-auto max-w-[1600px] overflow-x-auto px-4 pb-2">
        <ul className="flex gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition",
                    active
                      ? "bg-sozu-cyan/10 text-sozu-cyan"
                      : "text-gray-400 hover:bg-sozu-panel hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
