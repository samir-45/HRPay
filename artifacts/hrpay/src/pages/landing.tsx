import React, { useState } from "react";
import { Link } from "wouter";
import {
  Users, Calculator, Clock, CalendarDays, Shield, BarChart3,
  Check, Zap, Star, ArrowRight, Building2, Globe, Award, ChevronDown,
} from "lucide-react";

const features = [
  { icon: Users,       title: "Employee Management",    desc: "Full employee lifecycle from hire to retire — profiles, docs, org chart." },
  { icon: Calculator,  title: "Payroll Automation",      desc: "Automated payroll runs, tax calculations, and direct deposit." },
  { icon: Clock,       title: "Time & Attendance",       desc: "Clock-in/out, timesheets, overtime tracking and approvals." },
  { icon: CalendarDays,title: "Leave Management",        desc: "PTO policies, leave requests, approval workflows." },
  { icon: Shield,      title: "Benefits Administration", desc: "Health, dental, vision, retirement plan enrollment." },
  { icon: BarChart3,   title: "Reports & Analytics",     desc: "Real-time headcount, payroll, and HR performance dashboards." },
];

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    desc: "Perfect for small teams getting started.",
    seats: "Up to 5 employees",
    features: ["Employee profiles", "Basic payroll", "Leave tracking", "1 department", "Email support"],
    cta: "Get Started Free",
    highlight: false,
  },
  {
    name: "Starter",
    price: { monthly: 29, yearly: 290 },
    desc: "Everything you need to run a growing team.",
    seats: "Up to 50 employees",
    features: ["Everything in Free", "Full payroll automation", "Time & attendance", "Benefits management", "Onboarding workflows", "Org chart", "Priority support"],
    cta: "Start Free Trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: { monthly: 99, yearly: 990 },
    desc: "Enterprise-grade HR for scaling companies.",
    seats: "Unlimited employees",
    features: ["Everything in Starter", "AI HR assistant", "Advanced analytics", "Recruitment & ATS", "Performance reviews", "Custom reports", "Dedicated support", "API access"],
    cta: "Start Free Trial",
    highlight: false,
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "CEO, Nexora Labs", text: "HRPay cut our payroll processing time by 80%. The onboarding module alone saved us weeks every quarter.", avatar: "SC" },
  { name: "Marcus Reid", role: "HR Director, Bluecore", text: "Finally an HR platform that feels modern. Our employees love the self-service portal.", avatar: "MR" },
  { name: "Priya Sharma", role: "COO, Finwave", text: "The multi-tier role system is exactly what we needed. Managers see their teams, nothing more.", avatar: "PS" },
];

const LIME = "hsl(82 80% 48%)";

export default function Landing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [faq, setFaq] = useState<number | null>(null);

  const faqs = [
    { q: "How does the free trial work?", a: "Starter and Pro plans include a 14-day free trial — no credit card required. You can downgrade to Free at any time." },
    { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time from your admin dashboard. Changes take effect immediately." },
    { q: "How many companies can I manage?", a: "Each company registers its own account. As Super Admin you manage your own HRPay platform instance." },
    { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. Each company's data is fully isolated in our multi-tenant architecture." },
    { q: "Do employees receive login emails?", a: "When a company admin invites an employee, they receive their login credentials instantly. Employees can change their password on first login." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="size-4 rounded-full" style={{ background: LIME }} />
              <div className="size-4 rounded-full bg-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">HRPay</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Customers</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
            <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(82 80% 48% / 0.12), transparent)" }} />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/50 text-xs font-medium text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full" style={{ background: LIME }} />
            Multi-tenant HR & Payroll SaaS
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            HR & Payroll built for<br />
            <span style={{ color: LIME }}>modern teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            HRPay is a full-stack HR platform your company can use from day one.
            Manage employees, run payroll, track time, handle leave — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-bold text-foreground hover:opacity-90 transition-all shadow-lg" style={{ background: LIME }}>
              Start free — no card needed <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-semibold border border-border hover:bg-muted transition-all">
              Sign in to your account
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-4">14-day free trial on paid plans · No credit card required</p>

          {/* Stats strip */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[["500+", "Companies"], ["50k+", "Employees managed"], ["99.9%", "Uptime"]].map(([v, l]) => (
              <div key={l}>
                <p className="text-3xl font-extrabold text-foreground">{v}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">Everything your HR team needs</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">17+ modules covering every aspect of HR — out of the box.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl border border-border p-6 hover:shadow-md transition-shadow">
                <div className="flex size-10 items-center justify-center rounded-xl mb-4" style={{ background: LIME + "30" }}>
                  <Icon className="h-5 w-5" style={{ color: "hsl(82 60% 35%)" }} />
                </div>
                <h3 className="font-bold text-foreground mb-1.5">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Hierarchy */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4">Built-in role hierarchy</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                Each company has its own hierarchy. Company Admin invites their CEOO, managers, supervisors, and employees — each with the right level of access.
              </p>
              <div className="space-y-3">
                {[
                  { role: "Company Admin", desc: "Full access — manage everything", color: "bg-foreground text-white" },
                  { role: "CEOO", desc: "View all modules, approve workflows", color: "bg-indigo-600 text-white" },
                  { role: "Manager", desc: "Manage team — payroll, time, leave", color: "bg-blue-600 text-white" },
                  { role: "Supervisor", desc: "Approve time & leave for their team", color: "bg-cyan-600 text-white" },
                  { role: "Employee", desc: "Self-service — own profile & requests", color: "bg-muted text-foreground" },
                ].map(({ role, desc, color }) => (
                  <div key={role} className="flex items-center gap-4">
                    <span className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold ${color} min-w-28 text-center`}>{role}</span>
                    <span className="text-sm text-muted-foreground">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl p-8 text-center" style={{ background: LIME }}>
              <Building2 className="h-10 w-10 mx-auto mb-4 text-black/50" />
              <p className="text-2xl font-extrabold text-black mb-2">Multi-tenant</p>
              <p className="text-black/70 text-sm leading-relaxed mb-6">Each company is fully isolated. Data never crosses tenant boundaries.</p>
              <div className="space-y-2">
                {["Company A", "Company B", "Company C"].map((c, i) => (
                  <div key={c} className="flex items-center gap-3 bg-black/10 rounded-xl px-4 py-2.5 text-left">
                    <div className="size-7 rounded-lg bg-black/20 flex items-center justify-center text-[10px] font-bold text-black">{c[8]}</div>
                    <div>
                      <p className="text-xs font-bold text-black">{c}</p>
                      <p className="text-[10px] text-black/60">{[12, 45, 8][i]} employees · {["Free", "Starter", "Pro"][i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">Simple, transparent pricing</h2>
            <p className="text-muted-foreground mb-6">Start free. Scale as you grow. Cancel anytime.</p>
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-white p-1">
              <button onClick={() => setBilling("monthly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${billing === "monthly" ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>Monthly</button>
              <button onClick={() => setBilling("yearly")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${billing === "yearly" ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Yearly
                <span className="absolute -top-2 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: LIME + "cc", color: "hsl(82 60% 20%)" }}>-17%</span>
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl border p-7 flex flex-col relative ${plan.highlight ? "shadow-xl ring-2" : "bg-white shadow-sm"}`}
                style={plan.highlight ? { background: "white", borderColor: LIME, ringColor: LIME } : { borderColor: "hsl(220 15% 91%)" }}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-foreground" style={{ background: LIME }}>
                    Most Popular
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground text-lg">{plan.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-4xl font-extrabold text-foreground">${plan.price[billing]}</span>
                    {plan.price.monthly > 0 && <span className="text-muted-foreground text-sm mb-1.5">/mo{billing === "yearly" ? ", billed yearly" : ""}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mb-6">{plan.seats}</p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 shrink-0" style={{ color: "hsl(82 60% 35%)" }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href={`/register?plan=${plan.name.toLowerCase()}&billing=${billing}`}
                  className="mt-auto inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={plan.highlight ? { background: LIME, color: "hsl(82 60% 15%)" } : { background: "hsl(220 20% 96%)", color: "hsl(220 15% 15%)" }}>
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-foreground mb-3">Loved by HR teams</h2>
            <div className="flex justify-center gap-0.5 mb-2">{Array(5).fill(0).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" style={{ color: LIME }} />)}</div>
            <p className="text-muted-foreground">4.9/5 from 200+ reviews</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="rounded-2xl border border-border p-6">
                <div className="flex gap-0.5 mb-4">{Array(5).fill(0).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: LIME }} />)}</div>
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-xl bg-foreground flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-foreground text-center mb-12">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden">
                <button onClick={() => setFaq(faq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-4 text-left">
                  <span className="font-semibold text-foreground text-sm">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center" style={{ background: LIME }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-black mb-4">Ready to modernize your HR?</h2>
          <p className="text-black/70 mb-8">Join 500+ companies using HRPay to manage their teams.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-3.5 bg-black rounded-xl text-white font-bold hover:bg-black/90 transition-all text-base">
            Register your company <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="size-3 rounded-full" style={{ background: LIME }} />
              <div className="size-3 rounded-full bg-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground">HRPay</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 HRPay. Enterprise HR & Payroll Platform.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
