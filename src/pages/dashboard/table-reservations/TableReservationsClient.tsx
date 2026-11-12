"use client";

import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Search,
  Store,
  Phone,
  User,
  Users,
  UtensilsCrossed,
  XCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

interface ReservationItem {
  id: number;
  userId: number;
  storeId: number;
  orderId: number;
  customerName: string;
  customerPhone: string;
  guestsCount: number;
  reservationDate: string;
  reservationTime: string;
  notes: string | null;
  foodTotal: number;
  tableFee: number;
  totalPaid: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    phone: string;
    email?: string;
  };
  store?: {
    id: number;
    name: Record<string, string> | string;
    logo?: string;
  };
  order?: {
    id: number;
    paymentStatus: string;
    paymentMethod: string;
    paidWithWallet: boolean;
    note?: string;
    invoice?: any;
    OrderItems?: Array<{
      id: number;
      price: number;
      quantity: number;
      service?: {
        id: number;
        name: Record<string, string> | string;
      };
      OrderChoiceGroups?: Array<{
        id: number;
        title?: string;
        OrderChoices?: Array<{
          id: number;
          name?: string;
          price?: number;
        }>;
      }>;
    }>;
  };
}

export default function TableReservationsClient() {
  const t = useTranslations();
  const locale = useLocale();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedReservation, setSelectedReservation] = useState<ReservationItem | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    reservationId: number;
    nextStatus: ReservationStatus;
  } | null>(null);

  // Fetch reservations
  const { data: reservationsResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["tableReservationsAdmin", page, statusFilter, searchQuery],
    queryFn: () =>
      fetchHelper<{
        reservations: ReservationItem[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>({
        endPoint: ["tableReservations", "tableReservationsAdmin"],
        params: {
          page,
          limit: 15,
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: searchQuery.trim() || undefined
        }
      }),
    refetchInterval: 15_000
  });

  // Fetch pending count badge
  const { data: pendingCountResponse } = useQuery({
    queryKey: ["tableReservationsPendingCount"],
    queryFn: () =>
      fetchHelper<{ pendingCount: number }>({
        endPoint: ["tableReservations", "tableReservationsPendingCount"]
      }),
    refetchInterval: 15_000
  });

  const reservations = reservationsResponse?.data?.reservations || [];
  const total = reservationsResponse?.data?.total || 0;
  const totalPages = reservationsResponse?.data?.totalPages || 1;
  const pendingCount = pendingCountResponse?.data?.pendingCount ?? 0;

  // Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: ReservationStatus }) => {
      const res = await fetchHelper({
        endPoint: ["tableReservations", "tableReservationsAdmin", id, "status"],
        method: "PATCH",
        body: { status }
      });
      return res;
    },
    onSuccess: (res, vars) => {
      toast.success(
        vars.status === "CONFIRMED"
          ? "تم تأكيد الحجز بنجاح"
          : vars.status === "COMPLETED"
          ? "تم اكتمال حضور الحجز بنجاح"
          : "تم إلغاء الحجز وإعادة المبلغ للعميل إن كان مدفوعاً بالمحفظة"
      );
      setConfirmStatusModal(null);
      setIsDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tableReservationsAdmin"] });
      queryClient.invalidateQueries({ queryKey: ["tableReservationsPendingCount"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "حدث خطأ أثناء تحديث حالة الحجز");
    }
  });

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-300 dark:border-amber-600">
            قيد الانتظار ⏳
          </Badge>
        );
      case "CONFIRMED":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 border-blue-300 dark:border-blue-600">
            مؤكد ✅
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-300 dark:border-emerald-600">
            مكتمل الحضور 🎉
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-rose-300 dark:border-rose-600">
            ملغي ❌
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLocalizedName = (name: Record<string, string> | string | undefined) => {
    if (!name) return "";
    if (typeof name === "string") return name;
    return name[locale] || name.ar || name.en || Object.values(name)[0] || "";
  };

  return (
    <div className="space-y-6">
      {/* Top statistics summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              حجوزات قيد الانتظار
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${pendingCount > 0 ? "text-amber-500 animate-pulse" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <span className={pendingCount > 0 ? "text-amber-600" : ""}>{pendingCount}</span>
              {pendingCount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500 text-white animate-bounce">
                  جديد
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">تتطلب مراجعة وتأكيد الأدمن</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الحجوزات
            </CardTitle>
            <UtensilsCrossed className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">جميع الحجوزات المسجلة</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              طريقة الاستلام والدفع
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-emerald-600">دفع إلكتروني مسبق</div>
            <p className="text-xs text-muted-foreground mt-1">توصيل = 0 ج.م (تناول داخل المطعم)</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              توجيه الحجوزات
            </CardTitle>
            <Store className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-blue-600">لوحة تحكم الأدمن حصراً</div>
            <p className="text-xs text-muted-foreground mt-1">لا ترسل لأبلكيشن المطعم أو المندوب</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and search bar */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم العميل أو رقم الهاتف..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pr-9"
              />
            </div>
            <div className="w-full sm:w-[200px]">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الحالات</SelectItem>
                  <SelectItem value="PENDING">قيد الانتظار (PENDING)</SelectItem>
                  <SelectItem value="CONFIRMED">مؤكد (CONFIRMED)</SelectItem>
                  <SelectItem value="COMPLETED">مكتمل (COMPLETED)</SelectItem>
                  <SelectItem value="CANCELLED">ملغي (CANCELLED)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            تحديث
          </Button>
        </CardContent>
      </Card>

      {/* Reservations Table */}
      <Card className="border-border/60 shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead>العميل</TableHead>
                <TableHead>المطعم</TableHead>
                <TableHead>الموعد والضيوف</TableHead>
                <TableHead>الماليات (ج.م)</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="text-end">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      جاري تحميل الحجوزات...
                    </div>
                  </TableCell>
                </TableRow>
              ) : reservations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    لا توجد حجوزات طاولات مطابقة للبحث أو الفلتر
                  </TableCell>
                </TableRow>
              ) : (
                reservations.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="font-semibold text-xs text-muted-foreground">
                      #{item.id}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          {item.customerName}
                        </span>
                        <span className="text-xs text-muted-foreground dir-ltr text-right">
                          {item.customerPhone}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {getLocalizedName(item.store?.name) || `مطعم #${item.storeId}`}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-0.5 text-xs">
                        <span className="flex items-center gap-1 text-foreground">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          {item.reservationDate}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          {item.reservationTime}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          {item.guestsCount} {item.guestsCount === 1 ? "شخص" : "أشخاص"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="font-bold text-sm text-primary">
                          {Number(item.totalPaid || 0).toFixed(2)} ج.م
                        </span>
                        <span className="text-muted-foreground">
                          أكل: {Number(item.foodTotal || 0).toFixed(2)}
                          {Number(item.tableFee || 0) > 0 ? ` + طاولة: ${Number(item.tableFee).toFixed(2)}` : ""}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-medium">مدفوع إلكترونياً</span>
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(item.status)}</TableCell>

                    <TableCell className="text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedReservation(item);
                            setIsDetailsOpen(true);
                          }}
                          className="h-8 px-2 text-xs flex items-center gap-1"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          التفاصيل
                        </Button>

                        {item.status === "PENDING" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() =>
                                setConfirmStatusModal({
                                  reservationId: item.id,
                                  nextStatus: "CONFIRMED"
                                })
                              }
                            >
                              تأكيد
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 text-xs"
                              onClick={() =>
                                setConfirmStatusModal({
                                  reservationId: item.id,
                                  nextStatus: "CANCELLED"
                                })
                              }
                            >
                              إلغاء
                            </Button>
                          </>
                        )}

                        {item.status === "CONFIRMED" && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() =>
                                setConfirmStatusModal({
                                  reservationId: item.id,
                                  nextStatus: "COMPLETED"
                                })
                              }
                            >
                              اكتمال الحضور
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() =>
                                setConfirmStatusModal({
                                  reservationId: item.id,
                                  nextStatus: "CANCELLED"
                                })
                              }
                            >
                              إلغاء
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>
                إجمالي {total} حجز (صفحة {page} من {totalPages})
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  التالي
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedReservation && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-4">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <span>🍽️ تفاصيل حجز طاولة #{selectedReservation.id}</span>
                  {getStatusBadge(selectedReservation.status)}
                </DialogTitle>
              </div>
              <DialogDescription>
                تاريخ الإنشاء: {new Date(selectedReservation.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Customer & Store Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg text-sm">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold">بيانات العميل</div>
                  <div className="font-medium flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary" />
                    {selectedReservation.customerName}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 dir-ltr justify-end">
                    <span>{selectedReservation.customerPhone}</span>
                    <Phone className="h-3 w-3" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold">المطعم</div>
                  <div className="font-medium flex items-center gap-1.5">
                    <Store className="h-4 w-4 text-primary" />
                    {getLocalizedName(selectedReservation.store?.name) || `مطعم #${selectedReservation.storeId}`}
                  </div>
                  <div className="text-xs text-muted-foreground">طلب أكل مسبق وتناول داخل الصالة</div>
                </div>
              </div>

              {/* Reservation Timing */}
              <div className="grid grid-cols-3 gap-2 p-3 border rounded-lg text-center text-sm">
                <div>
                  <div className="text-xs text-muted-foreground">تاريخ الحضور</div>
                  <div className="font-semibold text-primary mt-0.5">{selectedReservation.reservationDate}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">ساعة الحضور</div>
                  <div className="font-semibold text-primary mt-0.5">{selectedReservation.reservationTime}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">عدد الأشخاص</div>
                  <div className="font-semibold text-primary mt-0.5">
                    {selectedReservation.guestsCount} {selectedReservation.guestsCount === 1 ? "شخص" : "أشخاص"}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg text-sm">
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">ملاحظات العميل:</div>
                  <p className="mt-1 text-amber-900 dark:text-amber-200">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Pre-ordered Food Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <UtensilsCrossed className="h-4 w-4 text-primary" />
                  أصناف الطعام المحجوزة مسبقاً (Order #{selectedReservation.orderId})
                </h4>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="text-xs">الصنف</TableHead>
                        <TableHead className="text-xs text-center">الكمية</TableHead>
                        <TableHead className="text-xs text-center">سعر الوحدة</TableHead>
                        <TableHead className="text-xs text-end">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedReservation.order?.OrderItems?.map((item) => (
                        <TableRow key={item.id} className="text-xs">
                          <TableCell>
                            <div className="font-medium">
                              {getLocalizedName(item.service?.name) || `صنف #${item.id}`}
                            </div>
                            {item.OrderChoiceGroups?.map((group) => (
                              <div key={group.id} className="text-[11px] text-muted-foreground">
                                <span className="font-medium">{group.title}: </span>
                                {group.OrderChoices?.map((c) => c.name).join(", ")}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell className="text-center font-bold">x{item.quantity}</TableCell>
                          <TableCell className="text-center">{Number(item.price).toFixed(2)} ج.م</TableCell>
                          <TableCell className="text-end font-semibold">
                            {(Number(item.price) * item.quantity).toFixed(2)} ج.م
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3 border rounded-lg bg-muted/20 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي الطعام:</span>
                  <span className="font-medium">{Number(selectedReservation.foodTotal).toFixed(2)} ج.م</span>
                </div>
                {Number(selectedReservation.tableFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رسوم حجز الطاولة:</span>
                    <span className="font-medium">{Number(selectedReservation.tableFee).toFixed(2)} ج.م</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رسوم التوصيل:</span>
                  <span className="font-medium text-emerald-600">0.00 ج.م (تناول بالصالة)</span>
                </div>
                <div className="flex justify-between border-t pt-1.5 text-sm font-bold">
                  <span>المبلغ الإجمالي المدفوع:</span>
                  <span className="text-primary">{Number(selectedReservation.totalPaid).toFixed(2)} ج.م</span>
                </div>
                <div className="text-[11px] text-emerald-600 font-medium pt-0.5">
                  حالة الدفع: مدفوع إلكترونياً (
                  {selectedReservation.order?.paidWithWallet ? "بالمحفظة الإلكترونية" : "دفع أونلاين"}
                  )
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-between items-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsDetailsOpen(false)}>
                إغلاق
              </Button>

              <div className="flex gap-2">
                {selectedReservation.status === "PENDING" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() =>
                        setConfirmStatusModal({
                          reservationId: selectedReservation.id,
                          nextStatus: "CONFIRMED"
                        })
                      }
                    >
                      تأكيد الحجز
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setConfirmStatusModal({
                          reservationId: selectedReservation.id,
                          nextStatus: "CANCELLED"
                        })
                      }
                    >
                      إلغاء الحجز
                    </Button>
                  </>
                )}

                {selectedReservation.status === "CONFIRMED" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() =>
                        setConfirmStatusModal({
                          reservationId: selectedReservation.id,
                          nextStatus: "COMPLETED"
                        })
                      }
                    >
                      اكتمال الحضور
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        setConfirmStatusModal({
                          reservationId: selectedReservation.id,
                          nextStatus: "CANCELLED"
                        })
                      }
                    >
                      إلغاء الحجز
                    </Button>
                  </>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmation Modal for Status Change */}
      {confirmStatusModal && (
        <Dialog open={!!confirmStatusModal} onOpenChange={() => setConfirmStatusModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg">
                {confirmStatusModal.nextStatus === "CONFIRMED"
                  ? "تأكيد حجز الطاولة"
                  : confirmStatusModal.nextStatus === "COMPLETED"
                  ? "تأكيد اكتمال الحضور"
                  : "إلغاء حجز الطاولة"}
              </DialogTitle>
              <DialogDescription>
                {confirmStatusModal.nextStatus === "CONFIRMED"
                  ? "هل أنت متأكد من رغبتك في تأكيد هذا الحجز؟ سيتم إخطار العميل بأن الطاولة جاهزة له في الوقت المحدد."
                  : confirmStatusModal.nextStatus === "COMPLETED"
                  ? "هل حضر العميل بالفعل وتم تناول الطعام بنجاح؟"
                  : "تحذير: سيتم إلغاء الحجز والطلب المرتبط به، وإذا كان العميل قد دفع عبر المحفظة فسيتم استرداد المبلغ بالكامل إلى محفظته آلياً."}
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex justify-end gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmStatusModal(null)}
                disabled={updateStatusMutation.isPending}
              >
                تراجع
              </Button>
              <Button
                size="sm"
                variant={confirmStatusModal.nextStatus === "CANCELLED" ? "destructive" : "default"}
                className={confirmStatusModal.nextStatus === "CONFIRMED" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                disabled={updateStatusMutation.isPending}
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: confirmStatusModal.reservationId,
                    status: confirmStatusModal.nextStatus
                  })
                }
              >
                {updateStatusMutation.isPending ? "جاري الحفظ..." : "تأكيد الإجراء"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
