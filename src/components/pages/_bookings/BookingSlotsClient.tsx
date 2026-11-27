"use client";

import { fetchHelper } from "@/api/fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { isOk, loc, paginationOf, rowsOf } from "./booking-utils";

const DAYS = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
const SLOT_COLORS: Record<string, string> = {
  AVAILABLE: "bg-emerald-100 text-emerald-800",
  HELD: "bg-amber-100 text-amber-800",
  BOOKED: "bg-sky-100 text-sky-800",
  CLOSED: "bg-slate-200 text-slate-700"
};

// Cairo wall-clock date + "HH:mm" -> ISO instant (DST-safe, Egypt observes DST).
function cairoToIso(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm, 0);
  const offsetOf = (ms: number) => {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: "Africa/Cairo", timeZoneName: "shortOffset" })
      .formatToParts(new Date(ms))
      .find(p => p.type === "timeZoneName")?.value; // e.g. "GMT+3"
    const h = Number(/GMT([+-]\d+)/.exec(part ?? "")?.[1] ?? 2);
    return h * 3600_000;
  };
  let instant = wall - offsetOf(wall - 3 * 3600_000);
  instant = wall - offsetOf(instant);
  return new Date(instant).toISOString();
}

const cairoTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Cairo", dateStyle: "medium", timeStyle: "short" });

function PickPlaceItem({ placeId, itemId, setPlace, setItem }: { placeId: string; itemId: string; setPlace: (v: string) => void; setItem: (v: string) => void }) {
  const t = useTranslations();
  const locale = useLocale();
  const places = useQuery({
    queryKey: ["bookingPlacesPick"],
    queryFn: () => fetchHelper({ endPoint: ["bookingPlaces"], params: { limit: 100 }, isLocalized: false })
  });
  const items = useQuery({
    queryKey: ["bookingItemsPick", placeId],
    enabled: !!placeId,
    queryFn: () => fetchHelper({ endPoint: ["bookingItems"], params: { limit: 100, placeId }, isLocalized: false })
  });
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{t("Place")}</label>
        <Select value={placeId} onValueChange={v => { setPlace(v); setItem(""); }}>
          <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
          <SelectContent>
            {rowsOf(places.data).map((p: any) => (
              <SelectItem key={p.id} value={String(p.id)}>{loc(p.name, locale)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{t("Item")}</label>
        <Select value={itemId} onValueChange={setItem} disabled={!placeId}>
          <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
          <SelectContent>
            {rowsOf(items.data).map((i: any) => (
              <SelectItem key={i.id} value={String(i.id)}>{loc(i.name, locale)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default function BookingSlotsClient() {
  const t = useTranslations();
  const queryClient = useQueryClient();
  const [placeId, setPlaceId] = useState("");
  const [itemId, setItemId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  // add slot form
  const [date, setDate] = useState("");
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("19:00");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("1");
  // template form
  const [day, setDay] = useState("SATURDAY");
  const [tStart, setTStart] = useState("18:00");
  const [tEnd, setTEnd] = useState("19:00");
  const [tCapacity, setTCapacity] = useState("1");
  const [genFrom, setGenFrom] = useState("");
  const [genTo, setGenTo] = useState("");

  const slotsQuery = useQuery({
    queryKey: ["booking", "bookingSlots", itemId, from, to, page],
    enabled: !!itemId,
    queryFn: () =>
      fetchHelper({
        endPoint: ["bookingSlots"],
        isLocalized: false,
        params: { itemId, from: from || undefined, to: to || undefined, page, limit: 30 }
      })
  });
  const templatesQuery = useQuery({
    queryKey: ["booking", "bookingSlotTemplates", itemId],
    enabled: !!itemId,
    queryFn: () => fetchHelper({ endPoint: ["bookingSlotTemplates"], isLocalized: false, params: { itemId } })
  });
  const slots = rowsOf(slotsQuery.data);
  const pg = paginationOf(slotsQuery.data);
  const templates = rowsOf(templatesQuery.data);

  const run = useMutation({
    mutationFn: (req: { endPoint: any[]; method?: "POST" | "PATCH" | "DELETE"; body?: unknown }) =>
      fetchHelper({ ...req, isLocalized: false }),
    onSuccess: res => {
      if (isOk(res)) {
        toast.success(t("Saved successfully"));
        queryClient.invalidateQueries({ queryKey: ["booking"] });
      } else toast.error((res as any)?.message || t("Something went wrong"));
    }
  });

  const addSlot = () => {
    if (!itemId || !date || !start || !end) return toast.error(t("Required"));
    const cap = Math.floor(Number(capacity) || 1);
    if (cap < 1) return toast.error(t("Required"));
    const startAt = cairoToIso(date, start);
    // An end earlier than the start means it finishes after midnight.
    const endDate = end <= start ? new Date(new Date(`${date}T12:00:00Z`).getTime() + 86400_000).toISOString().slice(0, 10) : date;
    run.mutate({
      endPoint: ["bookingSlots"],
      method: "POST",
      body: { itemId: Number(itemId), slots: [{ startAt, endAt: cairoToIso(endDate, end), capacity: cap, ...(price ? { price: Number(price) } : {}) }] }
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>{t("Booking Slots")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <PickPlaceItem placeId={placeId} itemId={itemId} setPlace={setPlaceId} setItem={v => { setItemId(v); setPage(1); }} />
          {!itemId && <p className="py-6 text-center text-sm text-muted-foreground">{t("Choose a filter to see the list")}</p>}
        </CardContent>
      </Card>

      {itemId && (
        <>
          <Card>
            <CardHeader><CardTitle>{t("Add a slot")}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 items-end gap-3 md:grid-cols-6">
              <div><label className="text-xs">{t("Date")}</label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div><label className="text-xs">{t("Start")}</label><Input type="time" value={start} onChange={e => setStart(e.target.value)} /></div>
              <div><label className="text-xs">{t("End")}</label><Input type="time" value={end} onChange={e => setEnd(e.target.value)} /></div>
              <div><label className="text-xs">{t("Price override (optional)")}</label><Input type="number" value={price} onChange={e => setPrice(e.target.value)} /></div>
              <div><label className="text-xs">{t("Capacity")}</label><Input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} /></div>
              <Button onClick={addSlot} disabled={run.isPending}>{t("Add")}</Button>
              <p className="col-span-full text-xs text-muted-foreground">{t("Times are Cairo time.")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("Weekly templates")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-5">
                <div>
                  <label className="text-xs">{t("Day")}</label>
                  <Select value={day} onValueChange={setDay}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{DAYS.map(d => <SelectItem key={d} value={d}>{t(d)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><label className="text-xs">{t("Start")}</label><Input type="time" value={tStart} onChange={e => setTStart(e.target.value)} /></div>
                <div><label className="text-xs">{t("End")}</label><Input type="time" value={tEnd} onChange={e => setTEnd(e.target.value)} /></div>
                <div><label className="text-xs">{t("Capacity")}</label><Input type="number" min={1} value={tCapacity} onChange={e => setTCapacity(e.target.value)} /></div>
                <Button onClick={() => run.mutate({ endPoint: ["bookingSlotTemplates"], method: "POST", body: { itemId: Number(itemId), day, startTime: tStart, endTime: tEnd, capacity: Math.max(1, Math.floor(Number(tCapacity) || 1)) } })}>
                  {t("Add template")}
                </Button>
              </div>
              <Table>
                <TableHeader><TableRow><TableHead>{t("Day")}</TableHead><TableHead>{t("Start")}</TableHead><TableHead>{t("End")}</TableHead><TableHead>{t("Capacity")}</TableHead><TableHead /></TableRow></TableHeader>
                <TableBody>
                  {templates.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("No data")}</TableCell></TableRow>}
                  {templates.map((tp: any) => (
                    <TableRow key={tp.id}>
                      <TableCell>{t(tp.day)}</TableCell>
                      <TableCell>{tp.startTime}</TableCell>
                      <TableCell>{tp.endTime}</TableCell>
                      <TableCell>{tp.capacity ?? 1}</TableCell>
                      <TableCell className="text-end">
                        <Button size="icon" variant="ghost" onClick={() => window.confirm(t("Are you sure?")) && run.mutate({ endPoint: ["bookingSlotTemplates", tp.id], method: "DELETE" })}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-4">
                <div><label className="text-xs">{t("From date")}</label><Input type="date" value={genFrom} onChange={e => setGenFrom(e.target.value)} /></div>
                <div><label className="text-xs">{t("To date")}</label><Input type="date" value={genTo} onChange={e => setGenTo(e.target.value)} /></div>
                <Button
                  variant="outline"
                  disabled={!genFrom || !genTo}
                  onClick={() => run.mutate({ endPoint: ["bookingSlotTemplates", "bookingSlotTemplatesGenerate" as any], method: "POST", body: { itemId: Number(itemId), fromDate: genFrom, toDate: genTo } })}
                >
                  {t("Generate slots for date range")}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("Slots")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div><label className="text-xs">{t("From date")}</label><Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} /></div>
                <div><label className="text-xs">{t("To date")}</label><Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} /></div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Start")}</TableHead><TableHead>{t("End")}</TableHead><TableHead>{t("Price override (optional)")}</TableHead><TableHead>{t("Booked")} / {t("Capacity")}</TableHead><TableHead>{t("Remaining")}</TableHead><TableHead>{t("Status")}</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slots.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t("No data")}</TableCell></TableRow>}
                  {slots.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell>{cairoTime(s.startAt)}</TableCell>
                      <TableCell>{cairoTime(s.endAt)}</TableCell>
                      <TableCell>{s.price ?? "-"}</TableCell>
                      <TableCell>{s.bookedCount ?? 0} / {s.capacity ?? 1}</TableCell>
                      <TableCell>{s.remaining ?? Math.max((s.capacity ?? 1) - (s.bookedCount ?? 0), 0)}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SLOT_COLORS[s.status] ?? ""}`}>{t(s.status)}</span></TableCell>
                      <TableCell className="space-x-1 text-end">
                        {s.status !== "CLOSED" && (
                          <Button size="sm" variant="outline" onClick={() => {
                            const v = window.prompt(t("Capacity"), String(s.capacity ?? 1));
                            const n = Math.floor(Number(v));
                            if (v !== null && n >= 1) run.mutate({ endPoint: ["bookingSlots", s.id], method: "PATCH", body: { capacity: n } });
                          }}>{t("Capacity")}</Button>
                        )}
                        {s.status === "AVAILABLE" && (s.bookedCount ?? 0) === 0 && (
                          <Button size="sm" variant="outline" onClick={() => run.mutate({ endPoint: ["bookingSlots", s.id, "bookingSlotClose" as any], method: "PATCH" })}>{t("Close")}</Button>
                        )}
                        {s.status === "CLOSED" && (
                          <Button size="sm" variant="outline" onClick={() => run.mutate({ endPoint: ["bookingSlots", s.id, "bookingSlotOpen" as any], method: "PATCH" })}>{t("Open")}</Button>
                        )}
                        {s.status === "AVAILABLE" && (s.bookedCount ?? 0) === 0 && (
                          <Button size="icon" variant="ghost" onClick={() => window.confirm(t("Are you sure?")) && run.mutate({ endPoint: ["bookingSlots", s.id], method: "DELETE" })}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
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
          </Card>
        </>
      )}
    </div>
  );
}
