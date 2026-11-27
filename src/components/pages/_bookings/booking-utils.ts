import { fetchHelper } from "@/api/fetch";

export type Localized = { ar?: string; en?: string } | string | null | undefined;

// Name stored as { ar, en } (the API returns it raw when isLocalized is false).
export function loc(value: Localized, locale: string): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value as any)[locale] || value.ar || value.en || "";
}

// List endpoints answer { data: [...], pagination } (or { data: { data, pagination } }).
export function rowsOf(res: any): any[] {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  return [];
}

export function paginationOf(res: any): { page: number; limit: number; total: number; totalPages: number } | null {
  return res?.pagination ?? res?.data?.pagination ?? null;
}

export function isOk(res: any): boolean {
  return !!res && res.success !== false;
}

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "bool"
  | "localized"
  | "localizedText"
  | "select"
  | "remote"
  | "file"
  | "files"
  | "datetime"
  | "json";

export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string | number; label: string }[]; // select
  remote?: { endpoint: any; params?: Record<string, unknown> }; // remote select (id + name)
  hideOnEdit?: boolean; // only sent on create
  readOnlyOnEdit?: boolean;
  placeholder?: string;
  help?: string;
};

// Multipart bodies follow the dashboard convention (extractFormNameInputs):
// { ar, en } names are JSON strings, booleans are "true"/"false", files are appended by field name.
export function toFormData(values: Record<string, any>, defs: FieldDef[], isEdit: boolean): FormData {
  const fd = new FormData();
  for (const def of defs) {
    if (isEdit && def.hideOnEdit) continue;
    const v = values[def.name];
    if (def.type === "file") {
      if (v instanceof File) fd.append(def.name, v);
      continue;
    }
    if (def.type === "files") {
      if (Array.isArray(v)) v.forEach(f => f instanceof File && fd.append(def.name, f));
      continue;
    }
    if (v === undefined || v === null || v === "") continue;
    if (def.type === "localized" || def.type === "localizedText") {
      fd.append(def.name, JSON.stringify({ ar: v.ar ?? "", en: v.en ?? "" }));
    } else if (def.type === "json") {
      fd.append(def.name, typeof v === "string" ? v : JSON.stringify(v));
    } else {
      fd.append(def.name, String(v));
    }
  }
  return fd;
}

export function toJsonBody(values: Record<string, any>, defs: FieldDef[], isEdit: boolean) {
  const body: Record<string, unknown> = {};
  for (const def of defs) {
    if (isEdit && def.hideOnEdit) continue;
    const v = values[def.name];
    if (v === undefined || v === null || v === "") continue;
    if (def.type === "number" || def.type === "remote") body[def.name] = Number(v);
    else if (def.type === "json") {
      try {
        body[def.name] = typeof v === "string" ? JSON.parse(v) : v;
      } catch {
        body[def.name] = v;
      }
    } else body[def.name] = v;
  }
  return body;
}

export async function fetchCities(): Promise<{ id: number; name: Localized }[]> {
  const res = await fetchHelper({ endPoint: ["cities"], params: { limit: 100 }, isLocalized: false });
  return rowsOf(res);
}

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED"
] as const;

export const statusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-sky-100 text-sky-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
  EXPIRED: "bg-slate-200 text-slate-700",
  AWAITING_VERIFICATION: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REFUND_DUE: "bg-red-100 text-red-800",
  REFUNDED: "bg-slate-200 text-slate-700"
};
