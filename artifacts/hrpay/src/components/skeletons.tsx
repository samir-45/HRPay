import React from "react";
import { cn } from "@/lib/utils";

/* ─── Base pulse block ─────────────────────────────────────── */
function Bone({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/* ─── Table skeleton ───────────────────────────────────────── */
export function SkeletonTableRows({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/50">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <Bone className={`h-4 ${j === 0 ? "w-32" : j === cols - 1 ? "w-16 ml-auto" : "w-24"}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/* ─── Table with avatar in first cell ─────────────────────── */
export function SkeletonEmployeeTableRows({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/50">
          <td className="px-5 py-3">
            <div className="flex items-center gap-3">
              <Bone className="size-9 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Bone className="h-3.5 w-28" />
                <Bone className="h-3 w-20" />
              </div>
            </div>
          </td>
          {[20, 16, 16, 14].map((w, j) => (
            <td key={j} className="px-4 py-3"><Bone className={`h-3.5 w-${w}`} /></td>
          ))}
          <td className="px-5 py-3 text-right">
            <div className="flex justify-end gap-2">
              <Bone className="size-7 rounded-lg" />
              <Bone className="size-7 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ─── Card grid skeletons ──────────────────────────────────── */
export function SkeletonCards({ count = 6, cols = 3 }: { count?: number; cols?: number }) {
  const gridCls = cols === 2
    ? "grid-cols-1 sm:grid-cols-2"
    : cols === 4
    ? "grid-cols-2 lg:grid-cols-4"
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`grid ${gridCls} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border bg-white p-5 space-y-4">
          <div className="flex items-start justify-between">
            <Bone className="size-10 rounded-lg" />
            <div className="flex gap-1">
              <Bone className="size-7 rounded-lg" />
              <Bone className="size-7 rounded-lg" />
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-4 w-32" />
            <Bone className="h-3 w-48" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-5 w-8" />
            </div>
            <div className="rounded-lg bg-muted/40 p-3 space-y-2">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── KPI strip ────────────────────────────────────────────── */
export function SkeletonKpiStrip({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <Bone className="size-8 rounded-lg" />
          <Bone className="h-3 w-24" />
          <Bone className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

/* ─── Announcement cards ───────────────────────────────────── */
export function SkeletonAnnouncementCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-40" />
                <Bone className="h-5 w-14 rounded-full" />
              </div>
              <Bone className="h-3 w-full" />
              <Bone className="h-3 w-3/4" />
              <div className="flex gap-3 mt-3">
                <Bone className="h-3 w-16" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            <div className="flex gap-1">
              <Bone className="size-8 rounded-lg" />
              <Bone className="size-8 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Performance / Goal cards ─────────────────────────────── */
export function SkeletonGoalCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Bone className="h-4 w-48" />
                <Bone className="h-5 w-20 rounded-full" />
              </div>
              <Bone className="h-3 w-32" />
              <Bone className="h-3 w-64" />
            </div>
            <div className="text-right space-y-1">
              <Bone className="h-7 w-14 ml-auto" />
              <Bone className="h-3 w-20 ml-auto" />
            </div>
          </div>
          <div className="space-y-2">
            <Bone className="h-2 w-full rounded-full" />
            <div className="flex gap-2">
              {[0,1,2,3,4].map(j => <Bone key={j} className="h-5 w-10 rounded-full" />)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Training course cards ────────────────────────────────── */
export function SkeletonCourseCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <div className="flex items-start justify-between">
            <Bone className="size-9 rounded-xl" />
            <div className="flex gap-1.5">
              <Bone className="h-5 w-16 rounded-full" />
              <Bone className="h-5 w-12 rounded-full" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-2/3" />
          </div>
          <div className="space-y-1.5">
            <Bone className="h-3 w-24 rounded-full" />
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-28" />
          </div>
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <Bone className="h-3 w-24" />
            <Bone className="h-7 w-14 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Recruitment job list ─────────────────────────────────── */
export function SkeletonJobCards({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5 flex-1">
              <Bone className="h-4 w-36" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-5 w-14 rounded-full" />
          </div>
          <div className="flex gap-3">
            <Bone className="h-3 w-20" />
            <Bone className="h-3 w-16" />
          </div>
          <Bone className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/* ─── Onboarding task groups ───────────────────────────────── */
export function SkeletonOnboardingGroups({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="space-y-1.5">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-28" />
            </div>
            <div className="flex items-center gap-3">
              <Bone className="h-2 w-32 rounded-full" />
              <Bone className="h-4 w-10" />
            </div>
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-4 px-5 py-3.5">
                <Bone className="size-5 rounded-md shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Bone className="h-3.5 w-48" />
                  <Bone className="h-3 w-32" />
                </div>
                <Bone className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Employee profile ─────────────────────────────────────── */
export function SkeletonEmployeeProfile() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bone className="size-9 rounded-lg" />
        <div className="flex-1" />
      </div>
      {/* Profile hero */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          <Bone className="size-20 rounded-full shrink-0" />
          <div className="flex-1 space-y-2.5">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-32" />
            <div className="flex gap-3 mt-2">
              <Bone className="h-5 w-20 rounded-full" />
              <Bone className="h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0,1,2].map(i => (
              <div key={i} className="rounded-xl bg-muted/40 p-3 space-y-1.5">
                <Bone className="h-3 w-16" />
                <Bone className="h-5 w-12" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 pt-5 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[0,1,2,3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <Bone className="size-4 rounded" />
              <div className="space-y-1">
                <Bone className="h-2.5 w-12" />
                <Bone className="h-3.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Content tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0,1].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <Bone className="h-4 w-24 mb-3" />
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between py-2 border-b border-border/50">
                <Bone className="h-3 w-28" />
                <Bone className="h-3.5 w-36" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Payroll detail ───────────────────────────────────────── */
export function SkeletonPayrollDetail() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bone className="size-9 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <Bone className="h-5 w-48" />
          <Bone className="h-3.5 w-72" />
        </div>
        <Bone className="h-7 w-20 rounded-full" />
        <Bone className="h-9 w-32 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-border p-5 space-y-2">
            <Bone className="h-3.5 w-20" />
            <Bone className="h-7 w-28" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border space-y-1">
          <Bone className="h-4 w-20" />
          <Bone className="h-3 w-28" />
        </div>
        <table className="w-full">
          <thead className="border-b border-border bg-muted/30">
            <tr>
              {["Employee", "Hours", "Gross", "Federal", "State", "FICA", "Net Pay"].map(h => (
                <th key={h} className="px-4 py-3"><Bone className="h-3 w-14" /></th>
              ))}
            </tr>
          </thead>
          <tbody><SkeletonTableRows rows={5} cols={7} /></tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Settings form ────────────────────────────────────────── */
export function SkeletonSettingsForm() {
  return (
    <div className="space-y-4">
      <Bone className="h-5 w-36 mb-4" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Bone className="h-3.5 w-28" />
            <Bone className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Bone className="h-3.5 w-20" />
        <Bone className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

/* ─── Dashboard KPI cards ──────────────────────────────────── */
export function SkeletonDashboard() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0,1,2,3].map(i => (
          <div key={i} className="rounded-2xl border border-border bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Bone className="size-8 rounded-lg" />
              <Bone className="h-5 w-14 rounded-full" />
            </div>
            <Bone className="h-3 w-24" />
            <Bone className="h-7 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Bone className="h-4 w-40" />
              <Bone className="h-3 w-56" />
            </div>
            <div className="flex gap-1">
              {[0,1,2,3].map(i => <Bone key={i} className="h-7 w-10 rounded-lg" />)}
            </div>
          </div>
          <Bone className="h-48 w-full rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <Bone className="h-4 w-32" />
          <Bone className="h-40 w-full rounded-xl" />
          <div className="space-y-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="flex items-center gap-2">
                <Bone className="size-2.5 rounded-sm shrink-0" />
                <Bone className="h-3 flex-1" />
                <Bone className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
