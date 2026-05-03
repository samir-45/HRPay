import React, { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowRight, Check, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { toast } from "@/components/ui/sonner";

const LIME = "hsl(82 80% 48%)";

const PLAN_DETAILS: Record<string, { label: string; price: { monthly: number; yearly: number }; seats: string }> = {
  free:    { label: "Free",    price: { monthly: 0,  yearly: 0   }, seats: "Up to 5 employees" },
  starter: { label: "Starter", price: { monthly: 29, yearly: 290 }, seats: "Up to 50 employees" },
  pro:     { label: "Pro",     price: { monthly: 99, yearly: 990 }, seats: "Unlimited employees" },
};

const INDUSTRIES = ["Technology", "Healthcare", "Finance", "Retail", "Education", "Manufacturing", "Real Estate", "Media", "Consulting", "Other"];
const SIZES = ["1–10", "11–50", "51–200", "201–500", "500+"];

export default function RegisterCompany() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initPlan = params.get("plan") ?? "free";
  const initBilling = (params.get("billing") ?? "monthly") as "monthly" | "yearly";

  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState(initPlan);
  const [billing, setBilling] = useState<"monthly" | "yearly">(initBilling);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "", industry: "", size: "",
    adminName: "", adminEmail: "", adminPassword: "", confirmPassword: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const planInfo = PLAN_DETAILS[plan] ?? PLAN_DETAILS.free;

  const step1Valid = form.companyName.trim().length >= 2 && form.industry && form.size;
  const step2Valid = form.adminName.trim().length >= 2 && form.adminEmail.includes("@") && form.adminPassword.length >= 8 && form.adminPassword === form.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!step2Valid) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/companies/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          industry: form.industry,
          size: form.size,
          adminName: form.adminName,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          plan,
          billingCycle: billing,
        }),
      });
      const data = await r.json() as { token?: string; user?: any; error?: string };
      if (!r.ok) { setError(data.error ?? "Registration failed"); return; }
      localStorage.setItem("hrpay_token", data.token!);
      toast.success("Company registered successfully");
      await login(form.adminEmail, form.adminPassword);
      setLocation("/");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all";

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220 20% 96%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col items-center justify-center p-10 relative overflow-hidden" style={{ background: LIME }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, black 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative z-10 w-full">
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="flex gap-1">
              <div className="size-4 rounded-full bg-black/40" />
              <div className="size-4 rounded-full bg-black/80" />
            </div>
            <span className="font-bold text-black text-lg">HRPay</span>
          </Link>
          <h2 className="text-3xl font-extrabold text-black mb-3">Start your HR journey</h2>
          <p className="text-black/70 mb-10 leading-relaxed">Set up your company in minutes and start managing your team like a pro.</p>

          {/* Selected plan card */}
          <div className="bg-black/15 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-black">{planInfo.label} Plan</span>
              <span className="text-xs bg-black/20 px-2 py-1 rounded-full text-black font-medium">{planInfo.seats}</span>
            </div>
            <p className="text-3xl font-extrabold text-black">${planInfo.price[billing]}<span className="text-base font-normal text-black/60">/mo</span></p>
            {billing === "yearly" && planInfo.price.monthly > 0 && <p className="text-xs text-black/60 mt-1">Billed yearly — save 17%</p>}
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {[{ n: 1, label: "Company info" }, { n: 2, label: "Admin account" }].map(({ n, label }) => (
              <div key={n} className="flex items-center gap-3">
                <div className={`size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${step >= n ? "bg-black text-white" : "bg-black/20 text-black/40"}`}>
                  {step > n ? <Check className="h-3 w-3" /> : n}
                </div>
                <span className={`text-sm font-medium ${step >= n ? "text-black" : "text-black/40"}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">
                {step === 1 ? "Company Details" : "Create Admin Account"}
              </h3>
              <span className="text-xs text-muted-foreground">Step {step} of 2</span>
            </div>

            {step === 1 ? (
              <div className="space-y-4">
                {/* Plan selector */}
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Select Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["free", "starter", "pro"].map(p => (
                      <button key={p} type="button" onClick={() => setPlan(p)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold capitalize transition-all ${plan === p ? "border-lime-400 bg-lime-50 text-foreground" : "border-border text-muted-foreground hover:border-muted-foreground"}`}>
                        {p}
                        <p className="font-normal text-[10px] mt-0.5 text-muted-foreground">
                          {p === "free" ? "Free" : p === "starter" ? "$29/mo" : "$99/mo"}
                        </p>
                      </button>
                    ))}
                  </div>
                  {plan !== "free" && (
                    <div className="flex gap-1 mt-2 rounded-xl border border-border p-1">
                      {(["monthly", "yearly"] as const).map(b => (
                        <button key={b} type="button" onClick={() => setBilling(b)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-all ${billing === b ? "bg-foreground text-white" : "text-muted-foreground"}`}>{b}</button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Company Name *</label>
                  <input value={form.companyName} onChange={set("companyName")} placeholder="Acme Corp" className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Industry *</label>
                    <select value={form.industry} onChange={set("industry")} className={inputCls}>
                      <option value="">Select…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Company Size *</label>
                    <select value={form.size} onChange={set("size")} className={inputCls}>
                      <option value="">Select…</option>
                      {SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                    </select>
                  </div>
                </div>

                <button disabled={!step1Valid} onClick={() => setStep(2)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all disabled:opacity-40 mt-2"
                  style={{ background: LIME }}>
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Your Full Name *</label>
                  <input value={form.adminName} onChange={set("adminName")} placeholder="Jane Smith" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Work Email *</label>
                  <input type="email" value={form.adminEmail} onChange={set("adminEmail")} placeholder="jane@acmecorp.com" className={inputCls} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Password * <span className="text-xs text-muted-foreground font-normal">(min 8 chars)</span></label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={form.adminPassword} onChange={set("adminPassword")} placeholder="Create a strong password" className={inputCls + " pr-10"} />
                    <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Confirm Password *</label>
                  <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" className={inputCls} />
                  {form.confirmPassword && form.confirmPassword !== form.adminPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>

                {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">{error}</div>}

                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted transition-all">Back</button>
                  <button type="submit" disabled={!step2Valid || loading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all disabled:opacity-40"
                    style={{ background: LIME }}>
                    {loading ? "Creating…" : "Create Account"} {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-xs text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
