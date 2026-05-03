import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { usePermissions, PermissionsMap, DEFAULT_PERMISSIONS, ALL_FEATURES, FeatureKey, RoleKey } from "@/components/permissions-context";
import {
  Users, Calculator, Clock, CalendarDays, Shield, Briefcase, Target,
  ListTodo, Building2, Megaphone, Receipt, Package, GraduationCap,
  Network, FileText, Save, RotateCcw, Check, UserCog, BarChart3, Loader2,
  ChevronDown, ChevronUp, Info,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

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

const CATEGORIES = ["Core HR", "Finance", "Talent", "Communication", "Operations"] as const;

const ROLES: { key: RoleKey; label: string; badgeClass: string; desc: string }[] = [
  { key: "ceoo",       label: "CEOO",       badgeClass: "bg-indigo-600 text-white",        desc: "Executive" },
  { key: "manager",    label: "Manager",    badgeClass: "bg-blue-600 text-white",           desc: "Department lead" },
  { key: "supervisor", label: "Supervisor", badgeClass: "bg-cyan-600 text-white",           desc: "Team lead" },
  { key: "employee",   label: "Employee",   badgeClass: "bg-slate-200 text-slate-700",      desc: "Staff member" },
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

function RoleCountBadge({ count, total }: { count: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((count / total) * 100);
  const color = pct === 100 ? "text-emerald-600 bg-emerald-50" : pct === 0 ? "text-red-500 bg-red-50" : "text-amber-600 bg-amber-50";
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {count}/{total} features
    </span>
  );
}

export default function Permissions() {
  const { token } = useAuth();
  const { refetch } = usePermissions();
  const [perms, setPerms] = useState<PermissionsMap>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/companies/permissions", { headers: apiHeaders(token) })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.permissions) setPerms(d.permissions); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function toggle(role: RoleKey, feature: FeatureKey) {
    setPerms(p => ({
      ...p,
      [role]: { ...p[role], [feature]: !p[role][feature] },
    }));
  }

  function enableAllRole(role: RoleKey) {
    setPerms(p => ({
      ...p,
      [role]: Object.fromEntries(ALL_FEATURES.map(f => [f, true])) as Record<FeatureKey, boolean>,
    }));
  }

  function disableAllRole(role: RoleKey) {
    setPerms(p => ({
      ...p,
      [role]: Object.fromEntries(ALL_FEATURES.map(f => [f, false])) as Record<FeatureKey, boolean>,
    }));
  }

  function resetRole(role: RoleKey) {
    setPerms(p => ({ ...p, [role]: { ...DEFAULT_PERMISSIONS[role] } }));
  }

  function enableFeatureAllRoles(feature: FeatureKey) {
    setPerms(p => {
      const next = { ...p };
      ROLES.forEach(r => { next[r.key] = { ...next[r.key], [feature]: true }; });
      return next;
    });
  }

  function disableFeatureAllRoles(feature: FeatureKey) {
    setPerms(p => {
      const next = { ...p };
      ROLES.forEach(r => { next[r.key] = { ...next[r.key], [feature]: false }; });
      return next;
    });
  }

  function toggleCategory(cat: string, on: boolean) {
    const features = ALL_FEATURES.filter(f => FEATURE_LABELS[f].category === cat);
    setPerms(p => {
      const next = { ...p };
      ROLES.forEach(r => {
        next[r.key] = { ...next[r.key] };
        features.forEach(f => { next[r.key][f] = on; });
      });
      return next;
    });
  }

  function toggleCatCollapse(cat: string) {
    setCollapsedCats(prev => {
      const s = new Set(prev);
      s.has(cat) ? s.delete(cat) : s.add(cat);
      return s;
    });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/companies/permissions", {
      method: "PUT",
      headers: apiHeaders(token),
      body: JSON.stringify({ permissions: perms }),
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

  const featureCountForRole = (role: RoleKey) =>
    ALL_FEATURES.filter(f => perms[role]?.[f] ?? true).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Role Permissions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Control which features each role can access. Company Admins always have full access.
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

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-3">
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
                  <span className="text-xs text-muted-foreground">/ {ALL_FEATURES.length} features</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: LIME }} />
                </div>
              </div>
              <div className="flex gap-1.5 pt-0.5">
                <button onClick={() => enableAllRole(r.key)}
                  className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">
                  All on
                </button>
                <button onClick={() => disableAllRole(r.key)}
                  className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">
                  All off
                </button>
                <button onClick={() => resetRole(r.key)}
                  className="flex-1 text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg py-1 hover:bg-muted transition-all">
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Matrix — grouped by category */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="grid border-b border-border bg-muted/30" style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)" }}>
          <div className="px-5 py-3.5 text-xs font-semibold text-muted-foreground">Feature / Module</div>
          <div className="px-2 py-3.5 text-xs font-semibold text-muted-foreground text-center border-l border-border">All roles</div>
          {ROLES.map(r => (
            <div key={r.key} className="px-4 py-3.5 border-l border-border flex items-center justify-center">
              <span className={`px-2.5 py-1 rounded-xl text-xs font-bold ${r.badgeClass}`}>{r.label}</span>
            </div>
          ))}
        </div>

        {/* Feature rows grouped by category */}
        {CATEGORIES.map(cat => {
          const catFeatures = ALL_FEATURES.filter(f => FEATURE_LABELS[f].category === cat);
          if (catFeatures.length === 0) return null;
          const isCollapsed = collapsedCats.has(cat);
          const allOn = catFeatures.every(f => ROLES.every(r => perms[r.key]?.[f] ?? true));
          const allOff = catFeatures.every(f => ROLES.every(r => !(perms[r.key]?.[f] ?? true)));

          return (
            <div key={cat} className="border-t border-border">
              {/* Category header */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-muted/20 border-b border-border">
                <button
                  onClick={() => toggleCatCollapse(cat)}
                  className="flex items-center gap-2 text-xs font-bold text-foreground hover:text-foreground/70 transition-colors"
                >
                  {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                  {cat}
                  <span className="font-normal text-muted-foreground">({catFeatures.length} features)</span>
                </button>
                <div className="flex gap-1.5">
                  <button onClick={() => toggleCategory(cat, true)}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">
                    Enable all
                  </button>
                  <button onClick={() => toggleCategory(cat, false)}
                    className="text-[10px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-0.5 hover:bg-white transition-all">
                    Disable all
                  </button>
                </div>
              </div>

              {/* Feature rows */}
              {!isCollapsed && catFeatures.map((feature, i) => {
                const info = FEATURE_LABELS[feature];
                const Icon = info.icon;
                const featureOn = ROLES.every(r => perms[r.key]?.[feature] ?? true);
                const featureOff = ROLES.every(r => !(perms[r.key]?.[feature] ?? true));
                return (
                  <div key={feature}
                    className={`grid hover:bg-muted/20 transition-colors divide-x divide-border ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                    style={{ gridTemplateColumns: "1fr 80px repeat(4, 1fr)" }}>
                    {/* Feature info */}
                    <div className="flex items-center gap-3 px-5 py-3">
                      <div className="flex size-7 items-center justify-center rounded-lg shrink-0" style={{ background: LIME + "20" }}>
                        <Icon className="h-3.5 w-3.5" style={{ color: "hsl(82 60% 35%)" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{info.label}</p>
                        <p className="text-[11px] text-muted-foreground">{info.desc}</p>
                      </div>
                    </div>
                    {/* All-roles quick toggle */}
                    <div className="flex items-center justify-center px-2 gap-1">
                      <button
                        onClick={() => featureOn ? disableFeatureAllRoles(feature) : enableFeatureAllRoles(feature)}
                        title={featureOn ? "Disable for all roles" : "Enable for all roles"}
                        className={`text-[10px] font-medium rounded-lg px-1.5 py-1 border transition-all whitespace-nowrap ${featureOn ? "border-red-200 text-red-500 hover:bg-red-50" : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"}`}>
                        {featureOn ? "Off all" : "On all"}
                      </button>
                    </div>
                    {/* Per-role toggles */}
                    {ROLES.map(r => (
                      <div key={r.key} className="flex items-center justify-center px-4 py-3">
                        <Toggle
                          checked={perms[r.key]?.[feature] ?? true}
                          onChange={() => toggle(r.key, feature)}
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

      {/* Info note */}
      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground leading-relaxed flex gap-3">
        <Info className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-semibold text-foreground mb-1">How permissions work</p>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="font-medium text-foreground">Company Admin</span> always has full access regardless of these settings.</li>
            <li>When a feature is toggled <span className="font-medium text-foreground">off</span>, the nav item is hidden and the route is blocked for that role.</li>
            <li>Changes take effect immediately after clicking <span className="font-medium text-foreground">Save Changes</span> — active sessions update on next page load.</li>
            <li>Use <span className="font-medium text-foreground">Reset</span> to restore a role's default permissions at any time.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
