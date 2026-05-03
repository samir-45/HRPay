import React, { useState, useMemo, useEffect } from "react";
import {
  useListTimeEntries,
  useApproveTimeEntry,
  useRejectTimeEntry,
  useBulkApproveTimeEntries,
  useCreateTimeEntry,
  useListEmployees,
  getListTimeEntriesQueryKey,
  getListEmployeesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth-context";
import { usePermissions } from "@/components/permissions-context";
import { toast } from "@/components/ui/sonner";
import { EmployeeSearchSelect } from "@/components/employee-search-select";
import {
  Clock, Plus, Check, X, ChevronLeft, ChevronRight,
  CheckCheck, AlertTriangle, Timer, TrendingUp,
  FileText, Calendar, User, StickyNote,
} from "lucide-react";

const LIME = "hsl(82 80% 48%)";
const API = "/api";

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  pending:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-400" },
  approved: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-400" },
};

/* ── Week navigation helpers ── */
function getMondayOf(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const m = new Date(d);
  m.setDate(d.getDate() + diff);
  m.setHours(0, 0, 0, 0);
  return m;
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function fmtWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  if (monday.getFullYear() !== sunday.getFullYear()) {
    return `${monday.toLocaleDateString("en-US", { ...opts, year: "numeric" })} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
  }
  return `${monday.toLocaleDateString("en-US", opts)} – ${sunday.toLocaleDateString("en-US", { ...opts, year: "numeric" })}`;
}
function fmtTime(dt: string | Date | null | undefined): string {
  if (!dt) return "—";
  try {
    return new Date(dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  } catch { return "—"; }
}
function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const s = typeof d === "string" ? d : toISO(d);
  try {
    return new Date(s + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  } catch { return String(d); }
}
function calcHours(clockIn: string, clockOut: string): number {
  const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  return Math.max(0, diff / 3600000);
}

/* ── Summary Card ── */
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex items-center gap-3.5">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: (color ?? LIME) + "20" }}>
        <Icon className="h-5 w-5" style={{ color: color ?? LIME }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Reject Confirm Popover ── */
function RejectButton({ onReject, isPending }: { onReject: () => void; isPending: boolean }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <span className="flex items-center gap-1">
      <button onClick={() => { onReject(); setConfirming(false); }}
        className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded transition-colors" disabled={isPending}>
        {isPending ? "…" : "Confirm"}
      </button>
      <button onClick={() => setConfirming(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
    </span>
  ) : (
    <button onClick={() => setConfirming(true)}
      className="inline-flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 transition-colors">
      <X className="h-3.5 w-3.5" /> Reject
    </button>
  );
}

/* ── Log Time Modal ── */
function LogTimeModal({
  onClose,
  onSubmit,
  isEmployee,
  myEmployeeId,
  employees,
  isPending,
}: {
  onClose: () => void;
  onSubmit: (data: {
    employeeId: number; date: string; clockIn?: string; clockOut?: string;
    hoursWorked?: number; notes?: string;
  }) => void;
  isEmployee: boolean;
  myEmployeeId: number | null;
  employees: { id: number; firstName: string; lastName: string }[];
  isPending: boolean;
}) {
  const today = toISO(new Date());
  const [mode, setMode] = useState<"clock" | "manual">("clock");
  const [date, setDate] = useState(today);
  const [clockIn, setClockIn] = useState(() => `${today}T09:00`);
  const [clockOut, setClockOut] = useState(() => `${today}T17:00`);
  const [manualHours, setManualHours] = useState("8");
  const [notes, setNotes] = useState("");
  const [employeeId, setEmployeeId] = useState(myEmployeeId ? String(myEmployeeId) : "");

  const computedHours = useMemo(() => {
    if (mode === "clock" && clockIn && clockOut) {
      const h = calcHours(clockIn, clockOut);
      return h > 0 ? h : null;
    }
    return null;
  }, [mode, clockIn, clockOut]);

  const overtime = useMemo(() => {
    const h = mode === "clock" ? computedHours : Number(manualHours);
    return h && h > 8 ? (h - 8).toFixed(1) : null;
  }, [mode, computedHours, manualHours]);

  // Keep clockIn date in sync with date selector
  useEffect(() => {
    if (mode === "clock") {
      const timePart = clockIn.slice(11) || "09:00";
      setClockIn(`${date}T${timePart}`);
      const timePartOut = clockOut.slice(11) || "17:00";
      setClockOut(`${date}T${timePartOut}`);
    }
  }, [date, mode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) { toast.error("Please select an employee"); return; }
    if (mode === "clock") {
      if (!clockIn || !clockOut) { toast.error("Clock-in and clock-out are required"); return; }
      if (new Date(clockOut) <= new Date(clockIn)) { toast.error("Clock-out must be after clock-in"); return; }
      onSubmit({ employeeId: Number(employeeId), date, clockIn, clockOut, notes: notes || undefined });
    } else {
      const h = Number(manualHours);
      if (!h || h <= 0 || h > 24) { toast.error("Enter a valid number of hours (0.5 – 24)"); return; }
      onSubmit({ employeeId: Number(employeeId), date, hoursWorked: h, notes: notes || undefined });
    }
  }

  const inputCls = "w-full px-3 py-2 border border-border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-lime-400/40 focus:border-lime-400 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg" style={{ background: LIME + "20" }}>
              <Clock className="h-4 w-4" style={{ color: LIME }} />
            </div>
            <h3 className="font-semibold text-base">Log Time Entry</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Mode selector */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            {(["clock", "manual"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${mode === m ? "text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
                style={mode === m ? { background: LIME + "20", color: "hsl(82 70% 30%)" } : {}}>
                {m === "clock" ? "⏰ Clock In / Out" : "✏️ Manual Hours"}
              </button>
            ))}
          </div>

          {/* Employee selector (managers only) */}
          {!isEmployee && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Employee</label>
              <EmployeeSearchSelect
                employees={employees}
                value={employeeId}
                onChange={setEmployeeId}
                required
              />
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Date</label>
            <input required type="date" value={date} max={toISO(new Date())}
              onChange={e => setDate(e.target.value)} className={inputCls} />
          </div>

          {mode === "clock" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Clock In</label>
                <input required type="time" value={clockIn.slice(11)}
                  onChange={e => setClockIn(`${date}T${e.target.value}`)} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Clock Out</label>
                <input required type="time" value={clockOut.slice(11)}
                  onChange={e => setClockOut(`${date}T${e.target.value}`)} className={inputCls} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Hours Worked</label>
              <input required type="number" step="0.5" min="0.5" max="24"
                value={manualHours} onChange={e => setManualHours(e.target.value)} className={inputCls} placeholder="8.0" />
            </div>
          )}

          {/* Live preview */}
          {(computedHours !== null || (mode === "manual" && Number(manualHours) > 0)) && (
            <div className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-lime-800 font-medium">
                {mode === "clock" ? computedHours!.toFixed(1) : Number(manualHours).toFixed(1)} hrs worked
              </span>
              {overtime && (
                <span className="text-amber-600 font-semibold">+{overtime}h overtime</span>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              className={inputCls + " resize-none"} placeholder="Any additional context…" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground disabled:opacity-50 transition-opacity"
              style={{ background: LIME }}>
              {isPending ? "Saving…" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function Time() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { hasPower } = usePermissions();

  const isEmployee = user?.role === "employee";
  const canApproveTime = hasPower("approve_time");
  const myEmployeeId = user?.employeeId ?? null;

  /* Week navigation */
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = useMemo(() => addDays(getMondayOf(new Date()), weekOffset * 7), [weekOffset]);
  const sunday = useMemo(() => addDays(monday, 6), [monday]);
  const startDate = toISO(monday);
  const endDate = toISO(sunday);
  const isCurrentWeek = weekOffset === 0;

  /* Status tab */
  const [statusTab, setStatusTab] = useState<"" | "pending" | "approved" | "rejected">("");

  /* Show modal */
  const [showModal, setShowModal] = useState(false);

  /* Queries */
  const baseParams = {
    startDate,
    endDate,
    limit: 500,
    ...(isEmployee && myEmployeeId ? { employeeId: myEmployeeId } : {}),
    ...(statusTab ? { status: statusTab as "pending" | "approved" | "rejected" } : {}),
  };
  const allWeekParams = { startDate, endDate, limit: 500, ...(isEmployee && myEmployeeId ? { employeeId: myEmployeeId } : {}) };

  const { data: entries = [], isLoading } = useListTimeEntries(
    baseParams as Parameters<typeof useListTimeEntries>[0],
    { query: { queryKey: getListTimeEntriesQueryKey(baseParams) } }
  );
  const { data: allWeekEntries = [] } = useListTimeEntries(
    allWeekParams as Parameters<typeof useListTimeEntries>[0],
    { query: { queryKey: getListTimeEntriesQueryKey(allWeekParams) } }
  );

  const { data: empData } = useListEmployees(
    { page: 1, limit: 200 },
    { query: { queryKey: getListEmployeesQueryKey({ page: 1, limit: 200 }), enabled: !isEmployee } }
  );

  /* Mutations */
  const invalidate = () => {
    // Invalidate all time entries queries - React Query will auto-refetch marked as stale
    qc.invalidateQueries({ 
      queryKey: ["/api/time/entries"],
      refetchType: "active" // Only refetch active queries
    });
  };

  const approveMut = useApproveTimeEntry({
    mutation: {
      onSuccess: () => { 
        invalidate(); 
        toast.success("Time entry approved"); 
      },
      onError: () => toast.error("Failed to approve"),
    },
  });
  const rejectMut = useRejectTimeEntry({
    mutation: {
      onSuccess: () => { 
        invalidate(); 
        toast.success("Time entry rejected"); 
      },
      onError: () => toast.error("Failed to reject"),
    },
  });
  const bulkMut = useBulkApproveTimeEntries({
    mutation: {
      onSuccess: (data) => {
        invalidate();
        const count = (data as { count?: number })?.count ?? 0;
        toast.success(`${count} entries approved`);
      },
      onError: () => toast.error("Bulk approve failed"),
    },
  });
  const createMut = useCreateTimeEntry({
    mutation: {
      onSuccess: () => {
        invalidate();
        setShowModal(false);
        toast.success("Time entry logged", { description: "Awaiting approval." });
      },
      onError: () => toast.error("Failed to save time entry"),
    },
  });

  /* Derived stats from the FULL week (ignore status tab for cards) */
  const weekEntries = allWeekEntries;
  const totalHours = weekEntries.reduce((a, e) => a + (e.hoursWorked ?? 0), 0);
  const totalOT = weekEntries.reduce((a, e) => a + (e.overtimeHours ?? 0), 0);
  const daysWorked = new Set(weekEntries.map(e => { try { return toISO(new Date(e.date as unknown as string)); } catch { return String(e.date); } })).size;
  const pendingAll = weekEntries.filter(e => e.status === "pending");

  const entryList = entries;

  /* Days of week header */
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const todayISO = toISO(new Date());

  const TABS = [
    { value: "" as const, label: "All" },
    { value: "pending" as const, label: `Pending${pendingAll.length > 0 ? ` (${pendingAll.length})` : ""}` },
    { value: "approved" as const, label: "Approved" },
    { value: "rejected" as const, label: "Rejected" },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Time & Attendance</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEmployee ? "Track and manage your work hours" : "Manage team time entries and approvals"}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground shrink-0 hover:opacity-90 transition-opacity"
          style={{ background: LIME }}
        >
          <Plus className="h-4 w-4" />
          Log Time
        </button>
      </div>

      {/* ── Week Navigator ── */}
      <div className="flex items-center justify-between bg-white border border-border rounded-2xl px-4 py-3">
        <button onClick={() => setWeekOffset(v => v - 1)}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-foreground">{fmtWeekLabel(monday)}</p>
          {isCurrentWeek && <p className="text-xs text-muted-foreground">This week</p>}
        </div>
        <div className="flex items-center gap-1">
          {!isCurrentWeek && (
            <button onClick={() => setWeekOffset(0)}
              className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground">
              Today
            </button>
          )}
          <button onClick={() => setWeekOffset(v => v + 1)}
            disabled={isCurrentWeek}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Week Day Pill Strip ── */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const iso = toISO(day);
          const dayEntries = weekEntries.filter(e => {
            const d = toISO(new Date(e.date as unknown as string));
            return d === iso;
          });
          const isToday = iso === todayISO;
          const hasPending = dayEntries.some(e => e.status === "pending");
          const hasEntries = dayEntries.length > 0;
          return (
            <div key={iso}
              className={`rounded-xl border text-center py-2 px-1 text-xs transition-colors ${
                isToday ? "border-lime-300" : "border-border"
              } ${hasEntries ? "bg-white" : "bg-muted/20"}`}
              style={isToday ? { background: LIME + "15" } : {}}>
              <p className="font-medium text-muted-foreground uppercase tracking-wide" style={{ fontSize: 9 }}>
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </p>
              <p className={`font-bold mt-0.5 ${isToday ? "text-foreground" : "text-foreground/70"}`}>
                {day.getDate()}
              </p>
              {hasPending && (
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mx-auto mt-0.5" />
              )}
              {hasEntries && !hasPending && (
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Timer} label="Hours This Week" value={`${totalHours.toFixed(1)}h`}
          sub={`${daysWorked} day${daysWorked !== 1 ? "s" : ""} logged`} />
        <StatCard icon={TrendingUp} label="Overtime" value={`${totalOT.toFixed(1)}h`}
          sub={totalOT > 0 ? "Above 8h/day" : "Within normal"} color={totalOT > 0 ? "hsl(38 92% 50%)" : undefined} />
        <StatCard icon={Clock} label="Pending Approval"
          value={String(pendingAll.length)}
          sub={pendingAll.length > 0 ? "Needs review" : "All reviewed"}
          color={pendingAll.length > 0 ? "hsl(38 92% 50%)" : "hsl(142 76% 36%)"} />
        <StatCard icon={CheckCheck} label="Approved"
          value={String(weekEntries.filter(e => e.status === "approved").length)}
          sub="This week" color="hsl(142 76% 36%)" />
      </div>

      {/* ── Pending Approval Banner (managers only) ── */}
      {canApproveTime && pendingAll.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {pendingAll.length} pending entr{pendingAll.length === 1 ? "y" : "ies"} need approval
            </p>
            {pendingAll.length > 1 && (
              <button
                onClick={() => bulkMut.mutate({ data: { ids: pendingAll.map(e => e.id) } })}
                disabled={bulkMut.isPending}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors">
                <CheckCheck className="h-3.5 w-3.5" />
                {bulkMut.isPending ? "Approving…" : "Approve All"}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pendingAll.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 bg-white rounded-xl border border-amber-100 px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100">
                    <User className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.employeeName || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(e.date)} · {fmtTime(e.clockIn)} – {fmtTime(e.clockOut)} · <span className="font-medium">{(e.hoursWorked ?? 0).toFixed(1)}h</span>
                      {(e.overtimeHours ?? 0) > 0 && <span className="text-amber-600"> (+{(e.overtimeHours ?? 0).toFixed(1)}h OT)</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => approveMut.mutate({ id: e.id })}
                    disabled={approveMut.isPending}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg transition-colors">
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <RejectButton onReject={() => rejectMut.mutate({ id: e.id, data: { reason: "" } })} isPending={rejectMut.isPending} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Status Tabs ── */}
      <div className="flex gap-1 bg-muted/40 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => setStatusTab(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              statusTab === tab.value
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-border p-8 flex items-center justify-center gap-3 text-muted-foreground">
          <div className="size-5 rounded-full border-2 border-muted animate-spin" style={{ borderTopColor: LIME }} />
          <span className="text-sm">Loading entries…</span>
        </div>
      ) : entryList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border py-16 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl" style={{ background: LIME + "20" }}>
            <Calendar className="h-6 w-6" style={{ color: LIME }} />
          </div>
          <div>
            <p className="font-semibold text-foreground">No entries this week</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {statusTab ? `No ${statusTab} entries` : "Log your first time entry for this week"}
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-foreground"
            style={{ background: LIME }}>
            <Plus className="h-4 w-4" /> Log Time
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/20">
                <tr>
                  {!isEmployee && <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Employee</th>}
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Clock In</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Clock Out</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Hours</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">OT</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Notes</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Status</th>
                  {canApproveTime && <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entryList.map((e) => {
                  const s = STATUS_STYLES[e.status] ?? STATUS_STYLES.pending;
                  const ot = e.overtimeHours ?? 0;
                  return (
                    <tr key={e.id} className="hover:bg-muted/10 transition-colors group">
                      {!isEmployee && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted/60 text-xs font-bold text-foreground/60">
                              {(e.employeeName ?? "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-foreground">{e.employeeName || "—"}</span>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3.5 text-muted-foreground">{fmtDate(e.date)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{fmtTime(e.clockIn)}</td>
                      <td className="px-4 py-3.5 text-muted-foreground font-mono text-xs">{fmtTime(e.clockOut)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-foreground">{(e.hoursWorked ?? 0).toFixed(1)}h</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {ot > 0
                          ? <span className="text-amber-600 font-semibold text-xs">{ot.toFixed(1)}h</span>
                          : <span className="text-muted-foreground/40">—</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 max-w-[160px]">
                        {e.notes ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground" title={e.notes}>
                            <StickyNote className="h-3 w-3 shrink-0" />
                            <span className="truncate">{e.notes}</span>
                          </span>
                        ) : <span className="text-muted-foreground/30">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
                          <span className={`size-1.5 rounded-full ${s.dot}`} />
                          {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                        </span>
                      </td>
                      {canApproveTime && (
                        <td className="px-5 py-3.5 text-right">
                          {e.status === "pending" && (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => approveMut.mutate({ id: e.id })}
                                disabled={approveMut.isPending}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              <RejectButton
                                onReject={() => rejectMut.mutate({ id: e.id, data: { reason: "" } })}
                                isPending={rejectMut.isPending}
                              />
                            </div>
                          )}
                          {e.status === "approved" && (
                            <span className="text-xs text-emerald-500 font-medium flex items-center justify-end gap-1">
                              <Check className="h-3.5 w-3.5" /> Done
                            </span>
                          )}
                          {e.status === "rejected" && (
                            <span className="text-xs text-red-400 flex items-center justify-end gap-1">
                              <X className="h-3.5 w-3.5" /> Rejected
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>{entryList.length} entr{entryList.length !== 1 ? "ies" : "y"}</span>
            <span className="font-medium">
              {entryList.reduce((a, e) => a + (e.hoursWorked ?? 0), 0).toFixed(1)}h total
              {entryList.some(e => (e.overtimeHours ?? 0) > 0) && (
                <span className="text-amber-500 ml-2">
                  · {entryList.reduce((a, e) => a + (e.overtimeHours ?? 0), 0).toFixed(1)}h OT
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* ── Log Time Modal ── */}
      {showModal && (
        <LogTimeModal
          onClose={() => setShowModal(false)}
          onSubmit={(data) => createMut.mutate({ data: { ...data, date: data.date } })}
          isEmployee={isEmployee}
          myEmployeeId={myEmployeeId}
          employees={empData?.employees ?? []}
          isPending={createMut.isPending}
        />
      )}
    </div>
  );
}
