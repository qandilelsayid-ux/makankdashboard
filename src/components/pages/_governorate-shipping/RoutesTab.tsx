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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Pencil, Plus, RefreshCw, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatCityLabel,
  ShippingGovernorate,
  ShippingRoute,
  ShippingType,
  shippingTypeLabel,
  ShippingVillage,
} from "./types";

interface RoutesTabProps {
  effectiveCityId: number | null;
  isCityAdmin: boolean;
  govsList: ShippingGovernorate[];
  villagesList: ShippingVillage[];
  citiesList: Array<{ id: number; name: any }>;
}

export function RoutesTab({
  effectiveCityId,
  isCityAdmin,
  govsList,
  villagesList,
  citiesList,
}: RoutesTabProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | ShippingType>("ALL");

  // Modal state (shared Add & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<ShippingRoute | null>(null);
  const [formType, setFormType] = useState<ShippingType>("GOVERNORATE");
  const [formCityId, setFormCityId] = useState<string>(
    effectiveCityId ? String(effectiveCityId) : "",
  );
  const [fromLoc, setFromLoc] = useState("");
  const [toLoc, setToLoc] = useState("");
  const [fromCenter, setFromCenter] = useState("");
  const [toCenter, setToCenter] = useState("");
  const [price, setPrice] = useState<string>("80");
  const [estimatedDelivery, setEstimatedDelivery] = useState("خلال 24 ساعة");
  const [cargoDescription, setCargoDescription] = useState("");
  const [maxWeightKg, setMaxWeightKg] = useState("");
  const [extraPricePerKg, setExtraPricePerKg] = useState("0");

  const {
    data: routesResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["governorateShippingRoutes", effectiveCityId, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (effectiveCityId) params.cityId = String(effectiveCityId);
      if (typeFilter !== "ALL") params.shippingType = typeFilter;
      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes"],
        method: "GET",
        params,
      });
    },
  });

  const routesList: ShippingRoute[] = useMemo(
    () => (Array.isArray(routesResponse?.data) ? routesResponse.data : []),
    [routesResponse],
  );

  // Selected Governorate objects for center dropdowns
  const fromGovObj = useMemo(
    () => govsList.find((g) => g.nameAr === fromLoc),
    [govsList, fromLoc],
  );
  const toGovObj = useMemo(
    () => govsList.find((g) => g.nameAr === toLoc),
    [govsList, toLoc],
  );
  const fromCenters = useMemo(
    () => (fromGovObj?.Centers || fromGovObj?.centers || []).filter((c) => c.isActive),
    [fromGovObj],
  );
  const toCenters = useMemo(
    () => (toGovObj?.Centers || toGovObj?.centers || []).filter((c) => c.isActive),
    [toGovObj],
  );

  // Filtered villages for selected city in modal (Super Admin may pick a city in modal)
  const modalVillages = useMemo(() => {
    const cid = isCityAdmin
      ? effectiveCityId
      : formCityId
        ? Number(formCityId)
        : effectiveCityId;
    if (!cid) return villagesList;
    return villagesList.filter((v) => v.cityId === cid);
  }, [villagesList, formCityId, effectiveCityId, isCityAdmin]);

  const openCreateModal = (defaultType?: ShippingType) => {
    const chosenType = defaultType || (typeFilter === "VILLAGE" ? "VILLAGE" : "GOVERNORATE");
    setEditingRoute(null);
    setFormType(chosenType);
    setFormCityId(effectiveCityId ? String(effectiveCityId) : "");
    setFromLoc("");
    setToLoc("");
    setFromCenter("");
    setToCenter("");
    setPrice(chosenType === "VILLAGE" ? "35" : "80");
    setEstimatedDelivery(
      chosenType === "VILLAGE" ? "خلال ساعتين" : "خلال 24-48 ساعة",
    );
    setCargoDescription("");
    setMaxWeightKg("");
    setExtraPricePerKg("0");
    setIsModalOpen(true);
  };

  const openEditModal = (route: ShippingRoute) => {
    setEditingRoute(route);
    setFormType(route.shippingType || "GOVERNORATE");
    setFormCityId(route.cityId ? String(route.cityId) : "");
    setFromLoc(route.fromGovernorate);
    setToLoc(route.toGovernorate);
    setFromCenter(route.fromCenter || "");
    setToCenter(route.toCenter || "");
    setPrice(String(route.price));
    setEstimatedDelivery(route.estimatedDelivery || "");
    setCargoDescription(route.cargoDescription || "");
    setMaxWeightKg(route.maxWeightKg != null ? String(route.maxWeightKg) : "");
    setExtraPricePerKg(
      route.extraPricePerKg != null ? String(route.extraPricePerKg) : "0",
    );
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        shippingType: formType,
        fromGovernorate: fromLoc,
        toGovernorate: toLoc,
        fromCenter: formType === "GOVERNORATE" && fromCenter ? fromCenter : undefined,
        toCenter: formType === "GOVERNORATE" && toCenter ? toCenter : undefined,
        price: Number(price || 0),
        estimatedDelivery: estimatedDelivery.trim() || undefined,
        cargoDescription: cargoDescription.trim() || undefined,
        maxWeightKg: maxWeightKg.trim() ? Number(maxWeightKg) : undefined,
        extraPricePerKg: extraPricePerKg.trim() ? Number(extraPricePerKg) : 0,
      };
      if (!isCityAdmin && formCityId && formCityId !== "global") {
        payload.cityId = Number(formCityId);
      }

      if (editingRoute) {
        return fetchHelper({
          endPoint: [
            "governorateShipping",
            "govShippingAdmin",
            "govShippingRoutes",
            editingRoute.id,
          ],
          method: "PATCH",
          body: {
            ...payload,
            fromCenter: formType === "GOVERNORATE" ? fromCenter : "",
            toCenter: formType === "GOVERNORATE" ? toCenter : "",
            cargoDescription: cargoDescription.trim(),
            estimatedDelivery: estimatedDelivery.trim(),
          },
        });
      }

      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes"],
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل حفظ المسار");
        return;
      }
      toast.success(editingRoute ? "تم تعديل مسار الشحن بنجاح" : "تم حفظ مسار الشحن بنجاح");
      setIsModalOpen(false);
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "فشل حفظ المسار"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes", id],
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل تعديل الحالة");
        return;
      }
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingRoutes", id],
        method: "DELETE",
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل الحذف");
        return;
      }
      toast.success("تم حذف المسار بنجاح");
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">مصفوفة الأسعار والمسارات (محافظات وقرى)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              حدّد أسعار المسارات لكل من شحن المحافظات بمراكزها وشحن القرى، مع إمكانية تحديد أقصى وزن ونوع الحمولة لكل مسار
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "ALL" | ShippingType)}
            >
              <SelectTrigger className="w-[165px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">جميع المسارات</SelectItem>
                <SelectItem value="GOVERNORATE">مسارات المحافظات</SelectItem>
                <SelectItem value="VILLAGE">مسارات القرى</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => openCreateModal("GOVERNORATE")} size="sm" className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>مسار محافظات</span>
            </Button>

            <Button
              onClick={() => openCreateModal("VILLAGE")}
              size="sm"
              variant="secondary"
              className="gap-1.5 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>مسار قرى</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              جاري تحميل المسارات...
            </div>
          ) : routesList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-semibold">لا توجد مسارات أسعار مضافة بعد</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع والمدينة</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>السعر الأساسي</TableHead>
                    <TableHead>الحمولة والوزن</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>تفعيل</TableHead>
                    <TableHead className="text-left">تحكم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routesList.map((route) => {
                    const isVillage = route.shippingType === "VILLAGE";
                    return (
                      <TableRow key={route.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant="outline"
                              className={
                                isVillage
                                  ? "w-fit text-[10px] bg-orange-50 text-orange-700 border-orange-200"
                                  : "w-fit text-[10px] bg-sky-50 text-sky-700 border-sky-200"
                              }
                            >
                              {shippingTypeLabel(route.shippingType)}
                            </Badge>
                            <span className="text-[11px] text-muted-foreground">
                              {formatCityLabel(route.City)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{route.fromGovernorate}</div>
                          {route.fromCenter && (
                            <div className="text-xs text-primary">{route.fromCenter}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm">{route.toGovernorate}</div>
                          {route.toCenter && (
                            <div className="text-xs text-emerald-600 font-medium">
                              مركز: {route.toCenter}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-sm text-primary">{route.price} ج.م</div>
                          {Number(route.extraPricePerKg) > 0 && (
                            <div className="text-[10px] text-muted-foreground">
                              +{route.extraPricePerKg} ج.م/كجم
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[190px]">
                          {route.cargoDescription && (
                            <div className="text-xs truncate font-medium">
                              {route.cargoDescription}
                            </div>
                          )}
                          <div className="text-[11px] text-muted-foreground">
                            {route.maxWeightKg ? `حد أقصى: ${route.maxWeightKg} كجم` : "وزن مفتوح"}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {route.estimatedDelivery || "—"}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={route.isActive}
                            onCheckedChange={(checked) =>
                              toggleMutation.mutate({ id: route.id, isActive: checked })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-left">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                              onClick={() => openEditModal(route)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"
                              onClick={() => {
                                if (confirm("هل أنت متأكد من حذف هذا المسار؟")) {
                                  deleteMutation.mutate(route.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* ADD / EDIT ROUTE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              <span>{editingRoute ? "تعديل مسار الشحن" : "إضافة مسار شحن جديد"}</span>
            </DialogTitle>
            <DialogDescription>
              تحكم كامل في نوع الشحن (محافظات بمراكزها أو قرى المدينة) والأسعار والحمولة والوزن
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Shipping Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFormType("GOVERNORATE");
                  setFromLoc("");
                  setToLoc("");
                  setFromCenter("");
                  setToCenter("");
                }}
                className={`p-2.5 rounded-lg border text-xs font-bold transition ${
                  formType === "GOVERNORATE"
                    ? "bg-sky-50 border-sky-500 text-sky-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                شحن محافظات (مدن ومراكز)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormType("VILLAGE");
                  setFromLoc("");
                  setToLoc("");
                  setFromCenter("");
                  setToCenter("");
                }}
                className={`p-2.5 rounded-lg border text-xs font-bold transition ${
                  formType === "VILLAGE"
                    ? "bg-orange-50 border-orange-500 text-orange-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                شحن قرى (مناطق المدينة)
              </button>
            </div>

            {!isCityAdmin && !editingRoute && (
              <div className="space-y-1">
                <label className="text-xs font-bold">المدينة المقدمة للخدمة:</label>
                <Select
                  value={formCityId || "global"}
                  onValueChange={(v) => setFormCityId(v === "global" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة (أو عام للكل)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">عام (لكل المدن)</SelectItem>
                    {citiesList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {formatCityLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formType === "GOVERNORATE" ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">من محافظة (الانطلاق):</label>
                    <Select
                      value={fromLoc}
                      onValueChange={(val) => {
                        setFromLoc(val);
                        setFromCenter("");
                      }}
                    >
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
                    <label className="text-xs font-bold">مركز الانطلاق (اختياري):</label>
                    <Select
                      value={fromCenter || "__all__"}
                      onValueChange={(v) => setFromCenter(v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="المحافظة كلها" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">كل المحافظة</SelectItem>
                        {fromCenters.map((c) => (
                          <SelectItem key={c.id} value={c.nameAr}>
                            {c.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold">إلى محافظة (الوجهة):</label>
                    <Select
                      value={toLoc}
                      onValueChange={(val) => {
                        setToLoc(val);
                        setToCenter("");
                      }}
                    >
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
                    <label className="text-xs font-bold">مركز/حي الوجهة (اختياري):</label>
                    <Select
                      value={toCenter || "__all__"}
                      onValueChange={(v) => setToCenter(v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="كل المحافظة (أو مركز محدد)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">كل المحافظة (عام)</SelectItem>
                        {toCenters.map((c) => (
                          <SelectItem key={c.id} value={c.nameAr}>
                            {c.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold">من قرية / منطقة:</label>
                  <Select value={fromLoc} onValueChange={setFromLoc}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قرية الانطلاق" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalVillages.map((v) => (
                        <SelectItem key={v.id} value={v.nameAr}>
                          {v.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold">إلى قرية / منطقة:</label>
                  <Select value={toLoc} onValueChange={setToLoc}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر قرية الوجهة" />
                    </SelectTrigger>
                    <SelectContent>
                      {modalVillages.map((v) => (
                        <SelectItem key={v.id} value={v.nameAr}>
                          {v.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {modalVillages.length === 0 && (
                  <p className="col-span-2 text-xs text-amber-600">
                    أضف قرى المدينة أولاً من تبويب «القرى والمناطق» لتظهر هنا.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">سعر المسار الأساسي (ج.م):</label>
                <Input
                  type="number"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold">مدة التوصيل المتوقعة:</label>
                <Input
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  placeholder="مثال: خلال 24 ساعة"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <div className="text-xs font-bold text-primary">
                ضبط الحمولة والوزن على المسار (اختياري)
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">وصف الحمولة المسموحة:</label>
                <Input
                  value={cargoDescription}
                  onChange={(e) => setCargoDescription(e.target.value)}
                  placeholder="مثال: كراتين وأوراق وأجهزة منزلية خفيفة"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">أقصى وزن مسموح (كجم):</label>
                  <Input
                    type="number"
                    min="0"
                    value={maxWeightKg}
                    onChange={(e) => setMaxWeightKg(e.target.value)}
                    placeholder="اتركه فارغ لوزن مفتوح"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">سعر لكل كيلو إضافي (ج.م):</label>
                  <Input
                    type="number"
                    min="0"
                    value={extraPricePerKg}
                    onChange={(e) => setExtraPricePerKg(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!fromLoc || !toLoc || fromLoc === toLoc || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {editingRoute ? "حفظ التعديلات" : "حفظ المسار"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
