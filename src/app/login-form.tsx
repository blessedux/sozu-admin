"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DarkGradientBg } from "@/components/ui/dark-gradient-bg";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Sign in failed");
        return;
      }
      window.location.href = returnTo.startsWith("/") ? returnTo : "/dashboard";
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DarkGradientBg>
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-sozu-border bg-sozu-panel/80 p-8 backdrop-blur">
          <img
            src="/sozucapital_logo_transparent.png"
            alt="Sozu Capital"
            className="mx-auto h-10 w-auto"
          />
          <h1 className="mt-6 text-center text-xl font-bold text-white">
            Network Intelligence
          </h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            SozuCapital team access only · admin.sozu.capital
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400">
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@sozu.capital"
                className="mt-1 w-full rounded-lg border border-sozu-border bg-black px-3 py-2 text-white placeholder:text-gray-600 focus:border-sozu-cyan focus:outline-none"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sozu-cyan px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Investors:{" "}
            <a href="/invest" className="text-sozu-cyan hover:underline">
              invest.sozu.capital
            </a>
          </p>
        </div>
      </div>
    </DarkGradientBg>
  );
}
