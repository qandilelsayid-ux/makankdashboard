"use client";

import { fetchHelper } from "@/api/fetch";
import { ImageCell } from "@/components/common/table/columns/img-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useCityStore } from "@/store/cityStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BOOKING_STATUSES, isOk, loc, paginationOf, rowsOf, statusClass } from "./booking-utils";

type Action = "approve" | "reject" | "complete" | "cancel" | "refunded";
const ACTION_KEY: Record<Action, string> = {
  approve: "bookingApprove",
  reject: "bookingReject",
  complete: "bookingComplete",
  cancel: "bookingCancel",
  refunded: "bookingRefunded"
};

const fmt = (v?: string) => (v ? new Date(v).toLocaleString() : "-");

function StatusBadge({ value }: { value: string }) {
  const t = useTranslations();
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass[value] ?? ""}`}>{t(value)}</span>;
}

export default function BookingsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const selectedCityId = useCityStore(s => s.selectedCityId);

  const [status, setStatus] = useState<string>("PENDING");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [pending, setPending] = useState<{ id: number; action: Action } | null>(null);
  const [note, setNote] = useState("");

  const listQuery = useQuery({
    queryKey: ["booking", "bookingsAdmin", status, search, fromDate, toDate, page, selectedCityId],
    queryFn: () =>
      fetchHelper({
        endPoint: ["bookings", "bookingsAdmin"],
        isLocalized: false,
        params: {
          page,
          limit: 15,
          status: status === "ALL" ? undefined : status,
          search: search.trim() || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          cityId: selectedCityId || undefined
        }
      })
  });
  const rows = rowsOf(listQuery.data);
  const pg = paginationOf(listQuery.data);

  const detailQuery = useQuery({
    queryKey: ["booking", "bookingDetail", openId],
    enabled: openId !== null,
    queryFn: () => fetchHelper({ endPoint: ["bookings", "bookingsAdmin", openId as number], isLocalized: false })
  });
  const detail: any = (detailQuery.data as any)?.data;

  const actionMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: Action }) => {
      const body =
        action === "approve"
          ? { adminNote: note.trim() || undefined }
          : action === "reject" || action === "cancel"
          ? { reason: note.trim() || undefined }
          : undefined;
      return fetchHelper({
        endPoint: ["bookings", "bookingsAdmin", id, ACTION_KEY[action] as any],
        method: "PATCH",
        body,
        isLocalized: false
      });
    },
    onSuccess: res => {
      if (isOk(res)) {
        toast.success(t("Saved successfully"));
        setPending(null);
        setNote("");
        queryClient.invalidateQueries({ queryKey: ["booking"] });
        queryClient.invalidateQueries({ queryKey: ["bookingsPendingCount"] });
      } else toast.error((res as any)?.message || t("Something went wrong"));
    }
  });

  const confirm = (id: number, action: Action) => {
    setNote("");
    setPending({ id, action });
  };
  const submitAction = () => {
    if (!pending) return;
    if (pending.action === "reject" && !note.trim()) {
      toast.error(t("A reason is required"));
      return;
    }
    actionMutation.mutate(pending);
  };

  const actionsFor = (b: any): Action[] => {
    const out: Action[] = [];
    if (b.status === "PENDING") out.push("approve", "reject", "cancel");
    if (b.status === "CONFIRMED") out.push("complete", "cancel");
    if (b.paymentStatus === "REFUND_DUE") out.push("refunded");
    return out;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Bookings")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {["ALL", ...BOOKING_STATUSES].map(s => (
            <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => { setStatus(s); setPage(1); }}>
              {s === "ALL" ? t("All") : t(s)}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input placeholder={t("Search by number, name or phone")} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          <Input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
          <Input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("Booking number")}</TableHead>
              <TableHead>{t("Customer")}</TableHead>
              <TableHead>{t("Place")}</TableHead>
              <TableHead>{t("Time")}</TableHead>
              <TableHead>{t("Total")}</TableHead>
              <TableHead>{t("Status")}</TableHead>
              <TableHead>{t("Payment")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {listQuery.isLoading ? `${t("Loading")}...` : t("No data")}
                </TableCell>
              </TableRow>
            )}
            {rows.map((b: any) => (
              <TableRow key={b.id}>
                <TableCell>{b.bookingNumber}</TableCell>
                <TableCell>
                  {b.customerName}
                  <div className="text-xs text-muted-foreground" dir="ltr">{b.customerPhone}</div>
                </TableCell>
                <TableCell>
                  {loc(b.Place?.name, locale)}
                  <div className="text-xs text-muted-foreground">{loc(b.Item?.name, locale)}</div>
                </TableCell>
                <TableCell>{fmt(b.Slot?.startAt)}</TableCell>
                <TableCell>{b.totalAmount}</TableCell>
                <TableCell><StatusBadge value={b.status} /></TableCell>
                <TableCell><StatusBadge value={b.paymentStatus} /></TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => setOpenId(b.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pg && pg.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>{t("Previous")}</Button>
            <span className="text-sm">{pg.page} / {pg.totalPages}</span>
            <Button variant="outline" disabled={page >= pg.totalPages} onClick={() => setPage(p => p + 1)}>{t("Next")}</Button>
          </div>
        )}
      </CardContent>

      {/* Details + receipt review */}
      <Dialog open={openId !== null} onOpenChange={o => !o && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("Booking")} {detail?.bookingNumber}</DialogTitle>
          </DialogHeader>
          {!detail ? (
            <p>{t("Loading")}...</p>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2">
                <StatusBadge value={detail.status} />
                <StatusBadge value={detail.paymentStatus} />
                {detail.paymentStatus === "REFUND_DUE" && <Badge variant="destructive">{t("Refund due: send the money back manually, then mark it refunded")}</Badge>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><b>{t("Customer")}:</b> {detail.customerName}</div>
                <div dir="ltr"><b>{t("Phone")}:</b> {detail.customerPhone}</div>
                <div><b>{t("Place")}:</b> {loc(detail.Place?.name, locale)}</div>
                <div><b>{t("Item")}:</b> {loc(detail.Item?.name, locale)}</div>
                <div><b>{t("Time")}:</b> {fmt(detail.Slot?.startAt)} - {fmt(detail.Slot?.endAt)}</div>
                <div><b>{t("Guests")}:</b> {detail.guestsCount ?? "-"}</div>
                <div><b>{t("Quantity")}:</b> {detail.quantity ?? 1}</div>
                <div><b>{t("Item price")}:</b> {detail.itemPrice}</div>
                <div><b>{t("Booking fee")}:</b> {detail.bookingFee}</div>
                <div><b>{t("Total")}:</b> {detail.totalAmount}</div>
                <div><b>{t("Created")}:</b> {fmt(detail.createdAt)}</div>
              </div>
              {detail.notes && <div><b>{t("Notes")}:</b> {detail.notes}</div>}
              {detail.rejectReason && <div><b>{t("Reject reason")}:</b> {detail.rejectReason}</div>}
              {detail.adminNote && <div><b>{t("Admin note")}:</b> {detail.adminNote}</div>}
              {detail.cancelReason && <div><b>{t("Cancel reason")}:</b> {detail.cancelReason}</div>}
              {detail.fieldValues && typeof detail.fieldValues === "object" && (
                <div>
                  <b>{t("Extra answers")}:</b>
                  <ul className="list-disc ps-5">
                    {Object.entries(detail.fieldValues).map(([k, v]) => (
                      <li key={k}>{k}: {String(v)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <b>{t("Payment receipt")}:</b>
                {detail.receiptImage ? (
                  <div className="mt-2 max-h-96 overflow-auto rounded border p-1">
                    <ImageCell cell={detail.receiptImage} />
                  </div>
                ) : (
                  <span> -</span>
                )}
              </div>
              {Array.isArray(detail.Logs) && detail.Logs.length > 0 && (
                <div>
                  <b>{t("Status log")}:</b>
                  <ul className="mt-1 space-y-1">
                    {detail.Logs.map((l: any) => (
                      <li key={l.id} className="text-xs text-muted-foreground">
                        {fmt(l.createdAt)}: {l.fromStatus ?? "-"} → {l.toStatus} {l.note ? `(${l.note})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-2 border-t pt-3">
                {actionsFor(detail).map(a => (
                  <Button key={a} variant={a === "reject" || a === "cancel" ? "destructive" : "default"} onClick={() => confirm(detail.id, a)}>
                    {t(`booking_action_${a}`)}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm an action */}
      <Dialog open={!!pending} onOpenChange={o => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending ? t(`booking_action_${pending.action}`) : ""}</DialogTitle>
          </DialogHeader>
          {pending && (pending.action === "approve" || pending.action === "reject" || pending.action === "cancel") && (
            <div className="space-y-1">
              <label className="text-sm">
                {pending.action === "approve" ? t("Admin note (optional)") : pending.action === "reject" ? t("Reject reason") : t("Cancel reason (optional)")}
              </label>
              <textarea rows={3} className="w-full rounded-md border bg-background p-2 text-sm" value={note} onChange={e => setNote(e.target.value)} />
            </div>
          )}
          {pending?.action === "approve" && <p className="text-xs text-muted-foreground">{t("Approve only after you verified the receipt and the money arrived.")}</p>}
          {pending?.action === "reject" && <p className="text-xs text-muted-foreground">{t("The slot is released and the refund is marked due (manual).")}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>{t("Cancel")}</Button>
            <Button onClick={submitAction} disabled={actionMutation.isPending}>{t("Confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
