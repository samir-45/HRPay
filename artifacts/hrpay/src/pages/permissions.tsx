import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { usePermissions, PermissionsMap, DEFAULT_PERMISSIONS, ALL_FEATURES, FeatureKey, RoleKey } from "@/components/permissions-context";
import {
  Users, Calculator, Clock, CalendarDays, Shield, Briefcase, Target,
  ListTodo, Building2, Megaphone, Receipt, Package, GraduationCap,
  Network, FileText, Save, RotateCcw, Check, UserCog, BarChart3, Loader2,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

const FEATURE_LABELS: Record<FeatureKey, { label: string; icon: React.ElementType; desc: string }> = {
  employees:    { label: "Employees",       icon: Users,         desc: "View and manage employee directory" },
  payroll:      { label: "Payroll",          icon: Calculator,    desc: "View and process payroll runs" },
  time:         { label: "Time & Attendance",icon: Clock,         desc: "Log and approve time entries" },
  leave:        { label: "Leave Management", icon: CalendarDays,  desc: "Submit and approve leave requests" },
  recruitment:  { label: "Recruitment",      icon: Briefcase,     desc: "Manage job posts and candidates" },
  performance:  { label: "Performance",      icon: Target,        desc: "Review cycles and ratings" },
  benefits:     { label: "Benefits",         icon: Shield,        desc: "View and enroll in benefit plans" },
  onboarding:   { label: "Onboarding",       icon: ListTodo,      desc: "Task checklists for new hires" },
  departments:  { label: "Departments",      icon: Building2,     desc: "Browse department structure" },
  announcements:{ label: "Announcements",    icon: Megaphone,     desc: "View company announcements" },
  expenses:     { label: "Expenses",         icon: Receipt,       desc: "Submit and review expenses" },
  assets:       { label: "Assets",           icon: Package,       desc: "Company asset registry" },
  training:     { label: "Training",         icon: GraduationCap, desc: "Learning modules and courses" },
  "org-chart":  { label: "Org Chart",        icon: Network,       desc: "Company org chart view" },
  reports:      { label: "Reports",          icon: BarChart3,     desc: "HR analytics and reports" },
  team:         { label: "Team Management",  icon: UserCog,       desc: "Invite members and manage roles" },
};

const ROLES: { key: RoleKey; label: string; color: string }[] = [
  { key: "ceoo",       label: "CEOO",       color: "bg-indigo-600 text-white" },
  { key: "manager",    label: "Manager",    color: "bg-blue-600 text-white" },
  { key: "supervisor", label: "Supervisor", color: "bg-cyan-600 text-white" },
  { key: "employee",   label: "Employee",   color: "bg-muted text-foreground" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${checked ? "bg-foreground" : "bg-muted"}`}
      style={checked ? { background: LIME } : {}}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function Permissions() {
  const { token } = useAuth();
  const { refetch } = usePermissions();
  const [perms, setPerms] = useState<PermissionsMap>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  function enableAll(role: RoleKey) {
    setPerms(p => ({
      ...p,
      [role]: Object.fromEntries(ALL_FEATURES.map(f => [f, true])) as Record<FeatureKey, boolean>,
    }));
  }

  function resetRole(role: RoleKey) {
    setPerms(p => ({ ...p, [role]: { ...DEFAULT_PERMISSIONS[role] } }));
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Role Permissions</h2>
          <p className="text-sm text-muted-foreground">Control which features each role can access in your company. Company Admins always have full access.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-foreground hover:opacity-90 transition-all disabled:opacity-60"
          style={{ background: LIME }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* Matrix */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "1fr repeat(4, 160px)" }}>
          <div className="px-5 py-4 text-xs font-semibold text-muted-foreground">Feature / Module</div>
          {ROLES.map(r => (
            <div key={r.key} className="px-4 py-4 border-l border-border flex flex-col items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold ${r.color}`}>{r.label}</span>
              <div className="flex gap-1">
                <button onClick={() => enableAll(r.key)} className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 hover:bg-muted transition-all">All on</button>
                <button onClick={() => resetRole(r.key)} className="text-[10px] text-muted-foreground hover:text-foreground border border-border rounded px-1.5 py-0.5 hover:bg-muted transition-all">Reset</button>
              </div>
            </div>
          ))}
        </div>

        {/* Feature rows */}
        <div className="divide-y divide-border">
          {ALL_FEATURES.map((feature, i) => {
            const info = FEATURE_LABELS[feature];
            const Icon = info.icon;
            return (
              <div key={feature} className={`grid hover:bg-muted/20 transition-colors ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                style={{ gridTemplateColumns: "1fr repeat(4, 160px)" }}>
                {/* Feature info */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex size-8 items-center justify-center rounded-xl shrink-0" style={{ background: LIME + "20" }}>
                    <Icon className="h-4 w-4" style={{ color: "hsl(82 60% 35%)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{info.label}</p>
                    <p className="text-[11px] text-muted-foreground">{info.desc}</p>
                  </div>
                </div>
                {/* Toggles */}
                {ROLES.map(r => (
                  <div key={r.key} className="flex items-center justify-center border-l border-border px-4">
                    <Toggle
                      checked={perms[r.key]?.[feature] ?? true}
                      onChange={(v) => toggle(r.key, feature)}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-xs text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-1">How permissions work</p>
        <ul className="space-y-1 list-disc list-inside">
          <li><span className="font-medium text-foreground">Company Admin</span> always has full access regardless of these settings.</li>
          <li>When a feature is toggled off, the nav item is hidden and the route is blocked for that role.</li>
          <li>Changes take effect immediately after saving — active sessions update on next page load.</li>
        </ul>
      </div>
    </div>
  );
}
