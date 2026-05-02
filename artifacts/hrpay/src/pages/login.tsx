import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth-context";
import { useLocation } from "wouter";
import { Shield, ArrowLeft } from "lucide-react";

const LIME = "hsl(82 80% 48%)";

export default function Login() {
  const { login, logout } = useAuth();
  const [, setLocation] = useLocation();

  const params = new URLSearchParams(window.location.search);
  const isAdminPortal = params.get("portal") === "admin";

  const [email, setEmail] = useState(isAdminPortal ? "superadmin@hrpay.com" : "");
  const [password, setPassword] = useState(isAdminPortal ? "Admin@123" : "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdminPortal) return;
    const stored = localStorage.getItem("hrpay_token");
    if (!stored) return;
    try {
      const payload = JSON.parse(atob(stored.split(".")[1]));
      if (payload.role === "super_admin") logout();
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      const stored = localStorage.getItem("hrpay_token");
      if (stored) {
        const payload = JSON.parse(atob(stored.split(".")[1]));
        setLocation(payload.role === "super_admin" ? "/super-admin" : "/dashboard");
      } else {
        setLocation("/dashboard");
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
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: isAdminPortal ? "hsl(220 15% 12%)" : LIME }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: isAdminPortal ? LIME : "white" }} />
        <div className="relative z-10 text-center">
          <div className="flex justify-center gap-2 mb-6">
            <div className="size-6 rounded-full" style={{ background: isAdminPortal ? LIME : "black" }} />
            <div className="size-6 rounded-full" style={{ background: isAdminPortal ? "white" : "hsl(220 15% 10%)" }} />
          </div>
          <h1 className="text-4xl font-extrabold mb-3" style={{ color: isAdminPortal ? "white" : "black" }}>HRPay</h1>
          {isAdminPortal ? (
            <>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: LIME + "30" }}>
                <Shield className="h-3.5 w-3.5" style={{ color: LIME }} />
                <span className="text-xs font-bold" style={{ color: LIME }}>Super Admin Portal</span>
              </div>
              <p className="text-white/60 text-base max-w-xs leading-relaxed">
                Platform-level administration. Manage all companies, subscriptions, and platform health.
              </p>
              <div className="mt-10 space-y-3 max-w-xs mx-auto text-left">
                {[
                  "Manage all company tenants",
                  "Control subscription plans",
                  "View platform analytics",
                  "Suspend or reactivate accounts",
                ].map(item => (
                  <div key={item} className="flex items-center gap-2.5 text-sm text-white/70">
                    <div className="size-1.5 rounded-full shrink-0" style={{ background: LIME }} />
                    {item}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-black/70 text-lg max-w-xs leading-relaxed">
                Enterprise-grade HR & Payroll management for growing teams.
              </p>
              <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto text-left">
                {[
                  ["17+", "HR modules"],
                  ["5-tier", "Role hierarchy"],
                  ["100%", "Automated payroll"],
                  ["14-day", "Free trial"],
                ].map(([v, l]) => (
                  <div key={l} className="bg-black/10 rounded-xl p-3">
                    <p className="text-2xl font-bold text-black">{v}</p>
                    <p className="text-xs text-black/60 mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Back to landing */}
          <a href="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to home
          </a>

          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-7">
              <div className="flex gap-1">
                <div className="size-4 rounded-full" style={{ background: LIME }} />
                <div className="size-4 rounded-full bg-foreground" />
              </div>
              <span className="font-bold text-foreground text-lg">HRPay</span>
              {isAdminPortal && (
                <span className="ml-1 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-foreground text-white">
                  <Shield className="h-2.5 w-2.5" /> Super Admin
                </span>
              )}
            </div>

            <h2 className="text-2xl font-extrabold text-foreground mb-1">
              {isAdminPortal ? "Admin sign in" : "Welcome back"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {isAdminPortal
                ? "Sign in to the HRPay platform admin panel"
                : "Sign in to your company's HR dashboard"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                  placeholder={isAdminPortal ? "superadmin@hrpay.com" : "you@company.com"}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">Password</label>
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
                className="w-full rounded-xl py-2.5 text-sm font-bold text-foreground transition-all hover:opacity-90 disabled:opacity-60 shadow-sm"
                style={{ background: LIME }}>
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            {/* Demo credentials box */}
            <div className="mt-5 rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
              <p className="font-bold text-foreground mb-1.5">
                {isAdminPortal ? "Super Admin credentials" : "Demo credentials"}
              </p>
              <p>Email: <span className="text-foreground font-medium">
                {isAdminPortal ? "superadmin@hrpay.com" : "admin@demo.com"}
              </span></p>
              <p>Password: <span className="text-foreground font-medium">Admin@123</span></p>
            </div>

            {!isAdminPortal && (
              <p className="mt-5 text-center text-xs text-muted-foreground">
                New company?{" "}
                <a href="/register" className="font-semibold text-foreground hover:underline">Register your company →</a>
              </p>
            )}

            {isAdminPortal && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">← Sign in as a company user</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
