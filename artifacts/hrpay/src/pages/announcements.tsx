import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { usePermissions } from "@/components/permissions-context";
import { toast } from "@/components/ui/sonner";
import { SkeletonAnnouncementCards } from "@/components/skeletons";
import { Megaphone, Plus, X, Pin, Trash2 } from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

interface Announcement { id: number; companyId: number | null; title: string; content: string; type: string; target: string; isPinned: boolean; publishedBy?: string; createdAt: string; }

export default function Announcements() {
  const { token, user } = useAuth();
  const { hasPower } = usePermissions();
  const isEmployee = user?.role === "employee";
  const canPublish = hasPower("publish_announcements");
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", type: "info", target: "all", isPinned: false, publishedBy: user?.name ?? "Admin" });

  const announcements = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const r = await fetch(`${API}/announcements`, { headers: apiHeaders(token) });
      if (!r.ok) throw new Error("Failed to fetch announcements");
      return r.json();
    }
  });

  const create = useMutation({
    mutationFn: async () => {
      const r = await fetch(`${API}/announcements`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify(form) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create announcement");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Announcement published successfully");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setShowForm(false);
      setForm({ title: "", content: "", type: "info", target: "all", isPinned: false, publishedBy: user?.name ?? "Admin" });
    },
    onError: (err: any) => toast.error(err.message || "Failed to create announcement"),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`${API}/announcements/${id}`, { method: "DELETE", headers: apiHeaders(token) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete announcement");
      }
    },
    onSuccess: () => {
      toast.success("Announcement deleted successfully");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete announcement"),
  });

  const pin = useMutation({
    mutationFn: async ({ id, isPinned }: { id: number; isPinned: boolean }) => {
      const r = await fetch(`${API}/announcements/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify({ isPinned }) });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update announcement");
      }
      return r.json();
    },
    onSuccess: () => {
      toast.success("Announcement updated successfully");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update announcement"),
  });

  // Filter announcements based on target
  const filteredAnnouncements = (announcements.data ?? []).filter(a => {
    if (a.target === "all") return true;
    if (user?.role === "company_admin" || user?.role === "super_admin") return true;
    
    // Check if user is in the targeted department/group
    // Note: This is a simple string match for demonstration. 
    // In a full implementation, this would match department IDs or names.
    return a.target.toLowerCase() === user?.role?.toLowerCase();
  });

  const pinned = filteredAnnouncements.filter(a => a.isPinned);
  const regular = filteredAnnouncements.filter(a => !a.isPinned);


  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Announcements</h2>
          <p className="text-sm text-muted-foreground">Company-wide communications & updates</p>
        </div>
        {canPublish && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
            <Plus className="h-4 w-4" /> New Announcement
          </button>
        )}
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5"><Pin className="h-3 w-3" /> Pinned</p>
          <div className="space-y-3">
            {pinned.map(a => (
              <AnnouncementCard
                key={a.id} a={a} canPublish={canPublish}
                onRemove={() => remove.mutate(a.id)}
                onPin={() => pin.mutate({ id: a.id, isPinned: false })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Regular */}
      <div>
        {pinned.length > 0 && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Recent</p>}
        {announcements.isLoading ? (
          <SkeletonAnnouncementCards count={4} />
        ) : (announcements.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white/50 p-10 text-center">
            <Megaphone className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No announcements yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {regular.map(a => (
              <AnnouncementCard
                key={a.id} a={a} canPublish={canPublish}
                onRemove={() => remove.mutate(a.id)}
                onPin={() => pin.mutate({ id: a.id, isPinned: true })}
              />
            ))}
          </div>
        )}
      </div>

      {/* New Announcement Modal */}
      {showForm && canPublish && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">New Announcement</h3>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none" placeholder="e.g. Office closed on Friday" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Content</label>
                <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} rows={4} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none">
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="urgent">Urgent</option>
                    <option value="success">Success</option>
                    <option value="celebration">Celebration</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target</label>
                  <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value }))} className="w-full mt-1 rounded-lg border border-border px-3 py-2 text-sm focus:outline-none">
                    <option value="all">All employees</option>
                    <option value="engineering">Engineering</option>
                    <option value="hr">HR team</option>
                    <option value="management">Management</option>
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPinned} onChange={e => setForm(p => ({ ...p, isPinned: e.target.checked }))} className="rounded" />
                <span className="text-sm text-foreground">Pin this announcement</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => create.mutate()} disabled={!form.title || !form.content || create.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {create.isPending ? "Publishing…" : "Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ a, canPublish, onRemove, onPin }: { a: Announcement; canPublish: boolean; onRemove: () => void; onPin: () => void }) {
  const LIME = "hsl(82 80% 48%)";
  const typeStyle: Record<string, string> = {
    info: "bg-blue-100 text-blue-700",
    warning: "bg-yellow-100 text-yellow-700",
    urgent: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    celebration: "text-foreground",
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm bg-white ${a.isPinned ? "border-foreground/20" : "border-border"}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-foreground">{a.title}</h4>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeStyle[a.type] ?? typeStyle.info}`} style={a.type === "celebration" ? { background: LIME } : {}}>{a.type}</span>
            {a.target !== "all" && <span className="rounded-full px-2.5 py-0.5 text-xs bg-muted text-muted-foreground capitalize">📣 {a.target}</span>}
          </div>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.content}</p>
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {a.publishedBy && <span>By {a.publishedBy}</span>}
            <span>{new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>
        </div>
        {canPublish && (user?.role === "super_admin" || a.companyId === user?.companyId) && (
          <div className="flex gap-1">
            <button onClick={onPin} className={`flex size-8 items-center justify-center rounded-lg transition-colors ${a.isPinned ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`} style={a.isPinned ? { background: LIME } : {}}>
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button onClick={onRemove} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
