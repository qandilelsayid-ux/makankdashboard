"use client";

import getPermissions from "@/api/permissions";
import { fetchHelper } from "@/api/fetch";
import { ImageCell } from "@/components/common/table/columns/img-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useCityStore } from "@/store/cityStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FieldDef,
  fetchCities,
  isOk,
  loc,
  paginationOf,
  rowsOf,
  toFormData,
  toJsonBody
} from "./booking-utils";

export type CrudColumn = {
  key: string;
  label: string;
  render?: (row: any, ctx: { locale: string }) => ReactNode;
};

export type CrudFilter =
  | { kind: "city"; param?: string }
  | { kind: "remote"; param: string; label: string; endpoint: any; params?: Record<string, unknown>; required?: boolean }
  | { kind: "number"; param: string; label: string }
  | { kind: "text"; param: string; label: string }
  | { kind: "select"; param: string; label: string; options: { value: string; label: string }[] };

type Props = {
  title: string;
  endpoint: string; // key in utils/endpoints.ts, e.g. "bookingCategories"
  permissionKey: string; // permission prefix, e.g. "booking-categories"
  columns: CrudColumn[];
  fields: FieldDef[];
  filters?: CrudFilter[];
  multipart?: boolean;
  paginated?: boolean;
  // Query params that must be set before the list is requested (the API refuses unscoped lists for city admins).
  requiredFilters?: string[];
  note?: string;
  // Values used to pre-fill the create form from the active filters (e.g. placeId, cityId).
  prefillFromFilters?: string[];
  rowActions?: (row: any, reload: () => void) => ReactNode;
  canEditRow?: (row: any) => boolean;
};

const emptyValue = (def: FieldDef) => {
  if (def.type === "bool") return true;
  if (def.type === "localized" || def.type === "localizedText") return { ar: "", en: "" };
  if (def.type === "files") return [];
  return "";
};

function RemoteSelect({
  def,
  value,
  onChange,
  disabled
}: {
  def: { endpoint: any; params?: Record<string, unknown> };
  value: any;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const locale = useLocale();
  const q = useQuery({
    queryKey: ["bookingRemote", def.endpoint, def.params],
    queryFn: () => fetchHelper({ endPoint: [def.endpoint], params: { limit: 100, ...def.params }, isLocalized: false })
  });
  const rows = rowsOf(q.data);
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="-" />
      </SelectTrigger>
      <SelectContent>
        {rows.map((r: any) => (
          <SelectItem key={r.id} value={String(r.id)}>
            {loc(r.name ?? r.title, locale) || `#${r.id}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CitySelect({ value, onChange, disabled }: { value: any; onChange: (v: string) => void; disabled?: boolean }) {
  const locale = useLocale();
  const q = useQuery({ queryKey: ["bookingCities"], queryFn: fetchCities });
  return (
    <Select value={value ? String(value) : ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="-" />
      </SelectTrigger>
      <SelectContent>
        {(q.data ?? []).map(c => (
          <SelectItem key={c.id} value={String(c.id)}>
            {loc(c.name, locale)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function BookingCrud({
  title,
  endpoint,
  permissionKey,
  columns,
  fields,
  filters = [],
  multipart,
  paginated = true,
  requiredFilters = [],
  note,
  prefillFromFilters = [],
  rowActions,
  canEditRow
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const selectedCityId = useCityStore(s => s.selectedCityId);

  const [page, setPage] = useState(1);
  const [params, setParams] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const [values, setValues] = useState<Record<string, any>>({});

  // The selected city (cityStore) is the default city filter.
  useEffect(() => {
    if (filters.some(f => f.kind === "city") && selectedCityId) {
      setParams(p => (p.cityId ? p : { ...p, cityId: String(selectedCityId) }));
    }
  }, [selectedCityId]);

  const permsQuery = useQuery({ queryKey: ["myPermissions"], queryFn: getPermissions, staleTime: 60_000, retry: false });
  const perm = (permsQuery.data as any)?.[permissionKey];
  // Buttons are hidden only when the permission row exists and the method is false. The API enforces the real check.
  const can = (m: string) => (perm ? !!perm[m] : true);

  const missingRequired = requiredFilters.some(k => !params[k]);
  const cleanParams = useMemo(() => {
    const p: Record<string, unknown> = {};
    Object.entries(params).forEach(([k, v]) => v !== "" && v !== undefined && (p[k] = v));
    if (paginated) {
      p.page = page;
      p.limit = 15;
    }
    return p;
  }, [params, page, paginated]);

  const listQuery = useQuery({
    queryKey: ["booking", endpoint, cleanParams],
    enabled: !missingRequired,
    queryFn: () => fetchHelper({ endPoint: [endpoint as any], params: cleanParams, isLocalized: false })
  });
  const rows = rowsOf(listQuery.data);
  const pg = paginationOf(listQuery.data);
  const reload = () => queryClient.invalidateQueries({ queryKey: ["booking", endpoint] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isEdit = !!editing;
      const body = multipart ? toFormData(values, fields, isEdit) : toJsonBody(values, fields, isEdit);
      return fetchHelper({
        endPoint: isEdit ? [endpoint as any, editing.id] : [endpoint as any],
        method: isEdit ? "PATCH" : "POST",
        body,
        isLocalized: false
      });
    },
    onSuccess: res => {
      if (isOk(res)) {
        toast.success(t("Saved successfully"));
        setCreating(false);
        setEditing(null);
        reload();
      } else {
        toast.error((res as any)?.message || t("Something went wrong"));
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchHelper({ endPoint: [endpoint as any, id], method: "DELETE", isLocalized: false }),
    onSuccess: res => {
      if (isOk(res)) {
        toast.success(t("Deleted successfully"));
        reload();
      } else toast.error((res as any)?.message || t("Something went wrong"));
    }
  });

  const openCreate = () => {
    const init: Record<string, any> = {};
    fields.forEach(f => (init[f.name] = emptyValue(f)));
    prefillFromFilters.forEach(k => params[k] && (init[k] = params[k]));
    if (fields.some(f => f.name === "cityId") && !init.cityId && selectedCityId) init.cityId = String(selectedCityId);
    setValues(init);
    setEditing(null);
    setCreating(true);
  };

  const openEdit = (row: any) => {
    const init: Record<string, any> = {};
    fields.forEach(f => {
      const v = row[f.name];
      if (f.type === "file" || f.type === "files") init[f.name] = f.type === "files" ? [] : "";
      else if (f.type === "localized" || f.type === "localizedText") init[f.name] = { ar: v?.ar ?? "", en: v?.en ?? "" };
      else if (f.type === "bool") init[f.name] = v ?? true;
      else if (f.type === "json") init[f.name] = v === undefined || v === null ? "" : typeof v === "string" ? v : JSON.stringify(v, null, 2);
      else if (f.type === "datetime") init[f.name] = v ? String(v).slice(0, 16) : "";
      else init[f.name] = v ?? "";
    });
    setValues(init);
    setEditing(row);
    setCreating(true);
  };

  const submit = () => {
    for (const f of fields) {
      if (editing && f.hideOnEdit) continue;
      const v = values[f.name];
      const empty =
        v === undefined ||
        v === "" ||
        (f.type === "localized" && !(v?.ar || v?.en)) ||
        (f.type === "localizedText" && !(v?.ar || v?.en));
      // An existing image stays when no new file is chosen.
      if (f.required && empty && !(editing && (f.type === "file" || f.type === "files"))) {
        toast.error(`${t(f.label)}: ${t("Required")}`);
        return;
      }
    }
    saveMutation.mutate();
  };

  const set = (name: string, v: any) => setValues(prev => ({ ...prev, [name]: v }));

  const renderField = (f: FieldDef) => {
    const v = values[f.name];
    const readOnly = !!editing && f.readOnlyOnEdit;
    switch (f.type) {
      case "localized":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input dir="rtl" placeholder="AR" value={v?.ar ?? ""} onChange={e => set(f.name, { ...v, ar: e.target.value })} />
            <Input dir="ltr" placeholder="EN" value={v?.en ?? ""} onChange={e => set(f.name, { ...v, en: e.target.value })} />
          </div>
        );
      case "localizedText":
        return (
          <div className="grid grid-cols-2 gap-2">
            <textarea dir="rtl" placeholder="AR" rows={3} className="rounded-md border bg-background p-2 text-sm" value={v?.ar ?? ""} onChange={e => set(f.name, { ...v, ar: e.target.value })} />
            <textarea dir="ltr" placeholder="EN" rows={3} className="rounded-md border bg-background p-2 text-sm" value={v?.en ?? ""} onChange={e => set(f.name, { ...v, en: e.target.value })} />
          </div>
        );
      case "textarea":
      case "json":
        return <textarea rows={4} className="w-full rounded-md border bg-background p-2 text-sm font-mono" value={v ?? ""} onChange={e => set(f.name, e.target.value)} />;
      case "number":
        return <Input type="number" step="any" value={v ?? ""} disabled={readOnly} onChange={e => set(f.name, e.target.value)} />;
      case "datetime":
        return <Input type="datetime-local" value={v ?? ""} onChange={e => set(f.name, e.target.value ? new Date(e.target.value).toISOString() : "")} />;
      case "bool":
        return <input type="checkbox" className="h-5 w-5" checked={!!v} onChange={e => set(f.name, e.target.checked)} />;
      case "select":
        return (
          <Select value={v ? String(v) : ""} onValueChange={x => set(f.name, x)} disabled={readOnly}>
            <SelectTrigger>
              <SelectValue placeholder="-" />
            </SelectTrigger>
            <SelectContent>
              {(f.options ?? []).map(o => (
                <SelectItem key={o.value} value={String(o.value)}>
                  {t(o.label)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "remote":
        return f.name === "cityId" ? (
          <CitySelect value={v} onChange={x => set(f.name, x)} disabled={readOnly} />
        ) : (
          <RemoteSelect def={f.remote!} value={v} onChange={x => set(f.name, x)} disabled={readOnly} />
        );
      case "file":
        return (
          <div className="space-y-2">
            {editing?.[f.name] && typeof editing[f.name] === "string" && (
              <div className="h-16 w-24 overflow-hidden rounded">
                <ImageCell cell={editing[f.name]} />
              </div>
            )}
            <input type="file" accept="image/*" onChange={e => set(f.name, e.target.files?.[0] ?? "")} />
          </div>
        );
      case "files":
        return (
          <div className="space-y-2">
            {Array.isArray(editing?.[f.name]) && editing[f.name].length > 0 && (
              <p className="text-xs text-muted-foreground">{t("Choosing new images replaces the current ones")}</p>
            )}
            <input type="file" accept="image/*" multiple onChange={e => set(f.name, Array.from(e.target.files ?? []))} />
          </div>
        );
      default:
        return <Input value={v ?? ""} disabled={readOnly} placeholder={f.placeholder} onChange={e => set(f.name, e.target.value)} />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t(title)}</CardTitle>
        {can("post") && (
          <Button onClick={openCreate} disabled={missingRequired}>
            <Plus className="me-1 h-4 w-4" />
            {t("Add")}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {note && <p className="rounded-md bg-muted p-3 text-sm">{t(note)}</p>}

        {filters.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {filters.map(f => {
              const param = f.kind === "city" ? f.param ?? "cityId" : f.param;
              const label = f.kind === "city" ? t("City") : t(f.label);
              return (
                <div key={param} className="space-y-1">
                  <label className="text-xs text-muted-foreground">{label}</label>
                  {f.kind === "city" && (
                    <CitySelect value={params[param]} onChange={v => { setPage(1); setParams(p => ({ ...p, [param]: v })); }} />
                  )}
                  {f.kind === "remote" && (
                    <RemoteSelect def={{ endpoint: f.endpoint, params: f.params }} value={params[param]} onChange={v => { setPage(1); setParams(p => ({ ...p, [param]: v })); }} />
                  )}
                  {f.kind === "select" && (
                    <Select value={params[param] ?? ""} onValueChange={v => { setPage(1); setParams(p => ({ ...p, [param]: v === "ALL" ? "" : v })); }}>
                      <SelectTrigger>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">{t("All")}</SelectItem>
                        {f.options.map(o => (
                          <SelectItem key={o.value} value={o.value}>{t(o.label)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {(f.kind === "number" || f.kind === "text") && (
                    <Input type={f.kind === "number" ? "number" : "text"} value={params[param] ?? ""} onChange={e => { setPage(1); setParams(p => ({ ...p, [param]: e.target.value })); }} />
                  )}
                </div>
              );
            })}
            {Object.values(params).some(Boolean) && (
              <div className="flex items-end">
                <Button variant="outline" onClick={() => setParams({})}>{t("Clear filters")}</Button>
              </div>
            )}
          </div>
        )}

        {missingRequired ? (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("Choose a filter to see the list")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(c => (
                  <TableHead key={c.key}>{t(c.label)}</TableHead>
                ))}
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {listQuery.isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>{t("Loading")}...</TableCell>
                </TableRow>
              )}
              {!listQuery.isLoading && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">{t("No data")}</TableCell>
                </TableRow>
              )}
              {rows.map((row: any) => (
                <TableRow key={row.id}>
                  {columns.map(c => (
                    <TableCell key={c.key}>
                      {c.render ? c.render(row, { locale }) : defaultCell(row[c.key], locale, t)}
                    </TableCell>
                  ))}
                  <TableCell className="flex items-center justify-end gap-1">
                    {rowActions?.(row, reload)}
                    {(can("patch") || can("put")) && (canEditRow ? canEditRow(row) : true) && (
                      <Button size="icon" variant="ghost" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    {can("delete") && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => window.confirm(t("Are you sure?")) && deleteMutation.mutate(row.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {paginated && pg && pg.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("Previous")}</Button>
            <span className="text-sm">{pg.page} / {pg.totalPages}</span>
            <Button variant="outline" disabled={page >= pg.totalPages} onClick={() => setPage(p => p + 1)}>{t("Next")}</Button>
          </div>
        )}
      </CardContent>

      <Dialog open={creating} onOpenChange={o => !o && (setCreating(false), setEditing(null))}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? t("Edit") : t("Add")} - {t(title)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {fields
              .filter(f => !(editing && f.hideOnEdit))
              .map(f => (
                <div key={f.name} className="space-y-1">
                  <label className="text-sm font-medium">
                    {t(f.label)} {f.required && <span className="text-red-600">*</span>}
                  </label>
                  {renderField(f)}
                  {f.help && <p className="text-xs text-muted-foreground">{t(f.help)}</p>}
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => (setCreating(false), setEditing(null))}>{t("Cancel")}</Button>
            <Button onClick={submit} disabled={saveMutation.isPending}>{t("Save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function defaultCell(v: any, locale: string, t: (k: string) => string): ReactNode {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return <Badge variant={v ? "default" : "secondary"}>{v ? t("Yes") : t("No")}</Badge>;
  if (typeof v === "object") return loc(v, locale) || "-";
  return String(v);
}
