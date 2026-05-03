import React, { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { SkeletonSettingsForm } from "@/components/skeletons";
import { toast } from "@/components/ui/sonner";
import {
  Building2, CreditCard, Globe, Shield, Bell, Save,
  KeyRound, Eye, EyeOff, User, Camera, MapPin,
} from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

interface CompanySettings {
  name: string; email: string; phone: string; address: string; website: string;
  registrationNumber: string; fiscalYearStart: string; timezone: string;
  currency: string; dateFormat: string; payPeriod: string;
  workingHoursPerDay: number; workingDaysPerWeek: number; logoUrl: string;
}

interface EmployeeProfile {
  id: number; firstName: string; lastName: string; email: string;
  phone?: string; position?: string; departmentName?: string;
  avatarUrl?: string; address?: string; city?: string; state?: string; country?: string;
  startDate?: string; employmentType?: string; status?: string;
}

const ADMIN_TABS = [
  { id: "company",       label: "Company",       icon: Building2 },
  { id: "payroll",       label: "Payroll",        icon: CreditCard },
  { id: "locale",        label: "Locale",         icon: Globe },
  { id: "security",      label: "Security",       icon: Shield },
  { id: "notifications", label: "Notifications",  icon: Bell },
];

const EMPLOYEE_TABS = [
  { id: "profile",       label: "My Profile",     icon: User },
  { id: "security",      label: "Security",       icon: Shield },
  { id: "notifications", label: "Notifications",  icon: Bell },
];

function Field({ label, value, onChange, type = "text", hint, readOnly }: {
  label: string; value: string | number; onChange?: (v: string) => void;
  type?: string; hint?: string; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange?.(e.target.value)}
        readOnly={readOnly}
        className={`w-full rounded-xl border border-border px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all ${readOnly ? "bg-muted/60 cursor-not-allowed text-muted-foreground" : "bg-muted/30"}`}
        style={{ "--tw-ring-color": LIME } as React.CSSProperties}
      />
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all"
        style={{ "--tw-ring-color": LIME } as React.CSSProperties}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      className="w-10 h-6 rounded-full transition-colors focus:outline-none"
      style={{ background: enabled ? LIME : "hsl(220 15% 85%)" }}
      aria-checked={enabled} role="switch">
      <span className="block w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1"
        style={{ transform: enabled ? "translateX(16px)" : "translateX(0)" }} />
    </button>
  );
}

/* ─────────────────────── Profile Tab ─────────────────────── */
function ProfileTab() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<EmployeeProfile>({
    queryKey: ["my-profile"],
    queryFn: () => fetch(`${API}/employees/me`, { headers: apiHeaders(token) }).then(r => r.json()),
  });

  const [form, setForm] = useState<Partial<EmployeeProfile>>({});
  const merged = { ...profile, ...form } as EmployeeProfile;
  const set = (k: keyof EmployeeProfile) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/employees/me`, {
        method: "PATCH",
        headers: apiHeaders(token),
        body: JSON.stringify(form),
      });
      const data = await r.json() as Record<string, unknown>;
      if (!r.ok) throw new Error((data.error as string) ?? "Failed to save");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      setForm({});
      toast.success("Profile updated", {
        description: "Your changes have been saved successfully.",
        icon: "✅",
      });
    },
    onError: (err: Error) => {
      toast.error("Failed to update profile", {
        description: err.message,
      });
    },
  });

  /* Simulate avatar upload: convert to data URL (stored as avatarUrl) */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      setForm(p => ({ ...p, avatarUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  }

  const displayAvatar = avatarPreview ?? merged.avatarUrl ?? null;
  const initials = merged.firstName && merged.lastName
    ? `${merged.firstName[0]}${merged.lastName[0]}`.toUpperCase()
    : (merged.firstName?.[0] ?? "?").toUpperCase();

  const COUNTRIES = ["US", "CA", "GB", "AU", "IN", "SG", "DE", "FR", "AE", "NG", "ZA", "BR", "MX", "JP", "KR"];

  if (isLoading) return <SkeletonSettingsForm />;

  if (!profile?.id) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
        <User className="h-8 w-8 opacity-30" />
        <p className="text-sm">No employee record linked to your account.</p>
        <p className="text-xs">Contact your HR administrator.</p>
      </div>
    );
  }

  const isDirty = Object.keys(form).length > 0;

  return (
    <div className="space-y-7">
      <h3 className="font-bold text-foreground">My Profile</h3>

      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          {displayAvatar ? (
            <img src={displayAvatar} alt="Profile" className="size-20 rounded-2xl object-cover border-2 border-border shadow-sm" />
          ) : (
            <div className="size-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-sm"
              style={{ background: `hsl(${((merged.firstName?.charCodeAt(0) ?? 65) * 37) % 360} 60% 45%)` }}>
              {initials}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 border-white shadow-md text-white"
            style={{ background: LIME }}
            title="Change photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{merged.firstName} {merged.lastName}</p>
          <p className="text-sm text-muted-foreground">{merged.position ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{merged.departmentName ?? ""}</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-xs font-medium hover:underline"
            style={{ color: LIME.replace("hsl", "").replace("(", "").replace(")", "") ? LIME : undefined }}
          >
            Change profile photo
          </button>
        </div>
      </div>

      {/* Personal info */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" /> Personal Information
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={merged.firstName ?? ""} onChange={set("firstName")} />
          <Field label="Last Name"  value={merged.lastName  ?? ""} onChange={set("lastName")} />
          <Field label="Email" value={merged.email ?? ""} readOnly hint="Email cannot be changed here" />
          <Field label="Phone" value={merged.phone ?? ""} onChange={set("phone")} type="tel" />
        </div>
      </div>

      {/* Location */}
      <div className="space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" /> Location
        </p>
        <Field label="Street Address" value={merged.address ?? ""} onChange={set("address")} />
        <div className="grid grid-cols-3 gap-4">
          <Field label="City"  value={merged.city  ?? ""} onChange={set("city")} />
          <Field label="State / Province" value={merged.state ?? ""} onChange={set("state")} />
          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Country</label>
            <select
              value={merged.country ?? "US"}
              onChange={e => set("country")(e.target.value)}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none"
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Read-only employment info */}
      <div className="rounded-xl bg-muted/40 border border-border p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Employment Details</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Employee ID"     value={(merged as { employeeCode?: string }).employeeCode ?? "—"} readOnly hint="Your unique employee identifier" />
          <Field label="Position"        value={merged.position       ?? "—"} readOnly />
          <Field label="Department"      value={merged.departmentName ?? "—"} readOnly />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Employment Type" value={(merged.employmentType ?? "—").replace("_", " ")} readOnly />
          <Field label="Start Date" value={merged.startDate ?? "—"} readOnly />
          <Field label="Status"     value={(merged.status ?? "—").replace("_", " ")} readOnly />
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => save.mutate()}
          disabled={!isDirty || save.isPending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground disabled:opacity-40 transition-all hover:opacity-90"
          style={{ background: LIME }}
        >
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────── Security Tab ─────────────────────── */
function SecurityTab() {
  const { token } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [pending, setPending] = useState(false);

  const TOGGLES = [
    { label: "Session Timeout",       desc: "Automatically log out inactive users after 30 minutes",         defaultEnabled: true },
    { label: "Login Attempt Lockout", desc: "Lock accounts after 5 consecutive failed login attempts",        defaultEnabled: true },
    { label: "Audit All Actions",     desc: "Log every create, update, and delete action with user context", defaultEnabled: true },
  ];
  const [enabled, setEnabled] = useState<boolean[]>(TOGGLES.map(i => i.defaultEnabled));
  const inputCls = "w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 transition-all pr-10";

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (form.next !== form.confirm) { toast.error("Passwords don't match", { description: "New password and confirmation must be identical." }); return; }
    if (form.next.length < 8)       { toast.error("Password too short",    { description: "Password must be at least 8 characters." }); return; }
    setPending(true);
    try {
      const r = await fetch(`${API}/auth/change-password`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }) });
      const data = await r.json() as { success?: boolean; error?: string };
      if (!r.ok) { toast.error("Failed to change password", { description: data.error ?? "Please check your current password and try again." }); return; }
      toast.success("Password changed", { description: "Your password has been updated successfully." });
      setForm({ current: "", next: "", confirm: "" });
    } catch {
      toast.error("Something went wrong", { description: "Please try again in a moment." });
    } finally {
      setPending(false);
    }
  }

  function PwInput({ field, label }: { field: keyof typeof form; label: string }) {
    return (
      <div>
        <label className="text-sm font-medium text-foreground block mb-1.5">{label}</label>
        <div className="relative">
          <input type={show[field] ? "text" : "password"} value={form[field]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} className={inputCls} required />
          <button type="button" onClick={() => setShow(s => ({ ...s, [field]: !s[field] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="font-bold text-foreground">Security Settings</h3>
      <div className="rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1"><KeyRound className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-semibold text-foreground">Change Password</p></div>
        <form onSubmit={changePassword} className="space-y-3">
          <PwInput field="current" label="Current Password" />
          <PwInput field="next"    label="New Password" />
          <PwInput field="confirm" label="Confirm New Password" />
          <button type="submit" disabled={pending} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:opacity-90 disabled:opacity-50 transition-all" style={{ background: LIME }}>
            <KeyRound className="h-4 w-4" /> {pending ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>
      <div className="space-y-3">
        {TOGGLES.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
            <div><p className="text-sm font-medium text-foreground">{item.label}</p><p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p></div>
            <Toggle enabled={enabled[idx]} onToggle={() => setEnabled(prev => prev.map((v, i) => i === idx ? !v : v))} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Notifications Tab ─────────────────────── */
function NotificationsTab() {
  const ITEMS = [
    { label: "Leave request approved/rejected",     defaultEnabled: true },
    { label: "New payslip published",               defaultEnabled: true },
    { label: "Onboarding task assigned",            defaultEnabled: true },
    { label: "Performance review due",              defaultEnabled: true },
    { label: "New job application received",        defaultEnabled: false },
    { label: "Birthday & work anniversary greetings", defaultEnabled: true },
    { label: "Policy document updates",             defaultEnabled: false },
  ];
  const [enabled, setEnabled] = useState<boolean[]>(ITEMS.map(i => i.defaultEnabled));
  return (
    <div className="space-y-4">
      <h3 className="font-bold text-foreground mb-4">Notification Preferences</h3>
      <div className="space-y-3">
        {ITEMS.map((item, idx) => (
          <div key={item.label} className="flex items-center justify-between rounded-xl border border-border p-4">
            <p className="text-sm text-foreground">{item.label}</p>
            <Toggle enabled={enabled[idx]} onToggle={() => setEnabled(prev => prev.map((v, i) => i === idx ? !v : v))} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────── Page ─────────────────────── */
export default function Settings() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const isEmployee = user?.role === "employee";

  const TABS = isEmployee ? EMPLOYEE_TABS : ADMIN_TABS;
  const [tab, setTab] = useState(isEmployee ? "profile" : "company");
  const [saved, setSaved] = useState(false);

  const settings = useQuery<CompanySettings>({
    queryKey: ["settings"],
    queryFn: () => fetch(`${API}/settings`, { headers: apiHeaders(token) }).then(r => r.json()),
    enabled: !isEmployee,
  });
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
          <p className="text-sm text-muted-foreground">{isEmployee ? "Manage your account & preferences" : "Configure your HRPay workspace"}</p>
        </div>
        {!isEmployee && (
          <button onClick={() => save.mutate()} disabled={Object.keys(form).length === 0 || save.isPending} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground disabled:opacity-40 transition-all hover:opacity-90" style={{ background: LIME }}>
            <Save className="h-4 w-4" />
            {saved ? "Saved!" : save.isPending ? "Saving…" : "Save Changes"}
          </button>
        )}
      </div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${tab === t.id ? "text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white"}`}
              style={tab === t.id ? { background: LIME } : {}}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="flex-1 rounded-2xl border border-border bg-white p-6 shadow-sm min-h-[400px]">
          {tab === "profile" ? (
            <ProfileTab />
          ) : settings.isLoading && !isEmployee ? (
            <SkeletonSettingsForm />
          ) : tab === "company" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Company Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company Name"         value={currentSettings.name                ?? ""} onChange={set("name")} />
                <Field label="Registration Number"  value={currentSettings.registrationNumber  ?? ""} onChange={set("registrationNumber")} />
                <Field label="Email"                value={currentSettings.email               ?? ""} onChange={set("email")} type="email" />
                <Field label="Phone"                value={currentSettings.phone               ?? ""} onChange={set("phone")} />
                <Field label="Website"              value={currentSettings.website             ?? ""} onChange={set("website")} />
                <SelectField label="Fiscal Year Start" value={currentSettings.fiscalYearStart ?? "January"} onChange={set("fiscalYearStart")} options={["January", "April", "July", "October"]} />
              </div>
              <Field label="Address" value={currentSettings.address ?? ""} onChange={set("address")} />
            </div>
          ) : tab === "payroll" ? (
            <div className="space-y-4">
              <h3 className="font-bold text-foreground mb-4">Payroll Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Pay Period" value={currentSettings.payPeriod ?? "bi-weekly"} onChange={set("payPeriod")} options={["weekly", "bi-weekly", "monthly"]} />
                <SelectField label="Currency"   value={currentSettings.currency  ?? "USD"}       onChange={set("currency")}   options={["USD", "EUR", "GBP", "CAD", "AUD", "INR", "SGD", "AED", "JPY", "CNY", "NGN", "ZAR", "BRL", "MXN", "KRW", "CHF", "SEK", "NOK", "DKK"]} />
                <div><label className="text-sm font-medium text-foreground block mb-1.5">Working Hours / Day</label><input type="number" min="1" max="24" value={currentSettings.workingHoursPerDay ?? 8} onChange={e => set("workingHoursPerDay")(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none" /></div>
                <div><label className="text-sm font-medium text-foreground block mb-1.5">Working Days / Week</label><input type="number" min="1" max="7"  value={currentSettings.workingDaysPerWeek ?? 5} onChange={e => set("workingDaysPerWeek")(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-4 py-2.5 text-sm focus:outline-none" /></div>
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
                <SelectField label="Timezone"    value={currentSettings.timezone   ?? "UTC"} onChange={set("timezone")}   options={["UTC", "America/Los_Angeles", "America/New_York", "America/Chicago", "America/Toronto", "America/Sao_Paulo", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Amsterdam", "Africa/Lagos", "Africa/Johannesburg", "Asia/Dubai", "Asia/Kolkata", "Asia/Singapore", "Asia/Shanghai", "Asia/Tokyo", "Australia/Sydney"]} />
                <SelectField label="Date Format" value={currentSettings.dateFormat ?? "MM/DD/YYYY"}          onChange={set("dateFormat")} options={["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY", "DD.MM.YYYY"]} />
                <SelectField label="Currency"    value={currentSettings.currency   ?? "USD"}                 onChange={set("currency")}   options={["USD", "EUR", "GBP", "CAD", "AUD", "INR", "SGD", "AED", "JPY", "CNY", "NGN", "ZAR", "BRL", "MXN", "KRW", "CHF", "SEK", "NOK", "DKK"]} />
              </div>
            </div>
          ) : tab === "security" ? (
            <SecurityTab />
          ) : (
            <NotificationsTab />
          )}
        </div>
      </div>

      {/* Signed-in-as card */}
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
