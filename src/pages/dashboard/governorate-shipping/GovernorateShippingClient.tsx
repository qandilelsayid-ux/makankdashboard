"useClient";
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
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type ShippingOrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentType = "CASH_ON_PICKUP" | "CASH_ON_DELIVERY";

interface ShippingOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  senderName: string;
  senderPhone: string;
  pickupGovernorate: string;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  receiverName: string;
  receiverPhone: string;
  deliveryGovernorate: string;
  deliveryAddress: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  packageDescription: string;
  packageCategory?: string | null;
  packageSize?: string | null;
  packageWeightKg?: number | null;
  images?: string[];
  notes?: string | null;
  deliveryPrice: number;
  paymentType: PaymentType;
  status: ShippingOrderStatus;
  deliveryBoyId?: number | null;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  adminNotes?: string | null;
  createdAt: string;
  Customer?: {
    id: number;
    name: string;
    phone: string;
  };
  DeliveryBoy?: {
    id: number;
    name: string;
    phone: string;
    image?: string;
  };
}

interface ShippingRoute {
  id: number;
  fromGovernorate: string;
  toGovernorate: string;
  price: number;
  estimatedDelivery?: string | null;
  isActive: boolean;
}

interface ShippingGovernorate {
  id: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  image?: string;
  DeliveryDetails?: {
    rating: number;
    availableNow: boolean;
  };
  _count?: {
    DriverGovernorateOrders: number;
  };
}

const statusMap: Record<
  ShippingOrderStatus,
  { label: string; color: string; icon: any }
> = {
  PENDING: {
    label: "قيد الانتظار",
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  ASSIGNED: {
    label: "تم تعيين مندوب",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: User,
  },
  PICKED_UP: {
    label: "تم الاستلام من الراسل",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    icon: Package,
  },
  IN_TRANSIT: {
    label: "جاري النقل بين المحافظات",
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "تم التسليم بنجاح",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "ملغي",
    color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
  },
};

export default function GovernorateShippingClient(): JSX.Element {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"orders" | "routes" | "governorates">("orders");

  // Orders Filter States
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<ShippingOrder | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isAssignDriverOpen, setIsAssignDriverOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [driverSearch, setDriverSearch] = useState("");

  // Route Modals
  const [isAddRouteOpen, setIsAddRouteOpen] = useState(false);
  const [routeFromGov, setRouteFromGov] = useState("");
  const [routeToGov, setRouteToGov] = useState("");
  const [routePrice, setRoutePrice] = useState<number>(80);
  const [routeEstimatedTime, setRouteEstimatedTime] = useState("خلال 24-48 ساعة");

  // Governorate Modal
  const [isAddGovOpen, setIsAddGovOpen] = useState(false);
  const [govNameAr, setGovNameAr] = useState("");
  const [govNameEn, setGovNameEn] = useState("");

  // 1. Fetch Orders Query
  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["governorateShippingOrders", page, statusFilter, searchQuery],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: "15",
      };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOrders"],
        method: "GET",
        params,
      });
      return res;
    },
  });

  const ordersList: ShippingOrder[] = useMemo(() => {
    return Array.isArray(ordersResponse?.data) ? ordersResponse.data : [];
  }, [ordersResponse]);

  // 2. Fetch Routes Query
  const {
    data: routesResponse,
    isLoading: isRoutesLoading,
    refetch: refetchRoutes,
  } = useQuery({
    queryKey: ["governorateShippingRoutes"],
    queryFn: async () => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes"],
        method: "GET",
      });
    },
  });

  const routesList: ShippingRoute[] = useMemo(() => {
    return Array.isArray(routesResponse?.data) ? routesResponse.data : [];
  }, [routesResponse]);

  // 3. Fetch Governorates Query
  const {
    data: govsResponse,
    isLoading: isGovsLoading,
    refetch: refetchGovs,
  } = useQuery({
    queryKey: ["governorateShippingGovernorates"],
    queryFn: async () => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingGovs"],
        method: "GET",
      });
    },
  });

  const govsList: ShippingGovernorate[] = useMemo(() => {
    return Array.isArray(govsResponse?.data) ? govsResponse.data : [];
  }, [govsResponse]);

  // 4. Fetch Drivers Query
  const { data: driversResponse } = useQuery({
    queryKey: ["governorateShippingDrivers"],
    queryFn: async () => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingDrivers"],
        method: "GET",
      });
    },
    enabled: isAssignDriverOpen,
  });

  const driversList: Driver[] = useMemo(() => {
    return Array.isArray(driversResponse?.data) ? driversResponse.data : [];
  }, [driversResponse]);

  const filteredDrivers = useMemo(() => {
    if (!driverSearch.trim()) return driversList;
    const q = driverSearch.toLowerCase();
    return driversList.filter(
      (d) =>
        d.name.toLowerCase().includes(q) || (d.phone && d.phone.includes(q))
    );
  }, [driversList, driverSearch]);

  // Assign Driver Mutation
  const assignDriverMutation = useMutation({
    mutationFn: async ({
      orderId,
      driverId,
    }: {
      orderId: number;
      driverId: number;
    }) => {
      return await fetchHelper({
        endPoint: [
          "governorateShipping",
          "govShippingAdmin",
          "govShippingOrders",
          orderId,
          "govShippingAssignDriver",
        ],
        method: "PATCH",
        body: { driverId },
      });
    },
    onSuccess: () => {
      toast.success("تم تعيين المندوب بنجاح للشحنة");
      setIsAssignDriverOpen(false);
      setAssigningOrderId(null);
      queryClient.invalidateQueries({ queryKey: ["governorateShippingOrders"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل تعيين المندوب");
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      status,
      cancellationReason,
    }: {
      orderId: number;
      status: ShippingOrderStatus;
      cancellationReason?: string;
    }) => {
      return await fetchHelper({
        endPoint: [
          "governorateShipping",
          "govShippingAdmin",
          "govShippingOrders",
          orderId,
          "govShippingStatus",
        ],
        method: "PATCH",
        body: { status, cancellationReason },
      });
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الشحنة بنجاح");
      setIsDetailsOpen(false);
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ["governorateShippingOrders"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل تحديث الحالة");
    },
  });

  // Save Route Mutation
  const saveRouteMutation = useMutation({
    mutationFn: async (body: {
      fromGovernorate: string;
      toGovernorate: string;
      price: number;
      estimatedDelivery: string;
    }) => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes"],
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      toast.success("تم حفظ مسار الشحن بنجاح");
      setIsAddRouteOpen(false);
      refetchRoutes();
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل حفظ المسار");
    },
  });

  // Delete Route Mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes", id],
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("تم حذف المسار بنجاح");
      refetchRoutes();
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل حذف المسار");
    },
  });

  // Add Gov Mutation
  const addGovMutation = useMutation({
    mutationFn: async (body: { nameAr: string; nameEn: string }) => {
      return await fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingGovs"],
        method: "POST",
        body,
      });
    },
    onSuccess: () => {
      toast.success("تمت إضافة المحافظة بنجاح");
      setIsAddGovOpen(false);
      setGovNameAr("");
      setGovNameEn("");
      refetchGovs();
    },
    onError: (err: any) => {
      toast.error(err?.message || "فشل إضافة المحافظة");
    },
  });

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "orders"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <Package className="w-4 h-4" />
          <span>طلبات الشحن الواردة</span>
        </button>

        <button
          onClick={() => setActiveTab("routes")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "routes"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>مصفوفة الأسعار والمسارات</span>
        </button>

        <button
          onClick={() => setActiveTab("governorates")}
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === "governorates"
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>المحافظات المتاحة</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: ORDERS TAB                                       */}
      {/* ======================================================== */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <Card>
            <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-1 w-full gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-gray-400" />
                  <Input
                    placeholder="ابحث برقم الشحنة، اسم الراسل/المستلم، الهاتف..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="تصفية بالحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع الحالات</SelectItem>
                    <SelectItem value="PENDING">قيد الانتظار</SelectItem>
                    <SelectItem value="ASSIGNED">تم تعيين مندوب</SelectItem>
                    <SelectItem value="PICKED_UP">تم الاستلام</SelectItem>
                    <SelectItem value="IN_TRANSIT">جاري النقل</SelectItem>
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
                <RefreshCw
                  className={`w-4 h-4 ${isOrdersLoading ? "animate-spin" : ""}`}
                />
                <span>تحديث</span>
              </Button>
            </CardContent>
          </Card>

          {/* Orders Table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>قائمة شحنات المحافظات</span>
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
                  <p className="font-semibold">لا توجد طلبات شحن محافظات حالياً</p>
                  <p className="text-xs mt-1">
                    ستظهر هنا كافة طلبات الشحن الواردة من تطبيق العميل فور إنشائها
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الشحنة</TableHead>
                        <TableHead>من (الراسل)</TableHead>
                        <TableHead>إلى (المستلم)</TableHead>
                        <TableHead>محتوى الطرد</TableHead>
                        <TableHead>السعر والدفع</TableHead>
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

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-mono font-bold text-xs">
                              {order.orderNumber}
                            </TableCell>

                            <TableCell>
                              <div className="font-semibold text-sm">
                                {order.senderName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                📞 {order.senderPhone}
                              </div>
                              <div className="text-xs text-primary font-medium flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>{order.pickupGovernorate}</span>
                              </div>
                            </TableCell>

                            <TableCell>
                              <div className="font-semibold text-sm">
                                {order.receiverName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                📞 {order.receiverPhone}
                              </div>
                              <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>{order.deliveryGovernorate}</span>
                              </div>
                            </TableCell>

                            <TableCell className="max-w-[200px]">
                              <p className="truncate font-medium text-xs">
                                {order.packageDescription}
                              </p>
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
                              <span className="text-[11px] text-muted-foreground">
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
                                    <div className="font-medium text-xs">
                                      {order.DeliveryBoy.name}
                                    </div>
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
                              <div className="flex items-center gap-1 justify-end">
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
                              </div>
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
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ROUTES & PRICING MATRIX                           */}
      {/* ======================================================== */}
      {activeTab === "routes" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">مصفوفة أسعار المحافظات</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  تحديد أسعار الشحن ومدة التوصيل بين كل محافظة وأخرى (من محافظة إلى أخرى)
                </p>
              </div>

              <Button
                onClick={() => setIsAddRouteOpen(true)}
                className="gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة مسار جديد</span>
              </Button>
            </CardHeader>
            <CardContent>
              {isRoutesLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  جاري تحميل المسارات...
                </div>
              ) : routesList.length === 0 ? (
                <div className="py-12 text-center text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                  <p className="font-semibold">لم يتم تحديد أي مسارات أسعار بعد</p>
                  <p className="text-xs mt-1">
                    اضغط على "إضافة مسار جديد" لتحديد سعر الشحن بين محافظتين
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>من محافظة</TableHead>
                        <TableHead>إلى محافظة</TableHead>
                        <TableHead>سعر الشحن</TableHead>
                        <TableHead>مدة التوصيل المتوقعة</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead className="text-left">حذف</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {routesList.map((route) => (
                        <TableRow key={route.id}>
                          <TableCell className="font-bold text-sm">
                            {route.fromGovernorate}
                          </TableCell>
                          <TableCell className="font-bold text-sm">
                            {route.toGovernorate}
                          </TableCell>
                          <TableCell className="font-bold text-sm text-primary">
                            {route.price} ج.م
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {route.estimatedDelivery || "خلال 24-48 ساعة"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                route.isActive
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-gray-100 text-gray-500 border-gray-200"
                              }
                            >
                              {route.isActive ? "نشط ومتاح" : "معطل"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-left">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => {
                                if (
                                  confirm(
                                    `هل أنت متأكد من حذف مسار الشحن من ${route.fromGovernorate} إلى ${route.toGovernorate}؟`
                                  )
                                ) {
                                  deleteRouteMutation.mutate(route.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: GOVERNORATES LIST                                */}
      {/* ======================================================== */}
      {activeTab === "governorates" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">المحافظات المسجلة</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  المحافظات التي تظهر للعملاء في قوائم اختيار نقطة الانطلاق والوصول
                </p>
              </div>

              <Button
                onClick={() => setIsAddGovOpen(true)}
                className="gap-2 text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة محافظة</span>
              </Button>
            </CardHeader>
            <CardContent>
              {isGovsLoading ? (
                <div className="py-12 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                  جاري تحميل المحافظات...
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {govsList.map((gov) => (
                    <div
                      key={gov.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between bg-card"
                    >
                      <div>
                        <div className="font-bold text-sm">{gov.nameAr}</div>
                        <div className="text-xs text-muted-foreground">
                          {gov.nameEn}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        مفعلة
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: ORDER DETAILS MODAL                            */}
      {/* ======================================================== */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 text-lg">
                  <span className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <span>تفاصيل الشحنة #{selectedOrder.orderNumber}</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      statusMap[selectedOrder.status]?.color || ""
                    }`}
                  >
                    {statusMap[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  تاريخ الإنشاء:{" "}
                  {new Date(selectedOrder.createdAt).toLocaleString("ar-EG")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Sender & Receiver Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sender Card */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-1.5">
                    <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>بيانات الراسل (نقطة الاستلام)</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedOrder.senderName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      📞 {selectedOrder.senderPhone}
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      محافظة: {selectedOrder.pickupGovernorate}
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
                        <span>عرض على خرائط جوجل</span>
                      </a>
                    )}
                  </div>

                  {/* Receiver Card */}
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>بيانات المستلم (نقطة التسليم)</span>
                    </div>
                    <div className="text-sm font-semibold">
                      {selectedOrder.receiverName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      📞 {selectedOrder.receiverPhone}
                    </div>
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      محافظة: {selectedOrder.deliveryGovernorate}
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
                        <span>عرض على خرائط جوجل</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Package Details */}
                <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 space-y-2">
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary" />
                    <span>تفاصيل الطرد والشحنة</span>
                  </div>
                  <p className="text-sm font-medium">
                    {selectedOrder.packageDescription}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {selectedOrder.packageCategory && (
                      <span>التصنيف: {selectedOrder.packageCategory}</span>
                    )}
                    {selectedOrder.packageSize && (
                      <span>الحجم: {selectedOrder.packageSize}</span>
                    )}
                    {selectedOrder.packageWeightKg && (
                      <span>الوزن: {selectedOrder.packageWeightKg} كجم</span>
                    )}
                  </div>
                  {selectedOrder.notes && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/30 p-2 rounded text-amber-800 dark:text-amber-300">
                      ملاحظات للمندوب: {selectedOrder.notes}
                    </div>
                  )}

                  {/* Images preview if available */}
                  {Array.isArray(selectedOrder.images) &&
                    selectedOrder.images.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold mb-1">
                          صور الشحنة:
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {selectedOrder.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt="Shipment"
                              className="w-16 h-16 rounded object-cover border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Pricing & Driver */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <div className="text-xs text-muted-foreground">
                      سعر الشحن وطريقة الدفع
                    </div>
                    <div className="text-lg font-bold text-primary mt-1">
                      {selectedOrder.deliveryPrice} ج.م
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {selectedOrder.paymentType === "CASH_ON_PICKUP"
                        ? "كاش عند الاستلام (من الراسل)"
                        : "كاش عند التسليم (من المستلم)"}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        المندوب المعين
                      </div>
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

                {/* Change Status Fast Actions */}
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
                        تأكيد استلام الطرد
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
                        جاري النقل بين المحافظات
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
                        تأكيد التسليم بنجاح
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

      {/* ======================================================== */}
      {/* MODAL 2: ASSIGN DRIVER MODAL                            */}
      {/* ======================================================== */}
      <Dialog open={isAssignDriverOpen} onOpenChange={setIsAssignDriverOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <span>تعيين مندوب لشحن المحافظات</span>
            </DialogTitle>
            <DialogDescription>
              اختر المندوب المناسب لتولي مهمة التوصيل بين المحافظات
            </DialogDescription>
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
                  لا يوجد مناديب مسجلين بهذا الاسم
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
                        <div className="text-[11px] text-muted-foreground">
                          📞 {driver.phone}
                        </div>
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
                      تعيين الآن
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 3: ADD NEW ROUTE MODAL                            */}
      {/* ======================================================== */}
      <Dialog open={isAddRouteOpen} onOpenChange={setIsAddRouteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>إضافة مسار وسعر شحن جديد</span>
            </DialogTitle>
            <DialogDescription>
              حدد محافظة الانطلاق ومحافظة الوجهة وسعر التوصيل
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">من محافظة (الانطلاق):</label>
              <Select value={routeFromGov} onValueChange={setRouteFromGov}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر محافظة الانطلاق" />
                </SelectTrigger>
                <SelectContent>
                  {govsList.map((g) => (
                    <SelectItem key={g.id} value={g.nameAr}>
                      {g.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">إلى محافظة (الوجهة):</label>
              <Select value={routeToGov} onValueChange={setRouteToGov}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر محافظة الوجهة" />
                </SelectTrigger>
                <SelectContent>
                  {govsList.map((g) => (
                    <SelectItem key={g.id} value={g.nameAr}>
                      {g.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">سعر الشحن (ج.م):</label>
              <Input
                type="number"
                min="0"
                value={routePrice}
                onChange={(e) => setRoutePrice(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">مدة التوصيل المتوقعة:</label>
              <Input
                value={routeEstimatedTime}
                onChange={(e) => setRouteEstimatedTime(e.target.value)}
                placeholder="مثال: خلال 24-48 ساعة"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={
                !routeFromGov ||
                !routeToGov ||
                routeFromGov === routeToGov ||
                saveRouteMutation.isPending
              }
              onClick={() => {
                if (routeFromGov === routeToGov) {
                  toast.error("لا يمكن أن تكون محافظة الانطلاق والوجهة متطابقتين");
                  return;
                }
                saveRouteMutation.mutate({
                  fromGovernorate: routeFromGov,
                  toGovernorate: routeToGov,
                  price: routePrice,
                  estimatedDelivery: routeEstimatedTime,
                });
              }}
            >
              حفظ المسار
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODAL 4: ADD GOVERNORATE MODAL                          */}
      {/* ======================================================== */}
      <Dialog open={isAddGovOpen} onOpenChange={setIsAddGovOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <span>إضافة محافظة جديدة</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">اسم المحافظة بالعربية:</label>
              <Input
                value={govNameAr}
                onChange={(e) => setGovNameAr(e.target.value)}
                placeholder="مثال: الشرقية"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">اسم المحافظة بالإنجليزية:</label>
              <Input
                value={govNameEn}
                onChange={(e) => setGovNameEn(e.target.value)}
                placeholder="مثال: Sharqia"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!govNameAr || !govNameEn || addGovMutation.isPending}
              onClick={() =>
                addGovMutation.mutate({
                  nameAr: govNameAr.trim(),
                  nameEn: govNameEn.trim(),
                })
              }
            >
              إضافة الآن
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
