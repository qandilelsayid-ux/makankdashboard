import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  RefreshCw,
  Search,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Driver,
  formatCityLabel,
  ShippingOrder,
  ShippingOrderStatus,
  shippingTypeLabel,
  statusMap,
} from "./types";

interface OrdersTabProps {
  effectiveCityId: number | null;
}

export function OrdersTab({ effectiveCityId }: OrdersTabProps) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [shippingTypeFilter, setShippingTypeFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page] = useState<number>(1);

  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [driverSearch, setDriverSearch] = useState("");

  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: [
      "governorateShippingOrders",
      page,
      statusFilter,
      shippingTypeFilter,
      searchQuery,
      effectiveCityId,
    ],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: "20",
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (shippingTypeFilter !== "ALL") params.shippingType = shippingTypeFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (effectiveCityId) params.cityId = String(effectiveCityId);

      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOrders"],
        method: "GET",
        params,
      });
    },
  });

  const ordersList: ShippingOrder[] = useMemo(
    () => (Array.isArray(ordersResponse?.data) ? ordersResponse.data : []),
    [ordersResponse],
  );

  const { data: driversResponse } = useQuery({
    queryKey: ["governorateShippingDrivers"],
    queryFn: async () =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingDrivers"],
        method: "GET",
      }),
    enabled: isAssignDriverOpen,
  });

  const driversList: Driver[] = useMemo(
    () => (Array.isArray(driversResponse?.data) ? driversResponse.data : []),
    [driversResponse],
  );

  const filteredDrivers = useMemo(() => {
    if (!driverSearch.trim()) return driversList;
    const q = driverSearch.toLowerCase();
    return driversList.filter(
      (d) => d.name.toLowerCase().includes(q) || (d.phone && d.phone.includes(q)),
    );
  }, [driversList, driverSearch]);

  const assignDriverMutation = useMutation({
    mutationFn: async ({
      orderId,
      driverId,
    }: {
      orderId: number;
      driverId: number;
    }) =>
      fetchHelper({
        endPoint: [
          "governorateShipping",
          "govShippingAdmin",
          "govShippingOrders",
          orderId,
          "govShippingAssignDriver",
        ],
        method: "PATCH",
        body: { driverId },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل تعيين المندوب");
        return;
      }
      toast.success("تم تعيين المندوب بنجاح للشحنة");
      setIsAssignDriverOpen(false);
      setAssigningOrderId(null);
      queryClient.invalidateQueries({ queryKey: ["governorateShippingOrders"] });
    },
    onError: (err: any) => toast.error(err?.message || "فشل تعيين المندوب"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: number;
      status: ShippingOrderStatus;
      cancellationReason?: string;
    }) =>
      fetchHelper({
        endPoint: [
          "governorateShipping",
          "govShippingAdmin",
          "govShippingOrders",
          orderId,
          "govShippingStatus",
        ],
        method: "PATCH",
        body: { status, cancellationReason },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل تحديث الحالة");
        return;
      }
      toast.success("تم تحديث حالة الشحنة بنجاح");
      setIsDetailsOpen(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["governorateShippingOrders"] });
    },
    onError: (err: any) => toast.error(err?.message || "فشل تحديث الحالة"),
  });

  return (
    <div className="space-y-6">
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-wrap w-full gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
              <Input
                placeholder="ابحث برقم الشحنة، اسم الراسل/المستلم، المركز أو القرية..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>

            <Select value={shippingTypeFilter} onValueChange={setShippingTypeFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="نوع الشحن" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل (محافظات + قرى)</SelectItem>
                <SelectItem value="GOVERNORATE">شحن محافظات</SelectItem>
                <SelectItem value="VILLAGE">شحن قرى</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="تصفية بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع الحالات</SelectItem>
                <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                <SelectItem value="ASSIGNED">تم تعيين مندوب</SelectItem>
                <SelectItem value="PICKED_UP">تم الاستلام</SelectItem>
                <SelectItem value="IN_TRANSIT">جاري التوصيل</SelectItem>
                <SelectItem value="DELIVERED">تم التسليم</SelectItem>
                <SelectItem value="CANCELLED">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchOrders()}
            disabled={isOrdersLoading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isOrdersLoading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>قائمة طلبات الشحن (محافظات وقرى)</span>
            <span className="text-xs text-muted-foreground font-normal">
              إجمالي: {ordersList.length} شحنة
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isOrdersLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              جاري تحميل الشحنات...
            </div>
          ) : ordersList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-semibold">لا توجد طلبات شحن مطابقة حالياً</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الشحنة والنوع</TableHead>
                    <TableHead>من (الاستلام)</TableHead>
                    <TableHead>إلى (التسليم)</TableHead>
                    <TableHead>الحمولة والوزن</TableHead>
                    <TableHead>التكلفة والدفع</TableHead>
                    <TableHead>المندوب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersList.map((order) => {
                    const statusConfig = statusMap[order.status] || {
                      label: order.status,
                      color: "bg-gray-100 text-gray-800",
                      icon: Clock,
                    };
                    const StatusIcon = statusConfig.icon;
                    const isVillage = order.shippingType === "VILLAGE";

                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-mono font-bold text-xs">{order.orderNumber}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge
                              variant="outline"
                              className={
                                isVillage
                                  ? "text-[10px] bg-orange-50 text-orange-700 border-orange-200"
                                  : "text-[10px] bg-sky-50 text-sky-700 border-sky-200"
                              }
                            >
                              {shippingTypeLabel(order.shippingType)}
                            </Badge>
                            {order.City && (
                              <Badge variant="outline" className="text-[10px]">
                                {formatCityLabel(order.City)}
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-sm">{order.senderName}</div>
                          <div className="text-xs text-muted-foreground">{order.senderPhone}</div>
                          <div className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>
                              {order.pickupGovernorate}
                              {order.pickupCenter ? ` - ${order.pickupCenter}` : ""}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-sm">{order.receiverName}</div>
                          <div className="text-xs text-muted-foreground">{order.receiverPhone}</div>
                          <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span>
                              {order.deliveryGovernorate}
                              {order.deliveryCenter ? ` - ${order.deliveryCenter}` : ""}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-[210px]">
                          <p className="truncate font-medium text-xs">{order.packageDescription}</p>
                          {(order.shippingOptionName || order.packageSize) && (
                            <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                              الحمولة: {order.shippingOptionName || order.packageSize}
                            </div>
                          )}
                          {order.packageWeightKg && (
                            <span className="text-[11px] text-gray-500">
                              الوزن: {order.packageWeightKg} كجم
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="font-bold text-sm text-primary">
                            {order.deliveryPrice} ج.م
                          </div>
                          {Number(order.optionExtraPrice) > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              مسار {order.routePrice ?? order.deliveryPrice} + حمولة{" "}
                              {order.optionExtraPrice}
                            </div>
                          )}
                          <span className="text-[11px] text-muted-foreground block">
                            {order.paymentType === "CASH_ON_PICKUP"
                              ? "كاش عند الاستلام"
                              : "كاش عند التسليم"}
                          </span>
                        </TableCell>

                        <TableCell>
                          {order.DeliveryBoy ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {order.DeliveryBoy.name.slice(0, 1)}
                              </div>
                              <div>
                                <div className="font-medium text-xs">{order.DeliveryBoy.name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {order.DeliveryBoy.phone}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs border-dashed gap-1 text-primary border-primary/40 hover:bg-primary/10"
                              onClick={() => {
                                setAssigningOrderId(order.id);
                                setIsAssignDriverOpen(true);
                              }}
                            >
                              <User className="w-3.5 h-3.5" />
                              <span>تعيين مندوب</span>
                            </Button>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-[11px] gap-1 px-2 py-0.5 font-bold ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            <span>{statusConfig.label}</span>
                          </Badge>
                        </TableCell>

                        <TableCell className="text-left">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ORDER DETAILS MODAL */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 text-lg">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span>تفاصيل الشحنة #{selectedOrder.orderNumber}</span>
                    <Badge variant="outline" className="text-xs">
                      {shippingTypeLabel(selectedOrder.shippingType)}
                    </Badge>
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusMap[selectedOrder.status]?.color || ""}`}
                  >
                    {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  تاريخ الإنشاء: {new Date(selectedOrder.createdAt).toLocaleString("ar-EG")}
                  {selectedOrder.City ? ` • المدينة: ${formatCityLabel(selectedOrder.City)}` : ""}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50 space-y-1.5">
                    <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>
                        بيانات الراسل (
                        {selectedOrder.shippingType === "VILLAGE" ? "قرية الاستلام" : "نقطة الاستلام"}
                        )
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{selectedOrder.senderName}</div>
                    <div className="text-xs text-muted-foreground">{selectedOrder.senderPhone}</div>
                    <div className="text-xs font-medium">
                      {selectedOrder.shippingType === "VILLAGE" ? "القرية:" : "المحافظة:"}{" "}
                      {selectedOrder.pickupGovernorate}
                      {selectedOrder.pickupCenter ? ` — مركز: ${selectedOrder.pickupCenter}` : ""}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      العنوان: {selectedOrder.pickupAddress}
                    </div>
                    {selectedOrder.pickupLat && selectedOrder.pickupLng && (
                      <a
                        href={`https://maps.google.com/?q=${selectedOrder.pickupLat},${selectedOrder.pickupLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>عرض على الخريطة</span>
                      </a>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border bg-gray-50/50 dark:bg-gray-900/50 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>
                        بيانات المستلم (
                        {selectedOrder.shippingType === "VILLAGE" ? "قرية التسليم" : "نقطة التسليم"}
                        )
                      </span>
                    </div>
                    <div className="text-sm font-semibold">{selectedOrder.receiverName}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedOrder.receiverPhone}
                    </div>
                    <div className="text-xs font-medium">
                      {selectedOrder.shippingType === "VILLAGE" ? "القرية:" : "المحافظة:"}{" "}
                      {selectedOrder.deliveryGovernorate}
                      {selectedOrder.deliveryCenter
                        ? ` — مركز: ${selectedOrder.deliveryCenter}`
                        : ""}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      العنوان: {selectedOrder.deliveryAddress}
                    </div>
                    {selectedOrder.deliveryLat && selectedOrder.deliveryLng && (
                      <a
                        href={`https://maps.google.com/?q=${selectedOrder.deliveryLat},${selectedOrder.deliveryLng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>عرض على الخريطة</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-lg border space-y-2">
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary" />
                    <span>تفاصيل الشحنة والحمولة والوزن</span>
                  </div>
                  <p className="text-sm font-medium">{selectedOrder.packageDescription}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {(selectedOrder.shippingOptionName || selectedOrder.packageSize) && (
                      <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-800 font-semibold">
                        أوبشن الشحن: {selectedOrder.shippingOptionName || selectedOrder.packageSize}
                      </span>
                    )}
                    {selectedOrder.cargoType && (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        الحمولة: {selectedOrder.cargoType}
                      </span>
                    )}
                    {selectedOrder.packageCategory && (
                      <span>التصنيف: {selectedOrder.packageCategory}</span>
                    )}
                    {selectedOrder.packageWeightKg && (
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        الوزن: {selectedOrder.packageWeightKg} كجم
                      </span>
                    )}
                  </div>
                  {selectedOrder.notes && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded text-amber-800 dark:text-amber-300">
                      ملاحظات للمندوب: {selectedOrder.notes}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border">
                    <div className="text-xs text-muted-foreground">السعر وطريقة التحصيل</div>
                    <div className="text-lg font-bold text-primary mt-1">
                      {selectedOrder.deliveryPrice} ج.م
                    </div>
                    {Number(selectedOrder.optionExtraPrice) > 0 && (
                      <div className="text-xs text-muted-foreground">
                        (أساسي {selectedOrder.routePrice} + إضافة حمولة{" "}
                        {selectedOrder.optionExtraPrice})
                      </div>
                    )}
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedOrder.paymentType === "CASH_ON_PICKUP"
                        ? "كاش عند الاستلام (من الراسل)"
                        : "كاش عند التسليم (من المستلم)"}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">المندوب المعين</div>
                      <div className="font-bold text-sm mt-1">
                        {selectedOrder.DeliveryBoy
                          ? selectedOrder.DeliveryBoy.name
                          : "لم يتم التعيين بعد"}
                      </div>
                      {selectedOrder.DeliveryBoy && (
                        <div className="text-xs text-muted-foreground">
                          {selectedOrder.DeliveryBoy.phone}
                        </div>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setAssigningOrderId(selectedOrder.id);
                        setIsAssignDriverOpen(true);
                      }}
                    >
                      {selectedOrder.DeliveryBoy ? "تغيير" : "تعيين مندوب"}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="text-xs font-bold mb-2">تحديث حالة الشحنة:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedOrder.status !== "PICKED_UP" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: "PICKED_UP",
                          })
                        }
                      >
                        تأكيد الاستلام
                      </Button>
                    )}
                    {selectedOrder.status !== "IN_TRANSIT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: "IN_TRANSIT",
                          })
                        }
                      >
                        جاري التوصيل
                      </Button>
                    )}
                    {selectedOrder.status !== "DELIVERED" && (
                      <Button
                        size="sm"
                        className="text-xs bg-emerald-600 hover:bg-emerald-700"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            orderId: selectedOrder.id,
                            status: "DELIVERED",
                          })
                        }
                      >
                        تأكيد التسليم
                      </Button>
                    )}
                    {selectedOrder.status !== "CANCELLED" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="text-xs"
                        onClick={() => {
                          const reason = prompt("يرجى كتابة سبب الإلغاء:");
                          if (reason !== null) {
                            updateStatusMutation.mutate({
                              orderId: selectedOrder.id,
                              status: "CANCELLED",
                              cancellationReason: reason,
                            });
                          }
                        }}
                      >
                        إلغاء الشحنة
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ASSIGN DRIVER MODAL */}
      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>تعيين مندوب للشحنة</span>
            </DialogTitle>
            <DialogDescription>اختر المندوب لتوصيل الشحنة</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="ابحث باسم المندوب أو هاتفه..."
              value={driverSearch}
              onChange={(e) => setDriverSearch(e.target.value)}
            />
            <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-lg p-2">
              {filteredDrivers.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  لا يوجد مناديب مطابقين
                </div>
              ) : (
                filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {driver.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-semibold text-xs">{driver.name}</div>
                        <div className="text-[11px] text-muted-foreground">{driver.phone}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={assignDriverMutation.isPending}
                      onClick={() => {
                        if (assigningOrderId) {
                          assignDriverMutation.mutate({
                            orderId: assigningOrderId,
                            driverId: driver.id,
                          });
                        }
                      }}
                    >
                      تعيين
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
