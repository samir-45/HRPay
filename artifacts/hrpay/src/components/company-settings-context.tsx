import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth-context";

export interface CompanySettings {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  registrationNumber?: string;
  fiscalYearStart?: string;
  timezone?: string;
  currency?: string;
  dateFormat?: string;
  logoUrl?: string;
  payPeriod?: string;
  workingHoursPerDay?: number;
  workingDaysPerWeek?: number;
}

interface CompanySettingsContextValue {
  settings: CompanySettings;
  isLoading: boolean;
  refetch: () => void;
  /** Format a monetary amount using the company's currency & locale */
  formatCurrency: (amount: number) => string;
  /** Format a date string using the company's dateFormat */
  formatDate: (date: string | Date) => string;
}

const DEFAULT_SETTINGS: CompanySettings = {
  currency: "USD",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  fiscalYearStart: "January",
  payPeriod: "bi-weekly",
  workingHoursPerDay: 8,
  workingDaysPerWeek: 5,
};

const CompanySettingsContext = createContext<CompanySettingsContextValue | null>(null);

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "").replace(/^\/hrpay/, "") + "/api";

export function CompanySettingsProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!token || !user?.companyId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as CompanySettings;
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      }
    } catch {
      /* keep defaults silently */
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.companyId]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const formatCurrency = useCallback(
    (amount: number): string => {
      const currency = settings.currency ?? "USD";
      try {
        return new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${currency} ${amount.toFixed(2)}`;
      }
    },
    [settings.currency]
  );

  const formatDate = useCallback(
    (date: string | Date): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return String(date);
      const fmt = settings.dateFormat ?? "MM/DD/YYYY";
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      switch (fmt) {
        case "DD/MM/YYYY": return `${dd}/${mm}/${yyyy}`;
        case "YYYY-MM-DD": return `${yyyy}-${mm}-${dd}`;
        case "DD-MM-YYYY": return `${dd}-${mm}-${yyyy}`;
        case "DD.MM.YYYY": return `${dd}.${mm}.${yyyy}`;
        default: return `${mm}/${dd}/${yyyy}`;
      }
    },
    [settings.dateFormat]
  );

  return (
    <CompanySettingsContext.Provider
      value={{ settings, isLoading, refetch: fetchSettings, formatCurrency, formatDate }}
    >
      {children}
    </CompanySettingsContext.Provider>
  );
}

export function useCompanySettings(): CompanySettingsContextValue {
  const ctx = useContext(CompanySettingsContext);
  if (!ctx) throw new Error("useCompanySettings must be inside CompanySettingsProvider");
  return ctx;
}
