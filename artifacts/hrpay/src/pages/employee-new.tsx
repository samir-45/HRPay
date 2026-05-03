import React, { useState } from "react";
import { useLocation } from "wouter";
import { useCreateEmployee, useListDepartments, getListEmployeesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function EmployeeNew() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data: depts } = useListDepartments();
  const createMut = useCreateEmployee({
    mutation: {
      onSuccess: (emp) => {
        qc.invalidateQueries({ queryKey: getListEmployeesQueryKey({}) });
        navigate(`/employees/${emp.id}`);
      },
    },
  });

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", position: "",
    departmentId: "", employmentType: "full_time", status: "active",
    startDate: new Date().toISOString().split("T")[0],
    salary: "", salaryType: "annual", city: "", state: "", country: "US",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      data: {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        position: form.position,
        departmentId: form.departmentId ? Number(form.departmentId) : undefined,
        employmentType: form.employmentType as "full_time" | "part_time" | "contractor" | "intern",
        startDate: form.startDate,
        salary: form.salary ? Number(form.salary) : undefined,
        salaryType: form.salaryType as "annual" | "hourly" | undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || undefined,
      },
    });
  };

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees" className="p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h2 className="text-lg font-semibold">Add New Employee</h2>
          <p className="text-sm text-muted-foreground">Fill in the details below to create an employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required>
              <input required value={form.firstName} onChange={set("firstName")} className={inputCls} placeholder="Jane" />
            </Field>
            <Field label="Last Name" required>
              <input required value={form.lastName} onChange={set("lastName")} className={inputCls} placeholder="Smith" />
            </Field>
            <Field label="Email" required>
              <input required type="email" value={form.email} onChange={set("email")} className={inputCls} placeholder="jane@company.com" />
            </Field>
            <Field label="Phone">
              <input value={form.phone} onChange={set("phone")} className={inputCls} placeholder="+1-415-555-0100" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="City">
              <input value={form.city} onChange={set("city")} className={inputCls} placeholder="San Francisco" />
            </Field>
            <Field label="State">
              <input value={form.state} onChange={set("state")} className={inputCls} placeholder="CA" />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={set("country")} className={inputCls} placeholder="US" />
            </Field>
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Employment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Job Title" required>
              <input required value={form.position} onChange={set("position")} className={inputCls} placeholder="Software Engineer" />
            </Field>
            <Field label="Department">
              <select value={form.departmentId} onChange={set("departmentId")} className={inputCls}>
                <option value="">Select department</option>
                {(depts ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Employment Type">
              <select value={form.employmentType} onChange={set("employmentType")} className={inputCls}>
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contractor">Contractor</option>
                <option value="intern">Intern</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={set("status")} className={inputCls}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Start Date" required>
              <input required type="date" value={form.startDate} onChange={set("startDate")} className={inputCls} />
            </Field>
          </div>
        </div>

        {/* Compensation */}
        <div className="bg-white rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Compensation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Salary / Rate">
              <input type="number" value={form.salary} onChange={set("salary")} className={inputCls} placeholder="95000" />
            </Field>
            <Field label="Pay Type">
              <select value={form.salaryType} onChange={set("salaryType")} className={inputCls}>
                <option value="annual">Annual salary</option>
                <option value="hourly">Hourly rate</option>
              </select>
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-3 justify-end">
          <Link href="/employees" className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMut.isPending}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {createMut.isPending ? "Creating..." : "Create Employee"}
          </button>
        </div>

        {createMut.isError && (
          <p className="text-sm text-destructive text-right">Failed to create employee. Please try again.</p>
        )}
      </form>
    </div>
  );
}
