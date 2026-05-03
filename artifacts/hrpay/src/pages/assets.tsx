import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useListEmployees, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useAuth, apiHeaders } from "@/components/auth-context";
import { SkeletonCards } from "@/components/skeletons";
import { Monitor, Plus, Package, X, Pencil, Laptop, Smartphone, Wifi, Car, Armchair } from "lucide-react";

const API = "/api";
const LIME = "hsl(82 80% 48%)";

const CATEGORIES = ["laptop", "desktop", "monitor", "phone", "tablet", "furniture", "vehicle", "software_license", "networking", "other"];
const STATUSES = ["available", "assigned", "maintenance", "retired"];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  available: { bg: "bg-lime-100", text: "text-lime-700" },
  assigned: { bg: "bg-blue-100", text: "text-blue-700" },
  maintenance: { bg: "bg-yellow-100", text: "text-yellow-700" },
  retired: { bg: "bg-gray-100", text: "text-gray-500" },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  laptop: Laptop, desktop: Monitor, monitor: Monitor,
  phone: Smartphone, tablet: Smartphone, furniture: Armchair,
  vehicle: Car, networking: Wifi,
};

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

interface Asset {
  id: number;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchaseCost?: string;
  status: string;
  assignedTo?: number | null;
  assignedAt?: string;
  location?: string;
  warrantyExpiry?: string;
  notes?: string;
  employeeFirstName?: string;
  employeeLastName?: string;
}

const emptyForm = { name: "", category: "laptop", brand: "", model: "", serialNumber: "", purchaseDate: "", purchaseCost: "", status: "available", location: "", warrantyExpiry: "", notes: "" };

export default function Assets() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [assigning, setAssigning] = useState<Asset | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCat, setFilterCat] = useState("all");
  const [form, setForm] = useState({ ...emptyForm });
  const [assigneeId, setAssigneeId] = useState("");

  const assets = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: () => fetch(`${API}/assets`, { headers: apiHeaders(token) }).then(r => r.json()),
  });
  const { data: empData } = useListEmployees({ page: 1, limit: 100 }, { query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 100 }) } });

  const create = useMutation({
    mutationFn: () => fetch(`${API}/assets`, { method: "POST", headers: apiHeaders(token), body: JSON.stringify({ ...form, purchaseCost: form.purchaseCost ? parseFloat(form.purchaseCost) : undefined }) }).then(r => r.json()),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assets"] }); setShowForm(false); setForm({ ...emptyForm }); },
  });

  const update = useMutation({
    mutationFn: (data: Partial<Asset> & { id: number }) => {
      const { id, ...rest } = data;
      return fetch(`${API}/assets/${id}`, { method: "PATCH", headers: apiHeaders(token), body: JSON.stringify(rest) }).then(r => r.json());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["assets"] }); setEditing(null); setAssigning(null); },
  });

  const list = (assets.data ?? []).filter(a =>
    (filterStatus === "all" || a.status === filterStatus) &&
    (filterCat === "all" || a.category === filterCat)
  );

  const totalValue = (assets.data ?? []).reduce((s, a) => s + Number(a.purchaseCost ?? 0), 0);
  const byStatus = (assets.data ?? []).reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {});

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Asset Management</h2>
          <p className="text-sm text-muted-foreground">Track and assign company assets to employees</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground hover:opacity-90 transition-all" style={{ background: LIME }}>
          <Plus className="h-4 w-4" /> Add Asset
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Asset Value", value: fmt(totalValue), hero: true },
          { label: "Available", value: byStatus.available ?? 0 },
          { label: "Assigned", value: byStatus.assigned ?? 0 },
          { label: "In Maintenance", value: byStatus.maintenance ?? 0 },
        ].map(({ label, value, hero }) => (
          <div key={label} className="rounded-2xl p-4 shadow-sm" style={{ background: hero ? LIME : "white", border: hero ? "none" : "1px solid hsl(220 15% 91%)" }}>
            <p className={`text-xs font-medium mb-1 ${hero ? "text-foreground/70" : "text-muted-foreground"}`}>{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
          {["all", ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all capitalize ${filterStatus === s ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{s}</button>
          ))}
        </div>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground">
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
        </select>
      </div>

      {/* Asset Grid */}
      {assets.isLoading ? (
        <SkeletonCards count={6} cols={3} />
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No assets found</p>
          <p className="text-xs text-muted-foreground">Add your first asset to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(asset => {
            const Icon = CATEGORY_ICONS[asset.category] ?? Package;
            const sc = STATUS_STYLES[asset.status] ?? STATUS_STYLES.available;
            return (
              <div key={asset.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{asset.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{asset.category.replace("_", " ")}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${sc.bg} ${sc.text}`}>{asset.status}</span>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                  {asset.brand && <div className="flex justify-between"><span>Brand</span><span className="text-foreground font-medium">{asset.brand} {asset.model}</span></div>}
                  {asset.serialNumber && <div className="flex justify-between"><span>Serial</span><span className="text-foreground font-medium font-mono text-[10px]">{asset.serialNumber}</span></div>}
                  {asset.purchaseCost && <div className="flex justify-between"><span>Value</span><span className="text-foreground font-semibold">{fmt(Number(asset.purchaseCost))}</span></div>}
                  {asset.location && <div className="flex justify-between"><span>Location</span><span className="text-foreground">{asset.location}</span></div>}
                  {asset.employeeFirstName && (
                    <div className="flex justify-between">
                      <span>Assigned to</span>
                      <span className="text-foreground font-medium">{asset.employeeFirstName} {asset.employeeLastName}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => setAssigning(asset)} className="flex-1 rounded-lg py-1.5 text-xs font-medium border border-border hover:bg-muted transition-colors">
                    {asset.status === "assigned" ? "Reassign" : "Assign"}
                  </button>
                  <button onClick={() => { setEditing(asset); setForm({ name: asset.name, category: asset.category, brand: asset.brand ?? "", model: asset.model ?? "", serialNumber: asset.serialNumber ?? "", purchaseDate: asset.purchaseDate ?? "", purchaseCost: asset.purchaseCost ?? "", status: asset.status, location: asset.location ?? "", warrantyExpiry: asset.warrantyExpiry ?? "", notes: asset.notes ?? "" }); setShowForm(true); }} className="rounded-lg p-1.5 border border-border hover:bg-muted transition-colors">
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-foreground">{editing ? "Edit Asset" : "Add New Asset"}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({ ...emptyForm }); }} className="rounded-xl p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Asset Name", key: "name", placeholder: "MacBook Pro 14", col: 2 },
                { label: "Brand", key: "brand", placeholder: "Apple" },
                { label: "Model", key: "model", placeholder: "MKGP3LL/A" },
                { label: "Serial Number", key: "serialNumber", placeholder: "C02XG0JHJGH5" },
                { label: "Location", key: "location", placeholder: "HQ – Floor 2" },
                { label: "Purchase Date", key: "purchaseDate", type: "date" },
                { label: "Purchase Cost (USD)", key: "purchaseCost", type: "number", placeholder: "2499" },
                { label: "Warranty Expiry", key: "warrantyExpiry", type: "date" },
              ].map(({ label, key, placeholder, type = "text", col }) => (
                <div key={key} className={col === 2 ? "col-span-2" : ""}>
                  <label className="text-sm font-medium block mb-1.5">{label}</label>
                  <input type={type} value={(form as Record<string, string>)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={placeholder} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm" />
                </div>
              ))}
              <div>
                <label className="text-sm font-medium block mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1.5">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium block mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Additional notes…" className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-2.5 mt-5">
              <button onClick={() => { setShowForm(false); setEditing(null); setForm({ ...emptyForm }); }} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => editing ? update.mutate({ id: editing.id, ...form, purchaseCost: form.purchaseCost || undefined }) : create.mutate()} disabled={!form.name || create.isPending || update.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground disabled:opacity-50" style={{ background: LIME }}>
                {create.isPending || update.isPending ? "Saving…" : editing ? "Save Changes" : "Add Asset"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {assigning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">Assign Asset</h3>
              <button onClick={() => setAssigning(null)} className="rounded-xl p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{assigning.name}</p>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm mb-4">
              <option value="">Unassign (set to available)</option>
              {(empData?.employees ?? []).map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
            </select>
            <div className="flex gap-2.5">
              <button onClick={() => setAssigning(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium hover:bg-muted">Cancel</button>
              <button onClick={() => update.mutate({ id: assigning.id, assignedTo: assigneeId ? Number(assigneeId) : null })} disabled={update.isPending} className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-foreground" style={{ background: LIME }}>
                {update.isPending ? "Saving…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
