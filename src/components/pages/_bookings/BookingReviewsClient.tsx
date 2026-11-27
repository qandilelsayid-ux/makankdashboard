"use client";

import { fetchHelper } from "@/api/fetch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { isOk, loc, rowsOf } from "./booking-utils";

// The API has no admin list of reviews, so reviews are read per place from the
// customer endpoint. Hide / show use /booking-reviews/:id/hide|show.
export default function BookingReviewsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [placeId, setPlaceId] = useState("");

  const places = useQuery({
    queryKey: ["bookingPlacesPick"],
    queryFn: () => fetchHelper({ endPoint: ["bookingPlaces"], params: { limit: 100 }, isLocalized: false })
  });
  const reviews = useQuery({
    queryKey: ["booking", "reviews", placeId],
    enabled: !!placeId,
    queryFn: () => fetchHelper({ endPoint: ["bookings", "places", Number(placeId), "reviews" as any], params: { limit: 50 }, isLocalized: false })
  });

  const toggle = useMutation({
    mutationFn: ({ id, action }: { id: number; action: "hide" | "show" }) =>
      fetchHelper({ endPoint: ["bookingReviews", id, action === "hide" ? ("bookingReviewHide" as any) : ("bookingReviewShow" as any)], method: "PATCH", isLocalized: false }),
    onSuccess: res => {
      if (isOk(res)) {
        toast.success(t("Saved successfully"));
        queryClient.invalidateQueries({ queryKey: ["booking", "reviews"] });
      } else toast.error((res as any)?.message || t("Something went wrong"));
    }
  });

  return (
    <Card>
      <CardHeader><CardTitle>{t("Booking Reviews")}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-sm space-y-1">
          <label className="text-xs text-muted-foreground">{t("Place")}</label>
          <Select value={placeId} onValueChange={setPlaceId}>
            <SelectTrigger><SelectValue placeholder="-" /></SelectTrigger>
            <SelectContent>
              {rowsOf(places.data).map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)}>{loc(p.name, locale)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!placeId ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("Choose a filter to see the list")}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow><TableHead>{t("Customer")}</TableHead><TableHead>{t("Rating")}</TableHead><TableHead>{t("Comment")}</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {rowsOf(reviews.data).length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("No data")}</TableCell></TableRow>}
              {rowsOf(reviews.data).map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.User?.name ?? r.userName ?? `#${r.userId}`}</TableCell>
                  <TableCell>{"★".repeat(r.rating ?? 0)}</TableCell>
                  <TableCell>{r.comment ?? "-"}</TableCell>
                  <TableCell className="space-x-1 text-end">
                    {r.isHidden ? (
                      <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: r.id, action: "show" })}>{t("Show")}</Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => toggle.mutate({ id: r.id, action: "hide" })}>{t("Hide")}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
