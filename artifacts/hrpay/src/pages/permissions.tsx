import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import {
  usePermissions, PermissionsMap, PowerPermissionsMap,
  DEFAULT_PERMISSIONS, DEFAULT_POWERS, ALL_FEATURES, ALL_POWERS,
  FeatureKey, RoleKey, PowerKey,
} from "@/components/permissions-context";
import {
  Users, Calculator, Clock, CalendarDays, Shield, Briefcase, Target,
  ListTodo, Building2, Megaphone, Receipt, Package, GraduationCap,
  Network, FileText, Save, RotateCcw, Check, UserCog, BarChart3, Loader2,
  ChevronDown, ChevronUp, Info, Zap, Eye, Pencil, CheckSquare, Settings,
  UserPlus, DollarSign, ShieldCheck, Layout,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

/* ─── Feature metadata ─── */
export const FEATURE_LABELS: Record<FeatureKey, { label: string; icon: React.ElementType; desc: string; category: string }> = {
  employees:    { label: "Employees",        icon: Users,         desc: "View and manage employee directory",       category: "Core HR" },
  payroll:      { label: "Payroll",           icon: Calculator,    desc: "View and process payroll runs",            category: "Finance" },
  time:         { label: "Time & Attendance", icon: Clock,         desc: "Log and approve time entries",             category: "Core HR" },
  leave:        { label: "Leave Management",  icon: CalendarDays,  desc: "Submit and approve leave requests",        category: "Core HR" },
  recruitment:  { label: "Recruitment",       icon: Briefcase,     desc: "Manage job posts and candidates",          category: "Talent" },
  performance:  { label: "Performance",       icon: Target,        desc: "Review cycles and ratings",                category: "Talent" },
  benefits:     { label: "Benefits",          icon: Shield,        desc: "View and enroll in benefit plans",         category: "Finance" },
  onboarding:   { label: "Onboarding",        icon: ListTodo,      desc: "Task checklists for new hires",            category: "Core HR" },
  departments:  { label: "Departments",       icon: Building2,     desc: "Browse department structure",              category: "Core HR" },
  announcements:{ label: "Announcements",     icon: Megaphone,     desc: "View company announcements",               category: "Communication" },
  expenses:     { label: "Expenses",          icon: Receipt,       desc: "Submit and review expenses",               category: "Finance" },
  assets:       { label: "Assets",            icon: Package,       desc: "Company asset registry",                   category: "Operations" },
  training:     { label: "Training",          icon: GraduationCap, desc: "Learning modules and courses",             category: "Talent" },
  "org-chart":  { label: "Org Chart",         icon: Network,       desc: "Company org chart view",                   category: "Core HR" },
  reports:      { label: "Reports",           icon: BarChart3,     desc: "HR analytics and reports",                 category: "Operations" },
  team:         { label: "Team Management",   icon: UserCog,       desc: "Invite members and manage roles",          category: "Operations" },
};

/* ─── Power metadata ─── */
export const POWER_LABELS: Record<PowerKey, { label: string; icon: React.ElementType; desc: string; category: string }> = {
  manage_employees:     { label: "Manage Employees",      icon: Users,        desc: "Add, edit, and delete employee records. View salary and sensitive information.", category: "Employee" },
  process_payroll:      { label: "Process Payroll",        icon: Calculator,   desc: "Create payroll runs and execute payroll processing for the company.",            category: "Finance" },
  approve_leave:        { label: "Approve Leave",          icon: CalendarDays, desc: "Approve or reject employee leave and time-off requests.",                        category: "HR Operations" },
  approve_time:         { label: "Approve Time Entries",   icon: Clock,        desc: "Approve or reject employee time and attendance entries.",                        category: "HR Operations" },
  approve_expenses:     { label: "Approve Expenses",       icon: Receipt,      desc: "Approve or reject employee expense claims and reimbursements.",                  category: "Finance" },
  manage_departments:   { label: "Manage Departments",     icon: Building2,    desc: "Create, edit, and delete departments. Assign department managers.",              category: "HR Operations" },
  manage_benefits:      { label: "Manage Benefits",        icon: Shield,       desc: "Create and edit benefit plans. Manage employee benefit enrollments.",            category: "Finance" },
  manage_recruitment:   { label: "Manage Recruitment",     icon: Briefcase,    desc: "Create and edit job postings. Manage candidates and update application status.", category: "Talent" },
  manage_performance:   { label: "Manage Performance",     icon: Target,       desc: "Create review cycles, set goals, and update performance ratings.",              category: "Talent" },
  manage_training:      { label: "Manage Training",        icon: GraduationCap,desc: "Create courses and manage employee training enrollment.",                       category: "Talent" },
  manage_assets:        { label: "Manage Assets",          icon: Package,      desc: "Add, assign, and retire company assets.",                                        category: "Operations" },
  publish_announcements:{ label: "Publish Announcements",  icon: Megaphone,    desc: "Create, edit, pin, and delete company-wide announcements.",                     category: "Operations" },
  view_reports:         { label: "View Reports",           icon: BarChart3,    desc: "Access all analytics dashboards, headcount, payroll, and leave reports.",       category: "Operations" },
  invite_members:       { label: "Invite Members",         icon: UserPlus,     desc: "Send team invitations and assign roles to new members.",                        category: "Administration" },
  edit_settings:        { label: "Edit Company Settings",  icon: Settings,     desc: "Modify company profile, locale, payroll config, and notification settings.",    category: "Administration" },
  manage_permissions:   { label: "Manage Permissions",     icon: ShieldCheck,  desc: "Edit role feature access and power grants. High-trust permission.",             category: "Administration" },
};

const FEATURE_CATEGORIES = ["Core HR", "Finance", "Talent", "Communication", "Operations"] as const;
const POWER_CATEGORIES = ["Employee", "Finance", "HR Operations", "Talent", "Operations", "Administration"] as const;

const ROLES: { key: RoleKey; label: string; badgeClass: string; desc: string }[] = [
  { key: "ceoo",       label: "CEOO",       badgeClass: "bg-indigo-600 text-white",      desc: "Executive" },
  { key: "manager",    label: "Manager",    badgeClass: "bg-blue-600 text-white",         desc: "Dept. lead" },
  { key: "supervisor", label: "Supervisor", badgeClass: "bg-cyan-600 text-white",         desc: "Team lead" },
  { key: "employee",   label: "Employee",   badgeClass: "bg-slate-200 text-slate-700",    desc: "Staff member" },
];

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${checked ? "" : "bg-muted"}`}
      style={checked ? { background: LIME } : {}}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

type Tab = "features" | "powers";

export default function Permissions() {
  const { token } = useAuth();
  const { refetch } = usePermissions();
  const [tab, setTab] = useState<Tab>("powers");
  const [perms, setPerms] = useState<PermissionsMap>(DEFAULT_PERMISSIONS);
  const [powers, setPowers] = useState<PowerPermissionsMap>(DEFAULT_POWERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/companies/permissions", { headers: apiHeaders(token) })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.permissions) setPerms(d.permissions);
        if (d?.powers) setPowers(d.powers);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  /* ── Feature toggles ── */
  function toggleFeature(role: RoleKey, feature: FeatureKey, value: boolean) {
    setPerms(p => ({ ...p, [role]: { ...p[role], [feature]: value } }));
  }
  function enableAllRole(role: RoleKey) {
    setPerms(p => ({ ...p, [role]: Object.fromEntries(ALL_FEATURES.map(f => [f, true])) as Record<FeatureKey, boolean> }));
  }
  function disableAllRole(role: RoleKey) {
    setPerms(p => ({ ...p, [role]: Object.fromEntries(ALL_FEATURES.map(f => [f, false])) as Record<FeatureKey, boolean> }));
  }
  function resetRole(role: RoleKey) {
    setPerms(p => ({ ...p, [role]: { ...DEFAULT_PERMISSIONS[role] } }));
  }
  function enableFeatureAllRoles(feature: FeatureKey) {
    setPerms(p => { const n = { ...p }; ROLES.forEach(r => { n[r.key] = { ...n[r.key], [feature]: true }; }); return n; });
  }
  function disableFeatureAllRoles(feature: FeatureKey) {
    setPerms(p => { const n = { ...p }; ROLES.forEach(r => { n[r.key] = { ...n[r.key], [feature]: false }; }); return n; });
  }
  function toggleFeatureCategory(cat: string, on: boolean) {
    const features = ALL_FEATURES.filter(f => FEATURE_LABELS[f].category === cat);
    setPerms(p => {
      const n = { ...p };
      ROLES.forEach(r => { n[r.key] = { ...n[r.key] }; features.forEach(f => { n[r.key][f] = on; }); });
      return n;
    });
  }

  /* ── Power toggles ── */
  function togglePower(role: RoleKey, power: PowerKey, value: boolean) {
    setPowers(p => ({ ...p, [role]: { ...p[role], [power]: value } }));
  }
  function enableAllPowers(role: RoleKey) {
    setPowers(p => ({ ...p, [role]: Object.fromEntries(ALL_POWERS.map(pw => [pw, true])) as Record<PowerKey, boolean> }));
  }
  function disableAllPowers(role: RoleKey) {
    setPowers(p => ({ ...p, [role]: Object.fromEntries(ALL_POWERS.map(pw => [pw, false])) as Record<PowerKey, boolean> }));
  }
  function resetPowers(role: RoleKey) {
    setPowers(p => ({ ...p, [role]: { ...DEFAULT_POWERS[role] } }));
  }
  function enablePowerAllRoles(power: PowerKey) {
    setPowers(p => { const n = { ...p }; ROLES.forEach(r => { n[r.key] = { ...n[r.key], [power]: true }; }); return n; });
  }
  function disablePowerAllRoles(power: PowerKey) {
    setPowers(p => { const n = { ...p }; ROLES.forEach(r => { n[r.key] = { ...n[r.key], [power]: false }; }); return n; });
  }
  function togglePowerCategory(cat: string, on: boolean) {
    const pwrs = ALL_POWERS.filter(pw => POWER_LABELS[pw].category === cat);
    setPowers(p => {
      const n = { ...p };
      ROLES.forEach(r => { n[r.key] = { ...n[r.key] }; pwrs.forEach(pw => { n[r.key][pw] = on; }); });
      return n;
    });
  }

  function toggleCatCollapse(cat: string) {
    setCollapsedCats(prev => { const s = new Set(prev); s.has(cat) ? s.delete(cat) : s.add(cat); return s; });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/companies/permissions", {
      method: "PUT",
      headers: apiHeaders(token),
      body: JSON.stringify({ permissions: perms, powers }),
    });
    setSaving(false);
    setSaved(true);
    refetch();
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const featureCountForRole = (role: RoleKey) => ALL_FEATURES.filter(f => perms[role]?.[f] ?? true).length;
  const powerCountForRole = (role: RoleKey) => ALL_POWERS.filter(pw => powers[role]?.[pw] ?? false).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Role Permissions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control module access and action powers for each role. Company Admins always have full access.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all disabled:opacity-60 shrink-0"
          style={{ background: LIME }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 border border-border rounded-xl w-fit">
        <button
          onClick={() => { setTab("powers"); setCollapsedCats(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "powers" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Zap className="h-4 w-4" /> Powers
        </button>
        <button
          onClick={() => { setTab("features"); setCollapsedCats(new Set()); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === "features" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Layout className="h-4 w-4" /> Module Access
        </button>
      </div>

      {/* ── POWERS TAB ── */}
      {tab === "powers" && (
        <>
          {/* Role summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROLES.map(r => {
              const count = powerCountForRole(r.key);
              const pct = Math.round((count / ALL_POWERS.length) * 100);
              return (
                <div key={r.key} className="bg-white rounded-2xl border border-border p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.badgeClass}`}>{r.label}</span>
                    <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl font-bold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">/ {ALL_POWERS.length} powers</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: LIME }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-0.5">
                    <button onClick={() => enableAllPowers(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">All on</button>
                    <button onClick={() => disableAllPowers(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">All off</button>
                    <button onClick={() => resetPowers(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">Reset</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin always-on banner */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium border border-border" style={{ background: LIME + "15" }}>
            <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: "hsl(82 60% 35%)" }} />
            <span><span className="font-bold">Company Admin</span> always has all powers regardless of these settings. Powers below apply to other roles only.</span>
          </div>

          {/* Powers matrix */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)", minWidth: "600px" }}>
                <div className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">Power / Capability</div>
                <div className="px-2 py-3.5 text-xs font-semibold text-muted-foreground text-center border-l border-border">All roles</div>
                {ROLES.map(r => (
                  <div key={r.key} className="px-4 py-3.5 border-l border-border flex items-center justify-center">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.badgeClass}`}>{r.label}</span>
                  </div>
                ))}
              </div>

              {POWER_CATEGORIES.map(cat => {
                const catPowers = ALL_POWERS.filter(pw => POWER_LABELS[pw].category === cat);
                if (catPowers.length === 0) return null;
                const isCollapsed = collapsedCats.has(cat);
                return (
                  <div key={cat} className="border-t border-border">
                    <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 border-b border-border">
                      <button onClick={() => toggleCatCollapse(cat)} className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-foreground/70 transition-colors">
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        {cat}
                        <span className="font-normal text-muted-foreground">({catPowers.length} powers)</span>
                      </button>
                      <div className="flex gap-1.5">
                        <button onClick={() => togglePowerCategory(cat, true)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">Enable all</button>
                        <button onClick={() => togglePowerCategory(cat, false)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">Disable all</button>
                      </div>
                    </div>
                    {!isCollapsed && catPowers.map((power, i) => {
                      const info = POWER_LABELS[power];
                      const Icon = info.icon;
                      const allOn = ROLES.every(r => powers[r.key]?.[power] ?? false);
                      return (
                        <div key={power}
                          className={`grid hover:bg-muted/20 transition-colors divide-x divide-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                          style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)" }}>
                          <div className="flex items-center gap-3 px-5 py-3">
                            <div className="flex size-7 items-center justify-center rounded-lg shrink-0" style={{ background: LIME + "20" }}>
                              <Icon className="h-3.5 w-3.5" style={{ color: "hsl(82 60% 35%)" }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{info.label}</p>
                              <p className="text-[11px] text-muted-foreground leading-snug">{info.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center px-2">
                            <button
                              onClick={() => allOn ? disablePowerAllRoles(power) : enablePowerAllRoles(power)}
                              className={`text-[10px] font-medium rounded-lg px-1.5 py-1 border transition-all whitespace-nowrap ${allOn ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                              {allOn ? "Off all" : "On all"}
                            </button>
                          </div>
                          {ROLES.map(r => (
                            <div key={r.key} className="flex items-center justify-center px-4 py-3">
                              <Toggle
                                checked={powers[r.key]?.[power] ?? false}
                                onChange={(v) => togglePower(r.key, power, v)}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── FEATURE ACCESS TAB ── */}
      {tab === "features" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ROLES.map(r => {
              const count = featureCountForRole(r.key);
              const pct = Math.round((count / ALL_FEATURES.length) * 100);
              return (
                <div key={r.key} className="bg-white rounded-2xl border border-border p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.badgeClass}`}>{r.label}</span>
                    <span className="text-[10px] text-muted-foreground">{r.desc}</span>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xl font-bold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">/ {ALL_FEATURES.length} modules</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: LIME }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 pt-0.5">
                    <button onClick={() => enableAllRole(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">All on</button>
                    <button onClick={() => disableAllRole(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">All off</button>
                    <button onClick={() => resetRole(r.key)} className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">Reset</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)", minWidth: "560px" }}>
                <div className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">Feature / Module</div>
                <div className="px-2 py-3.5 text-xs font-semibold text-muted-foreground text-center border-l border-border">All roles</div>
                {ROLES.map(r => (
                  <div key={r.key} className="px-4 py-3.5 border-l border-border flex items-center justify-center">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.badgeClass}`}>{r.label}</span>
                  </div>
                ))}
              </div>
              {FEATURE_CATEGORIES.map(cat => {
                const catFeatures = ALL_FEATURES.filter(f => FEATURE_LABELS[f].category === cat);
                if (catFeatures.length === 0) return null;
                const isCollapsed = collapsedCats.has(cat);
                return (
                  <div key={cat} className="border-t border-border">
                    <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 border-b border-border">
                      <button onClick={() => toggleCatCollapse(cat)} className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-foreground/70 transition-colors">
                        {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                        {cat}
                        <span className="font-normal text-muted-foreground">({catFeatures.length} modules)</span>
                      </button>
                      <div className="flex gap-1.5">
                        <button onClick={() => toggleFeatureCategory(cat, true)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">Enable all</button>
                        <button onClick={() => toggleFeatureCategory(cat, false)} className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">Disable all</button>
                      </div>
                    </div>
                    {!isCollapsed && catFeatures.map((feature, i) => {
                      const info = FEATURE_LABELS[feature];
                      const Icon = info.icon;
                      const featureOn = ROLES.every(r => perms[r.key]?.[feature] ?? true);
                      return (
                        <div key={feature}
                          className={`grid hover:bg-muted/20 transition-colors divide-x divide-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                          style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)" }}>
                          <div className="flex items-center gap-3 px-5 py-3">
                            <div className="flex size-7 items-center justify-center rounded-lg shrink-0" style={{ background: LIME + "20" }}>
                              <Icon className="h-3.5 w-3.5" style={{ color: "hsl(82 60% 35%)" }} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{info.label}</p>
                              <p className="text-[11px] text-muted-foreground">{info.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center px-2 gap-1">
                            <button
                              onClick={() => featureOn ? disableFeatureAllRoles(feature) : enableFeatureAllRoles(feature)}
                              className={`text-[10px] font-medium rounded-lg px-1.5 py-1 border transition-all whitespace-nowrap ${featureOn ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                              {featureOn ? "Off all" : "On all"}
                            </button>
                          </div>
                          {ROLES.map(r => (
                            <div key={r.key} className="flex items-center justify-center px-4 py-3">
                              <Toggle
                                checked={perms[r.key]?.[feature] ?? true}
                                onChange={(v) => toggleFeature(r.key, feature, v)}
                              />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Info note */}
      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground leading-relaxed flex gap-3">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-semibold text-foreground mb-1">How the two-layer system works</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="font-medium text-foreground">Module Access</span> controls which sections appear in the navigation for each role.</li>
            <li><span className="font-medium text-foreground">Powers</span> control what actions a role can perform — editing records, approving requests, processing payroll, and more.</li>
            <li><span className="font-medium text-foreground">Company Admin</span> always has all modules and powers regardless of these settings.</li>
            <li>Changes take effect for active sessions on next page load after clicking <span className="font-medium text-foreground">Save Changes</span>.</li>
            <li>Use <span className="font-medium text-foreground">Reset</span> on any role card to restore its default configuration.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
