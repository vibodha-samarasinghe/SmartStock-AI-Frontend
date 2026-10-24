"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://smart-stock-ai-backend.vercel.app/api/users/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      if (!data.token || !data.user) {
        setError("Login response is missing user details or token.");
        console.error("Login response:", data);
        return;
      }

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      router.replace("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to the server. Please check your backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-white via-violet-50 to-purple-100 px-4 py-10 text-violet-950">

      {/* Background decorations */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-[100px]" />

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-2xl shadow-violet-200/50 md:grid-cols-2">

        {/* Left branding section */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-950 via-purple-900 to-violet-800 p-10 text-white md:flex lg:p-12">

          <div className="absolute -right-20 top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-10 top-36 h-44 w-44 rounded-full border border-white/10" />
          <div className="absolute bottom-20 left-10 h-36 w-36 rounded-full bg-purple-400/20 blur-3xl" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-white p-2 shadow-lg">
            <Logo />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                SmartStock <span className="text-purple-200">AI</span>
              </h1>
              <p className="text-xs text-purple-200/80">
                Intelligent Inventory Management
              </p>
            </div>
          </div>

          <div className="relative z-10 my-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-purple-100">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Smarter inventory starts here
            </div>

            <h2 className="text-4xl font-bold leading-tight lg:text-5xl">
              Manage stock.
              <br />
              <span className="text-purple-200">Think smarter.</span>
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-purple-100/80">
              Keep your inventory organized, monitor your products,
              and make better decisions with SmartStock AI.
            </p>

            <div className="mt-9 space-y-4">
              {[
                ["✓", "Easy inventory tracking"],
                ["↗", "Sales and stock insights"],
                ["✦", "AI-powered assistance"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                    {icon}
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <p className="relative z-10 text-xs text-purple-200/60">
            © {new Date().getFullYear()} SmartStock AI
          </p>
        </section>

        {/* Right login section */}
        <section className="p-6 sm:p-10 lg:p-12">

          {/* Mobile branding */}
          <div className="mb-10 flex items-center gap-3 md:hidden">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-violet-200 bg-white p-2 shadow-md">
            <Logo />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                SmartStock <span className="text-violet-400">AI</span>
              </h1>
              <p className="text-xs text-slate-400">
                Intelligent Inventory Management
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-xl">
              👋
            </div>

            <h2 className="text-3xl font-bold tracking-tight">
              Welcome back
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign in to access your SmartStock dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-violet-950"
              >
                Email address
              </label>

              <div className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 transition focus-within:border-violet-500 focus-within:bg-violet-500/[0.04] focus-within:ring-4 focus-within:ring-violet-500/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5 shrink-0 text-slate-500 transition group-focus-within:text-violet-400"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-violet-950 outline-none placeholder:text-violet-300"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-violet-950"
              >
                Password
              </label>

              <div className="group flex items-center gap-3 rounded-xl border border-violet-200 bg-violet-50/50 px-4 transition focus-within:border-violet-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-100">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-5 w-5 shrink-0 text-slate-500 transition group-focus-within:text-violet-400"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-slate-600"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="shrink-0 text-slate-500 transition hover:text-violet-300"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7-.4 1-1.3 2.4-2.7 3.6M6.2 6.2C3.9 7.6 2.1 10 1.5 12c1 2.5 4.5 7 10.5 7 1.1 0 2.2-.2 3.2-.5" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5" aria-hidden="true">
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-400 transition hover:text-slate-200">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 accent-violet-500"
              />
              Remember me
            </label>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-300"
              >
                <span aria-hidden="true">⚠</span>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-950/40 transition duration-200 hover:-translate-y-0.5 hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-900/50 focus:outline-none focus:ring-4 focus:ring-violet-500/25 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in to your account
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </>
              )}
            </button>
          </form>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-600">SMARTSTOCK AI</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <p className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <a
              href="/register"
              className="font-semibold text-violet-400 transition hover:text-violet-300"
            >
              Create account
            </a>
          </p>

          <p className="mt-8 text-center text-xs leading-5 text-slate-600">
            Secure access to your inventory workspace.
          </p>
        </section>
      </div>
    </main>
  );
}
