import React, { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface EmpOption {
  id: number;
  employeeCode?: string | null;
  firstName: string;
  lastName: string;
  position?: string | null;
  avatarUrl?: string | null;
}

interface Props {
  employees: EmpOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

function EmpAvatar({ emp }: { emp: EmpOption }) {
  const name = `${emp.firstName} ${emp.lastName}`;
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hue = (name.charCodeAt(0) * 37) % 360;
  if (emp.avatarUrl) {
    return (
      <img
        src={emp.avatarUrl}
        alt={name}
        className="size-7 rounded-full object-cover shrink-0"
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div
      className="size-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
      style={{ background: `hsl(${hue} 60% 45%)` }}
    >
      {initials}
    </div>
  );
}

export function EmployeeSearchSelect({
  employees,
  value,
  onChange,
  required,
  className = "",
  placeholder = "Search by name or ID…",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = employees.find((e) => String(e.id) === value) ?? null;

  const filtered = query.trim()
    ? employees.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
          (e.employeeCode ?? "").toLowerCase().includes(q) ||
          (e.position ?? "").toLowerCase().includes(q)
        );
      })
    : employees;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function openDropdown() {
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(emp: EmpOption) {
    onChange(String(emp.id));
    setOpen(false);
    setQuery("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange("");
    setOpen(false);
    setQuery("");
  }

  const baseCls = `w-full rounded-xl border border-border bg-muted/30 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary/20 ${className}`;

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className={`${baseCls} flex items-center gap-2 px-3 py-2.5`}>
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-sm min-w-0"
          />
          {value && (
            <button type="button" onClick={clear} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={openDropdown}
          className={`${baseCls} flex items-center gap-2.5 px-3 py-2.5 text-left`}
        >
          {selected ? (
            <>
              <EmpAvatar emp={selected} />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{selected.firstName} {selected.lastName}</span>
                <span className="ml-2 inline-flex items-center px-1.5 py-px rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary leading-tight">
                  {selected.employeeCode ?? `EMP-${String(selected.id).padStart(6, "0")}`}
                </span>
              </div>
              <button type="button" onClick={clear} className="shrink-0 text-muted-foreground hover:text-foreground ml-auto">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 text-muted-foreground">{required ? "Select employee…" : "Select employee (optional)"}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            </>
          )}
        </button>
      )}

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-border shadow-lg overflow-hidden">
          <div className="max-h-56 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">No employees found</div>
            ) : (
              filtered.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => select(emp)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40 transition-colors ${String(emp.id) === value ? "bg-primary/5" : ""}`}
                >
                  <EmpAvatar emp={emp} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-sm text-foreground">{emp.firstName} {emp.lastName}</span>
                      <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-mono font-semibold bg-primary/10 text-primary leading-tight">
                        {emp.employeeCode ?? `EMP-${String(emp.id).padStart(6, "0")}`}
                      </span>
                    </div>
                    {emp.position && <p className="text-xs text-muted-foreground truncate">{emp.position}</p>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {required && !value && (
        <input type="text" required className="sr-only" tabIndex={-1} readOnly value="" aria-hidden="true" />
      )}
    </div>
  );
}
