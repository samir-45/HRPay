import React, { useState } from "react";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("superadmin@hrpay.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem("hrpay_token");
      if (stored) {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        setLocation(payload.role === "super_admin" ? "/super-admin" : "/");
      } else {
        setLocation("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden" style={{ background: "hsl(82 80% 48%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, black 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <div className="size-6 rounded-full bg-black" />
            <div className="size-6 rounded-full" style={{ background: "hsl(220 15% 10%)" }} />
          </div>
          <h1 className="text-4xl font-extrabold text-black mb-4">HRPay</h1>
          <p className="text-black/70 text-lg max-w-xs leading-relaxed">
            Enterprise-grade HR & Payroll management for growing teams.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto text-left">
            {[
              ["20+", "Employees managed"],
              ["10+", "Payroll runs processed"],
              ["7", "Departments"],
              ["100%", "Automated payroll"],
            ].map(([v, l]) => (
              <div key={l} className="bg-black/10 rounded-xl p-3">
                <p className="text-2xl font-bold text-black">{v}</p>
                <p className="text-xs text-black/60 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-8">
              <div className="flex gap-1">
                <div className="size-4 rounded-full" style={{ background: "hsl(82 80% 48%)" }} />
                <div className="size-4 rounded-full bg-foreground" />
              </div>
              <span className="font-bold text-foreground text-lg">HRPay</span>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-sm text-muted-foreground mb-6">Sign in to your HR dashboard</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  style={{ "--tw-ring-color": "hsl(82 80% 48%)" } as React.CSSProperties}
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-foreground transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "hsl(82 80% 48%)" }}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Demo credentials</p>
              <p>Email: <span className="text-foreground">superadmin@hrpay.com</span></p>
              <p>Password: <span className="text-foreground">Admin@123</span></p>
            </div>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              New company?{" "}
              <a href="/register" className="font-semibold text-foreground hover:underline">Register your company →</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
