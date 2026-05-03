import React, { useState, useEffect } from "react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { toast } from "@/components/ui/sonner";
import {
  Users, Mail, Plus, X, Copy, Check, CheckCircle,
  Clock, UserX, Shield, Crown, ChevronDown, Loader2,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";

interface Member {
  id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string;
}

interface Invitation {
  id: number; email: string; name: string; role: string; status: string;
  tempPassword?: string; createdAt: string; expiresAt: string;
}

interface CompanyInfo {
  company: { id: number; name: string; plan: string; slug: string };
  subscription?: { plan: string; seats: number; billingCycle: string };
  members: Member[];
  invitations: Invitation[];
}

const ROLES = [
  { value: "ceoo", label: "CEOO", desc: "Chief Executive Operations Officer" },
  { value: "manager", label: "Manager", desc: "Department manager" },
  { value: "supervisor", label: "Supervisor", desc: "Team supervisor" },
  { value: "employee", label: "Employee", desc: "Standard employee access" },
];

const ROLE_BADGE: Record<string, string> = {
  company_admin: "bg-foreground text-white",
  ceoo: "bg-indigo-600 text-white",
  manager: "bg-blue-600 text-white",
  supervisor: "bg-cyan-600 text-white",
  employee: "bg-muted text-foreground",
};

const ROLE_LABELS: Record<string, string> = {
  company_admin: "Company Admin", ceoo: "CEOO", manager: "Manager",
  supervisor: "Supervisor", employee: "Employee",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export default function TeamManagement() {
  const { token } = useAuth();
  const [info, setInfo] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", name: "", role: "employee" });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ tempPassword: string; email: string; acceptUrl: string } | null>(null);
  const [copied, setCopied] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [changingRole, setChangingRole] = useState<number | null>(null);
  const [tab, setTab] = useState<"members" | "invitations">("members");

  async function load() {
    setLoading(true);
    try {
      const data = await fetch("/api/companies/mine", { headers: apiHeaders(token) }).then(r => r.json());
      setInfo(data);
    } catch { }
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteError("");
    try {
      const r = await fetch("/api/companies/invite", {
        method: "POST",
        headers: apiHeaders(token),
        body: JSON.stringify(inviteForm),
      });
      const data = await r.json() as { invitation?: any; tempPassword?: string; acceptUrl?: string; error?: string };
      if (!r.ok) { setInviteError(data.error ?? "Failed to send invitation"); toast.error("Failed to send invitation"); return; }
      toast.success("Invitation sent successfully");
      setInviteResult({ tempPassword: data.tempPassword!, email: inviteForm.email, acceptUrl: data.acceptUrl! });
      setInviteForm({ email: "", name: "", role: "employee" });
      await load();
    } catch {
      setInviteError("Something went wrong. Please try again.");
      toast.error("Failed to send invitation");
    } finally {
      setInviting(false);
    }
  }

  async function changeRole(userId: number, role: string) {
    setChangingRole(userId);
    try {
      await fetch(`/api/companies/members/${userId}`, {
        method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ role }),
      });
      toast.success("Role updated successfully");
      await load();
    } catch {
      toast.error("Failed to update role");
    } finally {
      setChangingRole(null);
    }
  }

  async function toggleActive(userId: number, isActive: boolean) {
    try {
      await fetch(`/api/companies/members/${userId}`, {
        method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ isActive: !isActive }),
      });
      toast.success("Member status updated successfully");
      await load();
    } catch {
      toast.error("Failed to update member status");
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  }

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Team Management</h2>
          <p className="text-sm text-muted-foreground">
            {info?.company.name} · <span className="capitalize font-medium">{info?.subscription?.plan ?? info?.company.plan}</span> plan ·{" "}
            {info?.members.length ?? 0} members
          </p>
        </div>
        <button onClick={() => { setShowInvite(true); setInviteResult(null); setInviteError(""); }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-foreground hover:opacity-90 transition-all shrink-0"
          style={{ background: LIME }}>
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">Invite Member</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1 w-fit">
        {(["members", "invitations"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${tab === t ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            {t} {t === "invitations" && info?.invitations.filter(i => i.status === "pending").length ? `(${info.invitations.filter(i => i.status === "pending").length})` : ""}
          </button>
        ))}
      </div>

      {/* Members Table */}
      {tab === "members" && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">{info?.members.length ?? 0} Members</p>
          </div>
          {!info?.members.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No members yet. Invite your first team member.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Member</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Joined</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {info.members.map(m => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-foreground flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                          {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {m.role === "company_admin" ? (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${ROLE_BADGE[m.role]}`}>
                          <Crown className="h-3 w-3" /> Admin
                        </span>
                      ) : changingRole === m.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <select
                          value={m.role}
                          onChange={e => changeRole(m.id, e.target.value)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-xl border-0 cursor-pointer ${ROLE_BADGE[m.role] ?? ROLE_BADGE.employee}`}
                        >
                          {Object.entries(ROLE_LABELS).filter(([v]) => v !== "company_admin").map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${m.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                        {m.isActive ? <CheckCircle className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {m.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(m.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {m.role !== "company_admin" && (
                        <button onClick={() => toggleActive(m.id, m.isActive)}
                          className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-all">
                          {m.isActive ? "Deactivate" : "Activate"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Invitations */}
      {tab === "invitations" && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-border">
            <p className="text-sm font-semibold text-foreground">{info?.invitations.length ?? 0} Invitations</p>
          </div>
          {!info?.invitations.length ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Mail className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No invitations sent yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">Invitee</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Sent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Temp Password</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {info.invitations.map(inv => (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-foreground text-sm">{inv.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.email}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-xl text-xs font-semibold ${ROLE_BADGE[inv.role] ?? ROLE_BADGE.employee}`}>
                        {ROLE_LABELS[inv.role] ?? inv.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        inv.status === "pending" ? "bg-amber-100 text-amber-700" :
                        inv.status === "accepted" ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>
                        {inv.status === "pending" ? <Clock className="h-3 w-3" /> : inv.status === "accepted" ? <CheckCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground">{timeAgo(inv.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      {inv.tempPassword && inv.status === "pending" ? (
                        <div className="flex items-center gap-1.5">
                          <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{inv.tempPassword}</code>
                          <button onClick={() => copyText(inv.tempPassword!, `pw-${inv.id}`)}
                            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground">
                            {copied === `pw-${inv.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground text-lg">Invite Team Member</h3>
              <button onClick={() => { setShowInvite(false); setInviteResult(null); }} className="p-1.5 rounded-xl hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>

            {inviteResult ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Invitation created!</p>
                    <p className="text-xs text-emerald-700">Share these credentials with {inviteResult.email}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                  <p className="text-xs font-bold text-foreground mb-2">Login Credentials to Share</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Email</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{inviteResult.email}</p>
                    </div>
                    <button onClick={() => copyText(inviteResult.email, "email")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "email" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Temporary Password</p>
                      <p className="text-sm font-mono font-semibold text-foreground">{inviteResult.tempPassword}</p>
                    </div>
                    <button onClick={() => copyText(inviteResult.tempPassword, "pw")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "pw" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Login URL</p>
                      <p className="text-xs font-mono text-foreground truncate max-w-48">{window.location.origin}/login</p>
                    </div>
                    <button onClick={() => copyText(`${window.location.origin}/login`, "url")} className="p-1.5 rounded hover:bg-muted">
                      {copied === "url" ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Share these credentials with the invitee. They can change their password from Settings after logging in.
                </p>

                <button onClick={() => { setInviteResult(null); }} className="w-full py-2.5 rounded-xl text-sm font-semibold text-foreground hover:opacity-90" style={{ background: LIME }}>
                  Invite Another Member
                </button>
              </div>
            ) : (
              <form onSubmit={sendInvite} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Full Name *</label>
                  <input value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" className={inputCls} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Email Address *</label>
                  <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="john@company.com" className={inputCls} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Role *</label>
                  <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))} className={inputCls}>
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                  </select>
                </div>

                {inviteError && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-2.5 text-sm text-destructive">{inviteError}</div>}

                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowInvite(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={inviting || !inviteForm.name || !inviteForm.email}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-foreground disabled:opacity-50 hover:opacity-90"
                    style={{ background: LIME }}>
                    {inviting ? <><Loader2 className="h-4 w-4 animate-spin" /> Inviting…</> : <><Mail className="h-4 w-4" /> Send Invite</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
