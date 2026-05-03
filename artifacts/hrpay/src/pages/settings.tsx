import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { SkeletonSettingsForm } from "@/components/skeletons";
import { Settings as SettingsIcon, Building2, CreditCard, Globe, Shield, Bell, Save } from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

interface CompanySettings {
  name: string; email: string; phone: string; address: string; website: string;
  registrationNumber: string; fiscalYearStart: string; timezone: string;
  currency: string; dateFormat: string; payPeriod: string;
  workingHoursPerDay: number; workingDaysPerWeek: number; logoUrl: string;
}

const TABS = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "payroll", label: "Payroll", icon: CreditCard },
  { id: "locale", label: "Locale", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Field({ label, value, onChange, type = "text", hint }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; hint?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all" style={{ "--tw-ring-color": LIME } as React.CSSProperties} />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all" style={{ "--tw-ring-color": LIME } as React.CSSProperties}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors focus:outline-none`}
      style={{ background: enabled ? LIME : "hsl(220 15% 85%)" }}
      aria-checked={enabled}
      role="switch"
    >
      <span
        className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1`}
        style={{ transform: enabled ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}

function SecurityTab() {
  const ITEMS = [
    { label: "Require MFA for HR Admins", desc: "All admin accounts must enable two-factor authentication", defaultEnabled: false },
    { label: "Session Timeout", desc: "Automatically log out inactive users after 30 minutes", defaultEnabled: true },
    { label: "Login Attempt Lockout", desc: "Lock accounts after 5 consecutive failed login attempts", defaultEnabled: true },
    { label: "Audit All Actions", desc: "Log every create, update, and delete action with user context", defaultEnabled: true },
  ];
  const [enabled, setEnabled] = useState<boolean[]>(ITEMS.map(i => i.defaultEnabled));
  const toggle = (idx: number) => setEnabled(prev => prev.map((v, i) => i === idx ? !v : v));
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground mb-4">Security Settings</h3>
      <div className="space-y-3">
        {ITEMS.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <Toggle enabled={enabled[idx]} onToggle={() => toggle(idx)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function NotificationsTab() {
  const ITEMS = [
    { label: "Leave request approved/rejected", defaultEnabled: true },
    { label: "New payslip published", defaultEnabled: true },
    { label: "Onboarding task assigned", defaultEnabled: true },
    { label: "Performance review due", defaultEnabled: true },
    { label: "New job application received", defaultEnabled: false },
    { label: "Birthday & work anniversary greetings", defaultEnabled: true },
    { label: "Policy document updates", defaultEnabled: false },
  ];
  const [enabled, setEnabled] = useState<boolean[]>(ITEMS.map(i => i.defaultEnabled));
  const toggle = (idx: number) => setEnabled(prev => prev.map((v, i) => i === idx ? !v : v));
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground mb-4">Notification Preferences</h3>
      <div className="space-y-3">
        {ITEMS.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
            <p className="text-sm text-foreground">{item.label}</p>
            <Toggle enabled={enabled[idx]} onToggle={() => toggle(idx)} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState("company");
  const [saved, setSaved] = useState(false);

  const settings = useQuery<CompanySettings>({ queryKey: ["settings"], queryFn: () => fetch(`${API}/settings`, { headers: apiHeaders(token) }).then(r => r.json()) });
  const [form, setForm] = useState<Partial<CompanySettings>>({});

  const currentSettings: CompanySettings = { ...settings.data, ...form } as CompanySettings;
  const set = (k: keyof CompanySettings) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: () => fetch(`${API}/settings`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); setSaved(true); setTimeout(() => setSaved(false), 2000); setForm({}); },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground">Configure your HRPay workspace</p>
        </div>
        <button onClick={() => save.mutate()} disabled={Object.keys(form).length === 0 || save.isPending} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40 transition-all hover:opacity-90" style={{ background: LIME }}>
          <Save className="h-4 w-4" />
          {saved ? "Saved!" : save.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${tab === t.id ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white"}`} style={tab === t.id ? { background: LIME } : {}}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 rounded-2xl border border-border bg-white p-6 shadow-sm">
          {settings.isLoading ? (
            <SkeletonSettingsForm />
          ) : tab === "company" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Company Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name" value={currentSettings.name ?? ""} onChange={set("name")} />
                <Field label="Registration Number" value={currentSettings.registrationNumber ?? ""} onChange={set("registrationNumber")} />
                <Field label="Email" value={currentSettings.email ?? ""} onChange={set("email")} type="email" />
                <Field label="Phone" value={currentSettings.phone ?? ""} onChange={set("phone")} />
                <Field label="Website" value={currentSettings.website ?? ""} onChange={set("website")} />
                <SelectField label="Fiscal Year Start" value={currentSettings.fiscalYearStart ?? "January"} onChange={set("fiscalYearStart")} options={["January", "April", "July", "October"]} />
              </div>
              <Field label="Address" value={currentSettings.address ?? ""} onChange={set("address")} />
            </div>
          ) : tab === "payroll" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Payroll Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Pay Period" value={currentSettings.payPeriod ?? "bi-weekly"} onChange={set("payPeriod")} options={["weekly", "bi-weekly", "monthly"]} />
                <SelectField label="Currency" value={currentSettings.currency ?? "USD"} onChange={set("currency")} options={["USD", "EUR", "GBP", "CAD", "AUD", "INR"]} />
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Working Hours / Day</label>
                  <input type="number" min="1" max="24" value={currentSettings.workingHoursPerDay ?? 8} onChange={e => set("workingHoursPerDay")(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Working Days / Week</label>
                  <input type="number" min="1" max="7" value={currentSettings.workingDaysPerWeek ?? 5} onChange={e => set("workingDaysPerWeek")(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none" />
                </div>
              </div>
              <div className="rounded-xl bg-muted/50 p-4">
                <p className="text-sm font-semibold text-foreground mb-1">Tax Configuration</p>
                <p className="text-xs text-muted-foreground">Federal: 22% · State: 5% · FICA: 7.65% (hardcoded defaults — configurable in upcoming release)</p>
              </div>
            </div>
          ) : tab === "locale" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Locale & Regional</h3>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Timezone" value={currentSettings.timezone ?? "America/Los_Angeles"} onChange={set("timezone")} options={["America/Los_Angeles", "America/New_York", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Kolkata", "Asia/Singapore", "UTC"]} />
                <SelectField label="Date Format" value={currentSettings.dateFormat ?? "MM/DD/YYYY"} onChange={set("dateFormat")} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]} />
                <SelectField label="Currency" value={currentSettings.currency ?? "USD"} onChange={set("currency")} options={["USD", "EUR", "GBP", "CAD", "AUD", "INR", "SGD"]} />
              </div>
            </div>
          ) : tab === "security" ? (
            <SecurityTab />
          ) : (
            <NotificationsTab />
          )}
        </div>
      </div>

      {/* Current user info */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <p className="text-sm font-bold text-foreground mb-3">Signed in as</p>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-white text-sm font-bold">
            {user?.name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.email} · <span className="capitalize">{user?.role?.replace("_", " ")}</span></p>
          </div>
          <span className="ml-auto rounded-full px-3 py-1 text-xs font-semibold text-foreground capitalize" style={{ background: LIME }}>
            {user?.role?.replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
