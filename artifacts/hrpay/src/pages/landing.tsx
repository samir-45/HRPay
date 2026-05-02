import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Users, Calculator, Clock, CalendarDays, Shield, BarChart3,
  Check, ArrowRight, Building2, Star, ChevronDown, Zap,
  Target, Briefcase, GraduationCap, Receipt, Package, Network,
  Megaphone, ListTodo, Globe, Lock, TrendingUp, ChevronRight,
  Play, Award, CheckCircle2, ArrowUpRight, Layers, Settings,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";
const LIME_DARK = "hsl(82 60% 35%)";

/* ─── Data ─── */
const features = [
  { icon: Users,       title: "Employee Management",     desc: "Full lifecycle management from hire to retire — profiles, documents, org chart.", plan: "Free" },
  { icon: Calculator,  title: "Payroll Automation",       desc: "Automated payroll runs, multi-jurisdiction tax calculations and direct deposit.", plan: "Starter" },
  { icon: Clock,       title: "Time & Attendance",        desc: "Smart clock-in/out, timesheets, overtime rules and manager approvals.", plan: "Free" },
  { icon: CalendarDays,title: "Leave Management",         desc: "Custom PTO policies, leave requests and multi-level approval workflows.", plan: "Free" },
  { icon: Shield,      title: "Benefits Administration",  desc: "Health, dental, vision and retirement enrollment in one unified portal.", plan: "Starter" },
  { icon: Briefcase,   title: "Recruitment & ATS",        desc: "Job postings, pipeline management, interview scheduling and offer letters.", plan: "Pro" },
  { icon: Target,      title: "Performance Reviews",      desc: "360° reviews, goal tracking, peer feedback and performance calibration.", plan: "Pro" },
  { icon: BarChart3,   title: "Reports & Analytics",      desc: "Real-time headcount, payroll spend and HR dashboards with export.", plan: "Pro" },
  { icon: GraduationCap,title:"Training & LMS",           desc: "Course assignments, completion tracking and compliance training.", plan: "Starter" },
  { icon: Receipt,     title: "Expense Management",       desc: "Submit, approve and reimburse expenses with receipt capture.", plan: "Starter" },
  { icon: Network,     title: "Org Chart",                desc: "Live interactive org chart that auto-updates as your team grows.", plan: "Free" },
  { icon: Megaphone,   title: "Announcements",            desc: "Company-wide and department-level announcements with priority levels.", plan: "Free" },
];

const plans = [
  {
    name: "Free", price: { monthly: 0, yearly: 0 },
    desc: "Perfect for small teams getting started.",
    seats: "Up to 5 employees",
    features: ["Employee profiles & org chart", "Time & attendance tracking", "Leave management", "Announcements", "Onboarding checklists", "Community support"],
    cta: "Get Started Free", highlight: false, badge: null,
  },
  {
    name: "Starter", price: { monthly: 29, yearly: 24 },
    desc: "Everything you need to run a growing team.",
    seats: "Up to 50 employees",
    features: ["Everything in Free", "Full payroll automation", "Benefits administration", "Departments management", "Expense tracking", "Training & LMS", "Asset management", "Priority email support"],
    cta: "Start Free Trial", highlight: true, badge: "Most Popular",
  },
  {
    name: "Pro", price: { monthly: 99, yearly: 82 },
    desc: "Enterprise-grade HR for scaling companies.",
    seats: "Unlimited employees",
    features: ["Everything in Starter", "Recruitment & ATS", "Performance reviews", "Advanced reports & analytics", "Custom role permissions", "AI HR assistant", "API access", "Dedicated success manager"],
    cta: "Start Free Trial", highlight: false, badge: "Best Value",
  },
];

const testimonials = [
  { name: "Sarah Chen", role: "CEO, Nexora Labs", text: "HRPay cut our payroll processing time by 80%. The automation alone saves us an entire day every month. Worth every penny.", avatar: "SC", rating: 5, company: "42 employees · Pro" },
  { name: "Marcus Reid", role: "HR Director, Bluecore", text: "Finally an HR platform that feels modern. Our employees actually enjoy using the self-service portal — that's rare.", avatar: "MR", rating: 5, company: "180 employees · Starter" },
  { name: "Priya Sharma", role: "COO, Finwave", text: "The multi-tier role system is exactly what we needed. Managers see their teams, nothing more. Our compliance team is thrilled.", avatar: "PS", rating: 5, company: "31 employees · Pro" },
  { name: "James Okafor", role: "Founder, Stacklight", text: "Set up our entire HR stack in an afternoon. The onboarding workflow alone saved our ops team weeks of work.", avatar: "JO", rating: 5, company: "12 employees · Starter" },
  { name: "Elena Vasquez", role: "VP People, Orbis", text: "We switched from three separate tools to HRPay. One platform, one login, one source of truth. Game changer.", avatar: "EV", rating: 5, company: "220 employees · Pro" },
  { name: "Tom Nakamura", role: "HR Manager, Celio", text: "The reporting module alone justified the upgrade to Pro. I now have answers to board questions in seconds, not hours.", avatar: "TN", rating: 5, company: "75 employees · Pro" },
];

const roles = [
  { role: "Company Admin", desc: "Full access — manage everything, invite team, configure permissions", color: "bg-foreground text-white", dot: "#1a1a1a" },
  { role: "CEOO / Executive", desc: "View all modules, run executive reports, approve high-level workflows", color: "bg-indigo-600 text-white", dot: "#4f46e5" },
  { role: "Manager", desc: "Manage direct team — payroll, time, leave, performance", color: "bg-blue-500 text-white", dot: "#3b82f6" },
  { role: "Supervisor", desc: "Approve time & leave requests for their assigned team", color: "bg-cyan-500 text-white", dot: "#06b6d4" },
  { role: "Employee", desc: "Self-service — own profile, payslips, leave requests & more", color: "bg-muted text-foreground border border-border", dot: "#94a3b8" },
];

const faqs = [
  { q: "How does the free trial work?", a: "Starter and Pro plans include a 14-day free trial — no credit card required. When the trial ends, you're automatically moved to Free unless you add a payment method. You keep all your data either way." },
  { q: "Can I switch plans later?", a: "Yes. Upgrade or downgrade at any time from your admin dashboard. Upgrades take effect immediately. Downgrades take effect at the end of your billing period." },
  { q: "How does multi-tenancy work?", a: "Every company gets a completely isolated workspace. Data, users, and configurations are fully separated. No company can ever see another company's data." },
  { q: "Is my data secure?", a: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We run automated backups every 6 hours. We are SOC 2 Type II compliant." },
  { q: "How does role-based access work?", a: "Company Admins can invite users and assign them a role: CEOO, Manager, Supervisor, or Employee. Each role has predefined permissions, which Admins can further customize per module in the Permissions panel." },
  { q: "Can employees manage their own profiles?", a: "Yes. Employees have a self-service portal where they can view payslips, submit leave requests, clock in/out, update their profile, and complete onboarding tasks." },
  { q: "Do you offer an API?", a: "Yes, a REST API is available on Pro plans. You can integrate HRPay with your existing tools — HRIS, accounting software, Slack, and more." },
];

const integrationLogos = [
  { name: "Slack", bg: "#4A154B", letter: "S" },
  { name: "QuickBooks", bg: "#2CA01C", letter: "Q" },
  { name: "Xero", bg: "#13B5EA", letter: "X" },
  { name: "Workday", bg: "#F5821F", letter: "W" },
  { name: "BambooHR", bg: "#73C41D", letter: "B" },
  { name: "DocuSign", bg: "#FFCC00", letter: "D" },
  { name: "Zapier", bg: "#FF4A00", letter: "Z" },
  { name: "Greenhouse", bg: "#24B47E", letter: "G" },
];

/* ─── Animated Counter ─── */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = target / 50;
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(start));
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ─── Plan Badge ─── */
function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, string> = {
    Free: "bg-gray-100 text-gray-600",
    Starter: "bg-blue-100 text-blue-700",
    Pro: "bg-violet-100 text-violet-700",
  };
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${colors[plan]}`}>{plan}</span>;
}

/* ─── Section Header ─── */
function SectionHeader({ eyebrow, title, sub }: { eyebrow: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="text-center mb-14 max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground mb-4 shadow-sm">
        <span className="size-1.5 rounded-full" style={{ background: LIME }} />
        {eyebrow}
      </div>
      <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">{title}</h2>
      {sub && <p className="text-base text-muted-foreground leading-relaxed">{sub}</p>}
    </div>
  );
}

/* ─── Main ─── */
export default function Landing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [faq, setFaq] = useState<number | null>(null);
  const [activeFeatureGroup, setActiveFeatureGroup] = useState<"all" | "Free" | "Starter" | "Pro">("all");

  const filteredFeatures = activeFeatureGroup === "all"
    ? features
    : features.filter(f => {
        if (activeFeatureGroup === "Free") return f.plan === "Free";
        if (activeFeatureGroup === "Starter") return f.plan === "Free" || f.plan === "Starter";
        return true;
      });

  return (
    <div className="min-h-screen bg-white text-foreground antialiased">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1">
              <div className="size-4 rounded-full" style={{ background: LIME }} />
              <div className="size-4 rounded-full bg-foreground" />
            </div>
            <span className="font-extrabold text-lg text-foreground tracking-tight">HRPay</span>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground font-medium">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">Customers</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2">
              Sign in
            </Link>
            <Link href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all shadow-sm"
              style={{ background: LIME }}>
              Get started free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-6">
        {/* Background gradients */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full opacity-20 blur-3xl" style={{ background: `radial-gradient(circle, ${LIME}, transparent 70%)` }} />
          <div className="absolute top-40 left-10 w-64 h-64 rounded-full opacity-10 blur-2xl" style={{ background: LIME }} />
          <div className="absolute top-20 right-10 w-48 h-48 rounded-full opacity-10 blur-2xl bg-indigo-400" />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(hsl(0 0% 0%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 0%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="max-w-5xl mx-auto text-center relative">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-white/80 text-xs font-semibold text-muted-foreground mb-7 shadow-sm">
            <span className="flex size-2 rounded-full animate-pulse" style={{ background: LIME }} />
            Multi-tenant HR & Payroll SaaS · 17+ modules
            <ChevronRight className="h-3 w-3" />
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-foreground leading-[1.05] tracking-tight mb-7">
            The HR platform your<br />
            <span className="relative inline-block">
              <span style={{ color: LIME }}>whole team</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                <path d="M4 8 Q75 2 150 8 Q225 14 296 8" stroke={LIME} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
            {" "}will actually use
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            From onboarding to payroll, leave to performance — HRPay gives every role in your company exactly what they need, nothing more.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
            <Link href="/register"
              className="group inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold text-foreground hover:opacity-90 transition-all shadow-xl"
              style={{ background: LIME }}>
              Start free — no card needed
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <a href="#features"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold border border-border bg-white hover:bg-muted/50 transition-all shadow-sm">
              <Play className="h-4 w-4" />
              See how it works
            </a>
          </div>
          <p className="text-xs text-muted-foreground">14-day free trial on Starter & Pro · No credit card · Cancel anytime</p>

          {/* Stats bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden border border-border shadow-sm">
            {[
              { value: 500, suffix: "+", label: "Companies registered" },
              { value: 50000, suffix: "+", label: "Employees managed" },
              { value: 99.9, suffix: "%", label: "Platform uptime" },
              { value: 80, suffix: "%", label: "Avg. time saved on payroll" },
            ].map(({ value, suffix, label }) => (
              <div key={label} className="bg-white px-8 py-7 text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-foreground">
                  <Counter target={value} suffix={suffix} />
                </p>
                <p className="text-xs text-muted-foreground mt-1.5 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Logos / Social proof ── */}
      <section className="py-12 px-6 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold text-muted-foreground text-center mb-7 uppercase tracking-widest">Trusted by teams at</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["Nexora Labs", "Bluecore Inc.", "Finwave", "Stacklight", "Orbis Group", "Celio HR"].map(name => (
              <div key={name} className="flex items-center gap-2">
                <div className="size-6 rounded-md bg-foreground/20" />
                <span className="text-sm font-bold text-foreground">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="17+ modules"
            title={<>Everything your HR team<br />needs in one place</>}
            sub="From employees to payroll to performance — all modules are connected, with data flowing between them automatically."
          />

          {/* Plan filter */}
          <div className="flex justify-center gap-1.5 mb-10">
            {(["all", "Free", "Starter", "Pro"] as const).map(g => (
              <button key={g} onClick={() => setActiveFeatureGroup(g)}
                className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all capitalize ${activeFeatureGroup === g ? "bg-foreground text-white shadow-sm" : "bg-white border border-border text-muted-foreground hover:text-foreground"}`}>
                {g === "all" ? "All features" : g}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFeatures.map(({ icon: Icon, title, desc, plan }) => (
              <div key={title} className="group bg-white rounded-2xl border border-border p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl" style={{ background: LIME + "25" }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: LIME_DARK }} />
                  </div>
                  <PlanBadge plan={plan} />
                </div>
                <h3 className="font-bold text-foreground text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Quick setup"
            title="Up and running in minutes"
            sub="No IT required. Company admins can set up HRPay, invite their team, and run their first payroll on the same day."
          />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { step: "01", title: "Register your company", desc: "Sign up, pick a plan, and create your company workspace in under 2 minutes.", icon: Building2 },
              { step: "02", title: "Invite your team", desc: "Add employees, assign roles (Manager, Supervisor, Employee), and send invite emails with one click.", icon: Users },
              { step: "03", title: "Start managing HR", desc: "Run payroll, track time, manage leave, and get insights — everything works out of the box.", icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative">
                <div className="rounded-2xl border border-border bg-white p-7 h-full hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex size-10 items-center justify-center rounded-xl" style={{ background: LIME }}>
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <span className="text-2xl font-extrabold text-muted-foreground/20">{step}</span>
                  </div>
                  <h3 className="font-extrabold text-foreground text-base mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
                {step !== "03" && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 size-6 items-center justify-center rounded-full bg-white border border-border shadow-sm">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role Hierarchy ── */}
      <section className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground mb-5 shadow-sm">
                <span className="size-1.5 rounded-full" style={{ background: LIME }} />
                Role-based access control
              </div>
              <h2 className="text-3xl font-extrabold text-foreground mb-4">The right access for every role in your org</h2>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                5-tier role hierarchy built in. Company Admins control exactly which modules each role can access — and can customize permissions per role, per module.
              </p>
              <div className="space-y-2.5">
                {roles.map(({ role, desc, color, dot }) => (
                  <div key={role} className="flex items-start gap-3 group">
                    <div className="mt-0.5 flex items-center gap-2 shrink-0">
                      <div className="size-2 rounded-full" style={{ background: dot }} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-foreground">{role}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Admins can customize permissions per role in the Permissions panel</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Mock dashboard preview */}
              <div className="rounded-2xl border border-border bg-white shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
                  <div className="flex gap-1.5">
                    <div className="size-2.5 rounded-full bg-red-400" />
                    <div className="size-2.5 rounded-full bg-yellow-400" />
                    <div className="size-2.5 rounded-full" style={{ background: LIME }} />
                  </div>
                  <div className="flex-1 mx-3 h-5 rounded bg-muted/60 text-[10px] flex items-center px-2 text-muted-foreground">app.hrpay.com</div>
                </div>
                <div className="flex">
                  {/* Sidebar */}
                  <div className="w-32 border-r border-border bg-white p-2 space-y-0.5">
                    {[
                      { n: "Dashboard", a: true }, { n: "Employees", a: false },
                      { n: "Payroll", a: false }, { n: "Leave", a: false },
                      { n: "Reports", a: false },
                    ].map(({ n, a }) => (
                      <div key={n} className={`px-2 py-1.5 rounded-lg text-[10px] font-medium ${a ? "bg-foreground text-white" : "text-muted-foreground"}`}>{n}</div>
                    ))}
                    <div className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-muted-foreground/40">
                      🔒 Recruitment
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-3 space-y-2">
                    <div className="h-4 bg-muted rounded w-24" />
                    <div className="grid grid-cols-2 gap-1.5">
                      {Array(4).fill(0).map((_, i) => (
                        <div key={i} className="h-10 rounded-xl border border-border bg-muted/30" />
                      ))}
                    </div>
                    <div className="h-16 rounded-xl border border-border bg-muted/20" />
                  </div>
                </div>
              </div>

              {/* Multi-tenant illustration */}
              <div className="rounded-2xl border border-border overflow-hidden shadow-sm" style={{ background: LIME }}>
                <div className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Layers className="h-4 w-4 text-black/60" />
                    <span className="text-xs font-extrabold text-black/80 uppercase tracking-wide">Multi-tenant isolation</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Nexora Labs", emp: 42, plan: "Pro" },
                      { name: "Stacklight", emp: 12, plan: "Starter" },
                      { name: "Finwave", emp: 31, plan: "Pro" },
                    ].map(({ name, emp, plan }) => (
                      <div key={name} className="flex items-center gap-2.5 bg-black/10 rounded-xl px-3.5 py-2">
                        <div className="size-6 rounded-lg bg-black/25 flex items-center justify-center text-[9px] font-bold text-black">{name[0]}</div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold text-black">{name}</p>
                          <p className="text-[9px] text-black/60">{emp} employees</p>
                        </div>
                        <span className="text-[9px] font-bold bg-black/20 text-black px-1.5 py-0.5 rounded-full">{plan}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations ── */}
      <section className="py-20 px-6 bg-white border-y border-border">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-semibold text-muted-foreground mb-5">
            <span className="size-1.5 rounded-full" style={{ background: LIME }} />
            Integrations
          </div>
          <h2 className="text-2xl font-extrabold text-foreground mb-2">Works with your existing stack</h2>
          <p className="text-sm text-muted-foreground mb-10 max-w-lg mx-auto">Connect HRPay to the tools you already use via our REST API and native integrations.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {integrationLogos.map(({ name, bg, letter }) => (
              <div key={name} className="flex flex-col items-center gap-2">
                <div className="size-12 rounded-xl flex items-center justify-center text-white text-lg font-extrabold shadow-sm" style={{ background: bg }}>
                  {letter}
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-8">
            API available on Pro · <a href="#pricing" className="underline underline-offset-2">See plans</a>
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Customer stories"
            title={<>Loved by HR teams<br />around the world</>}
            sub="Don't take our word for it — here's what real users say about HRPay."
          />
          <div className="flex justify-center gap-1 mb-2">
            {Array(5).fill(0).map((_, i) => <Star key={i} className="h-5 w-5 fill-current" style={{ color: LIME }} />)}
          </div>
          <p className="text-center text-sm text-muted-foreground mb-12 font-medium">4.9 / 5 from 200+ reviews</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`rounded-2xl border border-border p-6 bg-white hover:shadow-md transition-shadow ${i === 1 ? "md:mt-6" : ""} ${i === 4 ? "lg:mt-6" : ""}`}>
                <div className="flex gap-0.5 mb-4">
                  {Array(t.rating).fill(0).map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-current" style={{ color: LIME }} />)}
                </div>
                <p className="text-sm text-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="size-9 rounded-xl bg-foreground flex items-center justify-center text-white text-xs font-bold shrink-0">{t.avatar}</div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple, transparent pricing"
            sub="Start free. No credit card required. Scale when you're ready."
          />

          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-1">
              <button onClick={() => setBilling("monthly")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === "monthly" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Monthly
              </button>
              <button onClick={() => setBilling("yearly")}
                className={`relative px-5 py-2 rounded-lg text-sm font-semibold transition-all ${billing === "yearly" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                Yearly
                <span className="absolute -top-2.5 -right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full" style={{ background: LIME, color: "hsl(82 60% 20%)" }}>-17%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl border flex flex-col p-7 transition-all ${plan.highlight ? "shadow-2xl" : "bg-white shadow-sm hover:shadow-md"}`}
                style={plan.highlight ? { background: "white", borderColor: LIME, boxShadow: `0 0 0 2px ${LIME}` } : { borderColor: "hsl(220 15% 91%)" }}>

                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap px-3.5 py-1 rounded-full text-[11px] font-extrabold"
                    style={{ background: plan.highlight ? LIME : "hsl(220 15% 20%)", color: plan.highlight ? "hsl(82 60% 15%)" : "white" }}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-5">
                  <p className="font-extrabold text-foreground text-xl">{plan.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.desc}</p>
                </div>

                <div className="mb-1">
                  <span className="text-5xl font-extrabold text-foreground">${plan.price[billing]}</span>
                  {plan.price.monthly > 0 && (
                    <span className="text-muted-foreground text-sm ml-1">
                      /mo{billing === "yearly" ? ", billed yearly" : ""}
                    </span>
                  )}
                </div>
                {plan.price.monthly > 0 && billing === "yearly" && (
                  <p className="text-xs font-semibold mb-1" style={{ color: LIME_DARK }}>
                    Save ${(plan.price.monthly - plan.price[billing]) * 12}/year
                  </p>
                )}
                <p className="text-xs text-muted-foreground mb-6 pb-5 border-b border-border">{plan.seats}</p>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: LIME_DARK }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={`/register?plan=${plan.name.toLowerCase()}&billing=${billing}`}
                  className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all"
                  style={plan.highlight
                    ? { background: LIME, color: "hsl(82 60% 15%)" }
                    : { background: "hsl(220 20% 96%)", color: "hsl(220 15% 15%)" }}>
                  {plan.cta} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-5 flex flex-col sm:flex-row items-center gap-4 justify-between">
            <div className="flex items-center gap-3">
              <Award className="h-6 w-6 shrink-0" style={{ color: LIME_DARK }} />
              <div>
                <p className="text-sm font-bold text-foreground">Enterprise plan available</p>
                <p className="text-xs text-muted-foreground">Custom seats, SSO, SLA, dedicated infrastructure. Contact us for a quote.</p>
              </div>
            </div>
            <button className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border border-border bg-white hover:bg-muted transition-all">
              Contact sales <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 px-6" style={{ background: "hsl(220 20% 97%)" }}>
        <div className="max-w-2xl mx-auto">
          <SectionHeader
            eyebrow="FAQ"
            title="Frequently asked questions"
          />
          <div className="space-y-2.5">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
                <button onClick={() => setFaq(faq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left gap-4">
                  <span className="font-semibold text-foreground text-sm">{f.q}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`} />
                </button>
                {faq === i && (
                  <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: "hsl(220 15% 10%)" }}>
        <div className="absolute inset-0 pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 0%, ${LIME}, transparent)` }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/60 mb-7">
            <span className="flex size-2 rounded-full animate-pulse" style={{ background: LIME }} />
            Join 500+ companies on HRPay
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to modernize<br />your HR operations?
          </h2>
          <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto">
            Set up your company in minutes. No IT required. Free plan available forever.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-extrabold text-foreground hover:opacity-90 transition-all shadow-2xl"
              style={{ background: LIME }}>
              Register your company free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white border border-white/20 hover:bg-white/5 transition-all">
              Sign in to your account
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-10 text-xs text-white/40 font-medium">
            {["14-day free trial", "No credit card required", "Cancel anytime", "GDPR compliant", "SOC 2 certified"].map(t => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" style={{ color: LIME }} />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-border px-6 pt-14 pb-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  <div className="size-4 rounded-full" style={{ background: LIME }} />
                  <div className="size-4 rounded-full bg-foreground" />
                </div>
                <span className="font-extrabold text-foreground">HRPay</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                Enterprise-grade HR & Payroll management for teams of all sizes.
              </p>
              <div className="flex gap-1 mt-4">
                {Array(5).fill(0).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" style={{ color: LIME }} />)}
                <span className="text-[10px] text-muted-foreground ml-1">4.9/5</span>
              </div>
            </div>
            {[
              { heading: "Product", links: ["Features", "Pricing", "Changelog", "Roadmap"] },
              { heading: "Company", links: ["About", "Blog", "Careers", "Press"] },
              { heading: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy", "GDPR"] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <p className="text-xs font-extrabold text-foreground uppercase tracking-widest mb-4">{heading}</p>
                <ul className="space-y-2.5">
                  {links.map(l => (
                    <li key={l}><a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{l}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-6">
            <p className="text-[11px] text-muted-foreground">© 2026 HRPay Inc. All rights reserved.</p>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Globe className="h-3 w-3" />
              Available worldwide · English
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
