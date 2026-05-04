import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { useAuth } from "@/components/auth-context";
import {
  Search, BookOpen, Users, Calculator, Clock, CalendarDays,
  Shield, ListTodo, Building2, Briefcase, Target, FileText,
  Megaphone, Receipt, Package, GraduationCap, Network, BarChart3,
  Settings, Crown, ChevronDown, ChevronRight, ExternalLink,
  UserPlus, KeyRound, Zap, HelpCircle, CheckCircle2, ArrowRight,
  UserCog, LockKeyhole, LayoutDashboard, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const LIME = "hsl(82 80% 48%)";

/* ─── Types ─── */
interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  summary: string;
  content: Article[];
}
interface Article {
  title: string;
  body: React.ReactNode;
}

/* ─── Accordion item ─── */
function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-muted/30 transition-colors">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 text-sm text-muted-foreground space-y-2 border-t border-border bg-muted/10">{children}</div>}
    </div>
  );
}

/* ─── Step component ─── */
function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5 mt-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-foreground mt-0.5" style={{ background: LIME }}>
            {i + 1}
          </span>
          <span className="text-sm text-foreground leading-relaxed">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/* ─── Credential box ─── */
function CredBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2">
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-mono font-semibold text-foreground">{value}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="text-[10px] font-bold px-2 py-1 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}

/* ─── Info callout ─── */
function Callout({ type = "info", children }: { type?: "info" | "tip" | "warn"; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    tip: "border-border text-foreground",
    warn: "bg-amber-50 border-amber-200 text-amber-800",
  };
  const icons: Record<string, React.ElementType> = { info: HelpCircle, tip: CheckCircle2, warn: Shield };
  const Icon = icons[type];
  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles[type]}`}
      style={type === "tip" ? { background: LIME + "15" } : {}}>
      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/* ─── Role badge ─── */
function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    company_admin: "bg-foreground text-white",
    ceoo: "bg-indigo-600 text-white",
    manager: "bg-blue-600 text-white",
    supervisor: "bg-cyan-600 text-white",
    employee: "bg-muted text-foreground border border-border",
    super_admin: "bg-purple-600 text-white",
  };
  const labels: Record<string, string> = {
    company_admin: "Company Admin", ceoo: "CEOO", manager: "Manager",
    supervisor: "Supervisor", employee: "Employee", super_admin: "Super Admin",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${styles[role] ?? "bg-muted"}`}>
      {labels[role] ?? role}
    </span>
  );
}

/* ════════════════════════════════════════════════
   SECTION DEFINITIONS
════════════════════════════════════════════════ */
const SECTIONS: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    color: "bg-lime-100 text-lime-700",
    summary: "Login, registration, and first steps",
    content: [
      {
        title: "Logging In",
        body: (
          <div className="space-y-3">
            <p>There are two separate login portals — one for company employees and one for the platform Super Admin.</p>
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Company Employee Login</p>
              <CredBox label="URL" value={window.location.origin + "/login"} />
              <CredBox label="Demo Email" value="john@testcorp.com" />
              <CredBox label="Demo Password" value="Admin@123" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Super Admin Login</p>
              <CredBox label="URL" value={window.location.origin + "/login?portal=admin"} />
              <CredBox label="Super Admin Email" value="superadmin@hrpay.com" />
              <CredBox label="Super Admin Password" value="Admin@123" />
            </div>
            <Callout type="info">After logging in, you are automatically redirected based on your role — company users go to <strong>/dashboard</strong>, Super Admin goes to <strong>/super-admin</strong>.</Callout>
          </div>
        ),
      },
      {
        title: "Registering a New Company",
        body: (
          <div className="space-y-3">
            <p>Any business can self-register on HRPay. Here's how:</p>
            <Steps items={[
              "Go to the landing page and click \"Get Started Free\" or visit /register.",
              "Enter your Company Name, Industry, and Company Size.",
              "Fill in your Admin Name, Email, and set a password.",
              "Choose a plan — Free, Starter ($29/mo), or Pro ($99/mo).",
              "Click \"Create Account\" — you're taken directly to your dashboard.",
            ]} />
            <Callout type="tip">The Free plan supports up to 5 users and includes core HR features. You can upgrade anytime from Settings.</Callout>
          </div>
        ),
      },
      {
        title: "Navigating the Dashboard",
        body: (
          <div className="space-y-3">
            <p>Your dashboard changes based on your role:</p>
            <div className="space-y-2">
              {[
                { role: "company_admin", desc: "Full platform overview — KPIs, payroll charts, headcount, leave summary, and quick action buttons." },
                { role: "ceoo", desc: "Executive view with company-wide metrics and strategic charts." },
                { role: "manager", desc: "Team performance, attendance summary, pending approvals." },
                { role: "supervisor", desc: "Daily team attendance, pending time entries and leave requests." },
                { role: "employee", desc: "Personal leave balance, upcoming schedule, recent pay stubs, announcements." },
              ].map(({ role, desc }) => (
                <div key={role} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40">
                  <RoleBadge role={role} />
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "roles",
    title: "Role Hierarchy",
    icon: Crown,
    color: "bg-purple-100 text-purple-700",
    summary: "Understand the 5-tier role system",
    content: [
      {
        title: "Overview of Roles",
        body: (
          <div className="space-y-3">
            <p>HRPay uses a 5-level role hierarchy. Each role has different access permissions.</p>
            <div className="space-y-2">
              {[
                { role: "company_admin", level: "Level 5 (Highest)", desc: "Full access to everything. Manages team invitations, subscriptions, role permissions, and all HR modules. Only one per company." },
                { role: "ceoo", level: "Level 4", desc: "Full operational access — employees, payroll, time, leave, recruitment, performance, benefits, departments, expenses, and reports." },
                { role: "manager", level: "Level 3", desc: "Manages their team — employees, time, leave, recruitment, performance, departments, expenses, training, org chart." },
                { role: "supervisor", level: "Level 2", desc: "Day-to-day team oversight — employees, time, leave, announcements, org chart, training." },
                { role: "employee", level: "Level 1 (Lowest)", desc: "Self-service — personal time, leave requests, benefits, onboarding, announcements, expenses, training, org chart." },
              ].map(({ role, level, desc }) => (
                <div key={role} className="rounded-xl border border-border p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <RoleBadge role={role} />
                    <span className="text-[10px] text-muted-foreground font-medium">{level}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: "Changing a Member's Role",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Log in as Company Admin.",
              "Go to Team in the sidebar.",
              "Find the member in the Members table.",
              "Click the role dropdown in their row and select the new role.",
              "The change saves instantly — the user's sidebar and permissions update on next page load.",
            ]} />
            <Callout type="warn">You cannot change the Company Admin's role. There can only be one Company Admin per company.</Callout>
          </div>
        ),
      },
      {
        title: "Custom Role Permissions",
        body: (
          <div className="space-y-3">
            <p>Company Admins can fine-tune which features each role can access via the Permissions page.</p>
            <Steps items={[
              "Go to Permissions in the sidebar (only visible to Company Admin).",
              "Select a role tab — CEOO, Manager, Supervisor, or Employee.",
              "Toggle individual features on or off for that role.",
              "Click \"Save Permissions\" — changes apply immediately for all users with that role.",
            ]} />
            <Callout type="tip">This is useful if you want, for example, Supervisors to see payroll, or Employees to NOT see benefits — fully customisable per your company's needs.</Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: "team",
    title: "Team Management",
    icon: UserCog,
    color: "bg-blue-100 text-blue-700",
    summary: "Invite, manage, and organise your team",
    content: [
      {
        title: "Inviting a New Member",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Log in as Company Admin (or CEOO/Manager).",
              "Click \"Team\" in the left sidebar.",
              "Click the \"Invite Member\" button (top right).",
              "Fill in the person's Full Name, Email, and select their Role.",
              "Click \"Send Invite\" — an account is created instantly.",
              "Copy the temporary password shown and share it with the person.",
              "The person logs in at /login with their email and temp password.",
            ]} />
            <Callout type="tip">The temp password is also always visible in the Invitations tab so you can retrieve it later if needed.</Callout>
          </div>
        ),
      },
      {
        title: "Deactivating / Reactivating a Member",
        body: (
          <div className="space-y-3">
            <p>When someone leaves the company, deactivate their account to prevent login without deleting their data.</p>
            <Steps items={[
              "Go to Team → Members tab.",
              "Find the member and click \"Deactivate\" in the Actions column.",
              "The user immediately loses login access.",
              "To restore access, click \"Activate\" on the same row.",
            ]} />
          </div>
        ),
      },
      {
        title: "Viewing Pending Invitations",
        body: (
          <div className="space-y-3">
            <p>Switch to the <strong>Invitations</strong> tab in Team Management to see all sent invitations with their status:</p>
            <div className="space-y-1.5">
              {[
                { status: "pending", color: "bg-amber-100 text-amber-700", desc: "Invitation created, user hasn't logged in yet." },
                { status: "accepted", color: "bg-emerald-100 text-emerald-700", desc: "User has logged in and the account is active." },
                { status: "expired", color: "bg-gray-100 text-gray-500", desc: "Invitation link has expired (7 days). Re-invite the person." },
              ].map(({ status, color, desc }) => (
                <div key={status} className="flex items-start gap-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize shrink-0 mt-0.5 ${color}`}>{status}</span>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "employees",
    title: "Employees",
    icon: Users,
    color: "bg-indigo-100 text-indigo-700",
    summary: "Employee directory, profiles and records",
    content: [
      {
        title: "Adding an Employee",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to Employees in the sidebar.",
              "Click \"Add Employee\" (top right).",
              "Fill in personal details: name, email, position, department, employment type.",
              "Set the start date and salary.",
              "Click \"Save Employee\" — they appear in the directory immediately.",
            ]} />
            <Callout type="info">Adding an employee record is different from inviting a team member. An employee record stores HR data. An invited member gets a login account. A person can be both.</Callout>
          </div>
        ),
      },
      {
        title: "Switching Between Table and Grid View",
        body: (
          <p>Click the <strong>List</strong> or <strong>Grid</strong> icon buttons on the top right of the Employees page to toggle between a table view (more data) and a card view (more visual).</p>
        ),
      },
      {
        title: "Filtering Employees",
        body: (
          <div className="space-y-2">
            <p>Use the filters at the top of the Employees page:</p>
            <ul className="space-y-1 text-sm">
              <li><strong>Search:</strong> Type a name or position to filter in real-time.</li>
              <li><strong>Department:</strong> Filter to show only employees in a specific department.</li>
              <li><strong>Status:</strong> Active, Inactive, On Leave, or Terminated.</li>
            </ul>
          </div>
        ),
      },
    ],
  },
  {
    id: "payroll",
    title: "Payroll",
    icon: Calculator,
    color: "bg-emerald-100 text-emerald-700",
    summary: "Payroll runs, pay stubs and history",
    content: [
      {
        title: "Creating a Payroll Run",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to Payroll in the sidebar.",
              "Click \"New Payroll Run\".",
              "Give the run a name (e.g. \"May 2025 Bi-weekly\").",
              "Set the Period Start and End dates, and the Pay Date.",
              "Click \"Create Run\" — a draft run is created.",
              "Open the draft run to review employees and set pay amounts.",
              "Click \"Process\" to complete the payroll run.",
            ]} />
            <Callout type="warn">Payroll is a Starter and Pro plan feature. Free plan users will see an upgrade prompt.</Callout>
          </div>
        ),
      },
      {
        title: "Viewing Pay History",
        body: (
          <p>Completed payroll runs appear in the Payroll page under "Completed Runs". Click "View stubs" to see the breakdown per employee — gross pay, deductions, and net pay.</p>
        ),
      },
    ],
  },
  {
    id: "leave",
    title: "Leave Management",
    icon: CalendarDays,
    color: "bg-rose-100 text-rose-700",
    summary: "Leave requests, approvals and balances",
    content: [
      {
        title: "Submitting a Leave Request",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to Leave Management in the sidebar.",
              "Click \"New Request\".",
              "Select the employee (admins/managers can submit for anyone).",
              "Choose leave type: Vacation, Sick, Personal, Maternity, Paternity, or Unpaid.",
              "Set the start and end dates.",
              "Add an optional reason and click \"Submit Request\".",
            ]} />
          </div>
        ),
      },
      {
        title: "Approving or Rejecting Requests",
        body: (
          <div className="space-y-3">
            <p>Pending requests appear in the amber alert box at the top of the Leave page.</p>
            <Steps items={[
              "Find the pending request in the highlighted section.",
              "Click the green checkmark ✓ to approve, or the red ✗ to reject.",
              "The request status updates immediately.",
            ]} />
          </div>
        ),
      },
    ],
  },
  {
    id: "time",
    title: "Time & Attendance",
    icon: Clock,
    color: "bg-amber-100 text-amber-700",
    summary: "Log time, clock in/out and approvals",
    content: [
      {
        title: "Logging a Time Entry",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to Time & Attendance in the sidebar.",
              "Click \"Log Time\".",
              "Select the employee and the date.",
              "Enter Clock In / Clock Out times OR type hours manually.",
              "Click \"Save Entry\" — the entry appears as pending.",
            ]} />
          </div>
        ),
      },
      {
        title: "Approving Time Entries",
        body: (
          <p>Pending entries appear in the amber banner at the top. Click the green checkmark next to each entry to approve it. Approved entries count towards payroll calculations.</p>
        ),
      },
    ],
  },
  {
    id: "announcements",
    title: "Announcements",
    icon: Megaphone,
    color: "bg-orange-100 text-orange-700",
    summary: "Company-wide communications",
    content: [
      {
        title: "Creating an Announcement",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to Announcements in the sidebar.",
              "Click \"New Announcement\".",
              "Write a title and the announcement content.",
              "Set a priority: Urgent, High, Normal, or Low.",
              "Click \"Post\" — all team members see it immediately in the notification bell.",
            ]} />
            <Callout type="tip">Urgent and High priority announcements show a red/orange icon in the notification bell to draw attention.</Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: "subscriptions",
    title: "Plans & Billing",
    icon: Zap,
    color: "bg-violet-100 text-violet-700",
    summary: "Plans, features and how to upgrade",
    content: [
      {
        title: "Plan Comparison",
        body: (
          <div className="space-y-3">
            <div className="space-y-2">
              {[
                {
                  plan: "Free", price: "$0/mo", seats: "Up to 5 users",
                  features: ["Employees", "Time & Attendance", "Leave Management", "Announcements", "Org Chart", "Onboarding"],
                },
                {
                  plan: "Starter", price: "$29/mo", seats: "Up to 50 users",
                  features: ["Everything in Free", "Payroll", "Benefits", "Departments", "Expenses", "Training", "Assets", "Team Management"],
                },
                {
                  plan: "Pro", price: "$99/mo", seats: "Unlimited users",
                  features: ["Everything in Starter", "Recruitment", "Performance Reviews", "Advanced Reports"],
                },
              ].map(({ plan, price, seats, features }) => (
                <div key={plan} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-foreground">{plan}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-foreground">{price}</span>
                      <span className="text-[10px] text-muted-foreground block">{seats}</span>
                    </div>
                  </div>
                  <ul className="space-y-0.5">
                    {features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ),
      },
      {
        title: "How to Upgrade",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Click \"Upgrade\" in the sidebar bottom card, or go to /upgrade.",
              "Choose your desired plan and billing cycle (monthly saves 0%, yearly saves ~17%).",
              "Contact your Super Admin or use the upgrade page to change your plan.",
            ]} />
            <Callout type="info">Only the Company Admin can upgrade the plan. Other roles see an informational upgrade prompt but cannot change the subscription.</Callout>
          </div>
        ),
      },
    ],
  },
  {
    id: "super-admin",
    title: "Super Admin",
    icon: Shield,
    color: "bg-gray-100 text-gray-700",
    summary: "Platform-level management (Super Admin only)",
    content: [
      {
        title: "Accessing the Super Admin Panel",
        body: (
          <div className="space-y-3">
            <Steps items={[
              "Go to /login?portal=admin (or click \"Super Admin Portal\" in the landing page footer).",
              "Log in with superadmin@hrpay.com / Admin@123.",
              "You land on the Super Admin Dashboard at /super-admin.",
            ]} />
            <CredBox label="Super Admin Email" value="superadmin@hrpay.com" />
            <CredBox label="Super Admin Password" value="Admin@123" />
            <Callout type="warn">The Super Admin portal is completely separate from company logins. Logging in at /login as a company user does not give Super Admin access.</Callout>
          </div>
        ),
      },
      {
        title: "Managing Companies",
        body: (
          <div className="space-y-3">
            <p>From the Super Admin panel → <strong>Companies</strong> page:</p>
            <ul className="space-y-1.5 text-sm">
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />Search and filter companies by plan or status.</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />Click the edit icon to change a company's plan or status inline.</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />Click the ⚠ icon to suspend a company instantly.</li>
              <li className="flex items-start gap-2"><ArrowRight className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />Click ✓ to reactivate a suspended company.</li>
            </ul>
          </div>
        ),
      },
      {
        title: "Managing Subscriptions",
        body: (
          <p>From <strong>Subscriptions</strong> page, you can change a company's plan, billing cycle, seats, and subscription status. All changes are saved instantly with the "Save" button in the inline edit row.</p>
        ),
      },
    ],
  },
  {
    id: "faq",
    title: "FAQ",
    icon: HelpCircle,
    color: "bg-slate-100 text-slate-700",
    summary: "Frequently asked questions",
    content: [
      {
        title: "Common Questions",
        body: (
          <div className="space-y-2">
            {[
              { q: "I forgot my password — how do I reset it?", a: "Contact your Company Admin. They can view your temp password in the Invitations tab under Team Management, or deactivate and re-invite your account." },
              { q: "Can I have multiple Company Admins?", a: "No. Each company has exactly one Company Admin. You can assign CEOO role for near-equivalent access." },
              { q: "What happens when I suspend a company (Super Admin)?", a: "The company's users lose login access immediately. Their data is preserved and access can be restored at any time by clicking Reactivate." },
              { q: "How do I add someone to a department?", a: "Go to Employees → open the employee's profile → set their Department field." },
              { q: "Are the payroll calculations automated?", a: "Yes — when you process a payroll run, HRPay pulls each employee's salary, approved time entries, and deductions to auto-calculate gross and net pay." },
              { q: "Can features be hidden from specific roles?", a: "Yes. Go to Permissions in the sidebar (Company Admin only) and toggle features for each role." },
              { q: "How do I change my plan from monthly to yearly?", a: "Contact your Super Admin or go to the Super Admin panel → Subscriptions → edit your company's billing cycle." },
              { q: "Is there a free trial for paid plans?", a: "Yes — paid plans include a 14-day trial period when registering a new company." },
            ].map(({ q, a }) => (
              <Accordion key={q} title={q}>
                <p>{a}</p>
              </Accordion>
            ))}
          </div>
        ),
      },
    ],
  },
];

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function Help() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return SECTIONS;
    const q = search.toLowerCase();
    return SECTIONS.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.content.some(a => a.title.toLowerCase().includes(q))
    );
  }, [search]);

  const section = SECTIONS.find(s => s.id === activeSection) ?? SECTIONS[0];
  const isSearching = search.trim() !== "";

  return (
    <div className="flex gap-0 border border-border rounded-2xl bg-white overflow-hidden shadow-sm" style={{ height: "calc(100vh - 8.5rem)" }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white flex flex-col shadow-2xl overflow-hidden">
            <div className="p-3.5 border-b border-border flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search help…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-border text-xs bg-muted/30 focus:outline-none" />
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {(isSearching ? filtered : SECTIONS).map(s => (
                <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(""); setSidebarOpen(false); }}
                  className={cn("w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                    activeSection === s.id && !isSearching ? "bg-foreground text-white shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                  <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px]",
                    activeSection === s.id && !isSearching ? "bg-white/20" : s.color)}>
                    <s.icon className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-xs font-semibold truncate">{s.title}</p>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Left sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-white flex-col overflow-hidden">
        <div className="p-3.5 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search help…"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-border text-xs bg-muted/30 focus:outline-none"
            />
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {(isSearching ? filtered : SECTIONS).map(s => (
            <button key={s.id} onClick={() => { setActiveSection(s.id); setSearch(""); }}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all",
                activeSection === s.id && !isSearching
                  ? "bg-foreground text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}>
              <div className={cn("flex size-6 shrink-0 items-center justify-center rounded-lg text-[10px]",
                activeSection === s.id && !isSearching ? "bg-white/20" : s.color)}>
                <s.icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{s.title}</p>
                <p className={cn("text-[10px] truncate", activeSection === s.id && !isSearching ? "text-white/60" : "text-muted-foreground")}>
                  {s.summary}
                </p>
              </div>
            </button>
          ))}
        </nav>

        {/* Quick links */}
        <div className="p-3 border-t border-border space-y-1">
          <Link href="/dashboard" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <LayoutDashboard className="h-3.5 w-3.5" /> Back to Dashboard
          </Link>
          <Link href="/team" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded-lg hover:bg-muted transition-colors">
            <UserPlus className="h-3.5 w-3.5" /> Invite Team Members
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-muted/20">
        {/* Mobile header bar */}
        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-white sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all">
            <BookOpen className="h-3.5 w-3.5" /> Browse Topics
          </button>
          <span className="text-xs text-muted-foreground truncate">{section.title}</span>
        </div>
        {isSearching ? (
          <div className="p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{search}"</p>
            {filtered.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`flex size-7 items-center justify-center rounded-xl ${s.color}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">{s.title}</h2>
                </div>
                <div className="space-y-2">
                  {s.content.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) || s.title.toLowerCase().includes(search.toLowerCase())).map(a => (
                    <button key={a.title} onClick={() => { setActiveSection(s.id); setSearch(""); }}
                      className="w-full text-left flex items-center gap-2 p-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors">
                      <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium text-foreground">{a.title}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <HelpCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No results for "{search}"</p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 max-w-3xl mx-auto space-y-5">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-2xl ${section.color}`}>
                <section.icon className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-foreground">{section.title}</h1>
                <p className="text-sm text-muted-foreground">{section.summary}</p>
              </div>
            </div>

            {/* Articles */}
            {section.content.map(article => (
              <div key={article.title} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  {article.title}
                </h2>
                <div className="text-sm text-muted-foreground">{article.body}</div>
              </div>
            ))}

            {/* Pagination */}
            <div className="flex items-center justify-between pt-2">
              {(() => {
                const idx = SECTIONS.findIndex(s => s.id === activeSection);
                const prev = SECTIONS[idx - 1];
                const next = SECTIONS[idx + 1];
                return (
                  <>
                    {prev ? (
                      <button onClick={() => setActiveSection(prev.id)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-all">
                        ← {prev.title}
                      </button>
                    ) : <div />}
                    {next ? (
                      <button onClick={() => setActiveSection(next.id)}
                        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-all">
                        {next.title} →
                      </button>
                    ) : <div />}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
