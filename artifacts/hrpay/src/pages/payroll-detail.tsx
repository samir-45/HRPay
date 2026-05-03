import React, { useState } from "react";
import { useParams, Link } from "wouter";
import {
  useGetPayrollRun,
  useListPayStubs,
  useProcessPayrollRun,
  getGetPayrollRunQueryKey,
  getListPayStubsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Play } from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { toast } from "@/components/ui/sonner";

function fmt(n: number | null | undefined) {
  if (n == null) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-600",
};

export default function PayrollDetail() {
  const { id } = useParams<{ id: string }>();
  const runId = Number(id);
  const qc = useQueryClient();
  const [showConfirm, setShowConfirm] = useState(false);

  const { data: run, isLoading } = useGetPayrollRun(runId, { query: { queryKey: getGetPayrollRunQueryKey(runId) } });
  const { data: stubs } = useListPayStubs({ payrollRunId: runId }, { query: { queryKey: getListPayStubsQueryKey({ payrollRunId: runId }) } });

  const processMut = useProcessPayrollRun({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetPayrollRunQueryKey(runId) });
        qc.invalidateQueries({ queryKey: getListPayStubsQueryKey({ payrollRunId: runId }) });
        toast.success("Payroll processed", { description: "Pay stubs have been generated for all active employees." });
      },
      onError: () => toast.error("Failed to process payroll", { description: "Please check the payroll run and try again." }),
    },
  });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Loading...</div>;
  if (!run) return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Payroll run not found.</div>;

  const stubList = stubs ?? [];
  const totalFederal = stubList.reduce((a, s) => a + (s.federalTax ?? 0), 0);
  const totalState = stubList.reduce((a, s) => a + (s.stateTax ?? 0), 0);
  const totalSS = stubList.reduce((a, s) => a + (s.socialSecurity ?? 0), 0);
  const totalMedicare = stubList.reduce((a, s) => a + (s.medicare ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/payroll" className="p-2 rounded-lg border border-border hover:bg-muted/50"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">{run.name}</h2>
          <p className="text-sm text-muted-foreground">{run.periodStart} to {run.periodEnd} · Pay date: {run.payDate}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[run.status]}`}>{run.status}</span>
        {run.status === "draft" && (
          <button
            onClick={() => setShowConfirm(true)}
            disabled={processMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {processMut.isPending ? "Processing..." : "Process Run"}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Gross Pay", value: fmt(run.totalGrossPay), accent: "text-foreground" },
          { label: "Total Taxes", value: fmt(run.totalTaxes), accent: "text-amber-700" },
          { label: "Total Deductions", value: fmt(run.totalDeductions), accent: "text-orange-700" },
          { label: "Net Pay", value: fmt(run.totalNetPay), accent: "text-emerald-700" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-border p-5">
            <p className="text-sm text-muted-foreground">{c.label}</p>
            <p className={`text-2xl font-bold mt-1 ${c.accent}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {stubList.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Federal Tax", value: fmt(totalFederal) },
            { label: "State Tax", value: fmt(totalState) },
            { label: "Social Security", value: fmt(totalSS) },
            { label: "Medicare", value: fmt(totalMedicare) },
          ].map((c) => (
            <div key={c.label} className="bg-muted/30 rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-lg font-semibold mt-0.5">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pay Stubs Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Pay Stubs</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{stubList.length} employees</p>
        </div>
        {stubList.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            {run.status === "draft" ? "Process this run to generate pay stubs." : "No pay stubs found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Employee</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Hours</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Federal</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">State</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">FICA</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Net Pay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stubList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3">
                      <Link href={`/employees/${s.employeeId}`} className="font-medium text-foreground hover:text-primary">
                        {s.employeeName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.hoursWorked ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium">{fmt(s.grossPay)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(s.federalTax)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt(s.stateTax)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{fmt((s.socialSecurity ?? 0) + (s.medicare ?? 0))}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-700">{fmt(s.netPay)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={showConfirm}
        title="Process this payroll run?"
        description={`This will calculate and finalize pay for all active employees in the "${run.name}" run. Pay stubs will be generated and the run status will change to completed.`}
        confirmLabel="Process Payroll"
        dangerous={false}
        onConfirm={() => processMut.mutate({ id: runId })}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
