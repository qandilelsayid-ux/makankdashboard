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
import { Boxes, Pencil, Plus, RefreshCw, Scale, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatCityLabel,
  formatOptionWeight,
  ShippingOption,
  ShippingType,
  shippingTypeLabel,
} from "./types";

interface ShippingOptionsTabProps {
  effectiveCityId: number | null;
  isCityAdmin: boolean;
  citiesList: Array<{ id: number; name: any }>;
}

export function ShippingOptionsTab({
  effectiveCityId,
  isCityAdmin,
  citiesList,
}: ShippingOptionsTabProps) {
  const [typeFilter, setTypeFilter] = useState<"ALL" | ShippingType>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOpt, setEditingOpt] = useState<ShippingOption | null>(null);

  const [formType, setFormType] = useState<ShippingType>("GOVERNORATE");
  const [formCityId, setFormCityId] = useState<string>(
    effectiveCityId ? String(effectiveCityId) : "",
  );
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [cargoDescAr, setCargoDescAr] = useState("");
  const [cargoDescEn, setCargoDescEn] = useState("");
  const [minWeightKg, setMinWeightKg] = useState("0");
  const [maxWeightKg, setMaxWeightKg] = useState("");
  const [weightLabel, setWeightLabel] = useState("");
  const [extraPrice, setExtraPrice] = useState("0");
  const [sortOrder, setSortOrder] = useState("1");

  const {
    data: optionsRes,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["governorateShippingOptions", effectiveCityId, typeFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (effectiveCityId) params.cityId = String(effectiveCityId);
      if (typeFilter !== "ALL") params.shippingType = typeFilter;
      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOptions"],
        method: "GET",
        params,
      });
    },
  });

  const optionsList: ShippingOption[] = useMemo(
    () => (Array.isArray(optionsRes?.data) ? optionsRes.data : []),
    [optionsRes],
  );

  const openCreateModal = (defaultType?: ShippingType) => {
    setEditingOpt(null);
    setFormType(defaultType || (typeFilter === "VILLAGE" ? "VILLAGE" : "GOVERNORATE"));
    setFormCityId(effectiveCityId ? String(effectiveCityId) : "");
    setNameAr("");
    setNameEn("");
    setCargoDescAr("");
    setCargoDescEn("");
    setMinWeightKg("0");
    setMaxWeightKg("");
    setWeightLabel("");
    setExtraPrice("0");
    setSortOrder(String(optionsList.length + 1));
    setIsModalOpen(true);
  };

  const openEditModal = (opt: ShippingOption) => {
    setEditingOpt(opt);
    setFormType(opt.shippingType || "GOVERNORATE");
    setFormCityId(opt.cityId ? String(opt.cityId) : "");
    setNameAr(opt.nameAr);
    setNameEn(opt.nameEn);
    setCargoDescAr(opt.cargoDescriptionAr || "");
    setCargoDescEn(opt.cargoDescriptionEn || "");
    setMinWeightKg(String(opt.minWeightKg ?? 0));
    setMaxWeightKg(opt.maxWeightKg != null ? String(opt.maxWeightKg) : "");
    setWeightLabel(opt.weightLabel || "");
    setExtraPrice(String(opt.extraPrice ?? 0));
    setSortOrder(String(opt.sortOrder ?? 0));
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        shippingType: formType,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        cargoDescriptionAr: cargoDescAr.trim() || undefined,
        cargoDescriptionEn: cargoDescEn.trim() || undefined,
        minWeightKg: minWeightKg.trim() ? Number(minWeightKg) : 0,
        maxWeightKg: maxWeightKg.trim() ? Number(maxWeightKg) : undefined,
        weightLabel: weightLabel.trim() || undefined,
        extraPrice: Number(extraPrice || 0),
        sortOrder: sortOrder.trim() ? Number(sortOrder) : 0,
      };
      if (!isCityAdmin && formCityId && formCityId !== "global") {
        payload.cityId = Number(formCityId);
      }

      if (editingOpt) {
        return fetchHelper({
          endPoint: [
            "governorateShipping",
            "govShippingAdmin",
            "govShippingOptions",
            editingOpt.id,
          ],
          method: "PATCH",
          body: {
            ...payload,
            cargoDescriptionAr: cargoDescAr.trim(),
            cargoDescriptionEn: cargoDescEn.trim(),
            weightLabel: weightLabel.trim(),
          },
        });
      }

      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOptions"],
        method: "POST",
        body: payload,
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل حفظ أوبشن الشحن");
        return;
      }
      toast.success(
        editingOpt ? "تم تعديل أوبشن الحمولة والوزن بنجاح" : "تمت إضافة أوبشن الحمولة والوزن بنجاح",
      );
      setIsModalOpen(false);
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "فشل الحفظ"),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOptions", id],
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل التعديل");
        return;
      }
      refetch();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingOptions", id],
        method: "DELETE",
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل الحذف");
        return;
      }
      toast.success("تم حذف أوبشن الشحن بنجاح");
      refetch();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">أوبشنات الشحن والحمولة والوزن</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              أضف خيارات الحمولة والوزن التي يختار منها العميل في الموبايل (بدل الاختيارات الثابتة)، ويُضاف سعرها تلقائياً على سعر المسار
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={typeFilter}
              onValueChange={(v) => setTypeFilter(v as "ALL" | ShippingType)}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">الكل (محافظات + قرى)</SelectItem>
                <SelectItem value="GOVERNORATE">أوبشنات المحافظات</SelectItem>
                <SelectItem value="VILLAGE">أوبشنات القرى</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={() => openCreateModal()} size="sm" className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>إضافة أوبشن حمولة ووزن</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              جاري تحميل خيارات الحمولة...
            </div>
          ) : optionsList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <Boxes className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-semibold">لم يتم إضافة أوبشنات حمولة ووزن لهذه المدينة بعد</p>
              <p className="text-xs mt-1">
                اضغط «إضافة أوبشن حمولة ووزن» لتحديد الحمولات والأوزان المتاحة للعملاء في المحافظات والقرى
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>النوع والمدينة</TableHead>
                    <TableHead>اسم أوبشن الحمولة</TableHead>
                    <TableHead>الحمولة / المحتويات المناسبة</TableHead>
                    <TableHead>نطاق الوزن (كجم)</TableHead>
                    <TableHead>إضافة السعر على المسار</TableHead>
                    <TableHead>الترتيب</TableHead>
                    <TableHead>تفعيل</TableHead>
                    <TableHead className="text-left">تحكم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {optionsList.map((opt) => (
                    <TableRow key={opt.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant="outline"
                            className={
                              opt.shippingType === "VILLAGE"
                                ? "w-fit text-[10px] bg-orange-50 text-orange-700 border-orange-200"
                                : "w-fit text-[10px] bg-sky-50 text-sky-700 border-sky-200"
                            }
                          >
                            {shippingTypeLabel(opt.shippingType)}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {formatCityLabel(opt.City)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-sm">{opt.nameAr}</div>
                        <div className="text-xs text-muted-foreground">{opt.nameEn}</div>
                      </TableCell>
                      <TableCell className="max-w-[220px]">
                        <div className="text-xs">{opt.cargoDescriptionAr || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 text-xs font-semibold">
                          <Scale className="w-3 h-3 text-primary" />
                          <span>{formatOptionWeight(opt)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-sm text-primary">
                        {opt.extraPrice > 0 ? `+${opt.extraPrice} ج.م` : "مشمول بسعر المسار"}
                      </TableCell>
                      <TableCell className="text-xs">{opt.sortOrder}</TableCell>
                      <TableCell>
                        <Switch
                          checked={opt.isActive}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: opt.id, isActive: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                            onClick={() => openEditModal(opt)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50"
                            onClick={() => {
                              if (confirm(`حذف خيار «${opt.nameAr}»؟`)) {
                                deleteMutation.mutate(opt.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT OPTION MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-primary" />
              <span>
                {editingOpt ? "تعديل أوبشن الحمولة والوزن" : "إضافة أوبشن شحن (حمولة ووزن)"}
              </span>
            </DialogTitle>
            <DialogDescription>
              حدد نوع الحمولة، والوزن المسموح بالكيلو، والتكلفة الإضافية التي تُجمع على سعر المسار
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType("GOVERNORATE")}
                className={`p-2.5 rounded-lg border text-xs font-bold transition ${
                  formType === "GOVERNORATE"
                    ? "bg-sky-50 border-sky-500 text-sky-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                لـ شحن المحافظات
              </button>
              <button
                type="button"
                onClick={() => setFormType("VILLAGE")}
                className={`p-2.5 rounded-lg border text-xs font-bold transition ${
                  formType === "VILLAGE"
                    ? "bg-orange-50 border-orange-500 text-orange-800"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                لـ شحن القرى
              </button>
            </div>

            {!isCityAdmin && !editingOpt && (
              <div className="space-y-1">
                <label className="text-xs font-bold">المدينة:</label>
                <Select
                  value={formCityId || "global"}
                  onValueChange={(v) => setFormCityId(v === "global" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة (أو عام)" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">اسم الأوبشن / الحمولة (عربي):</label>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مثال: كرتونة متوسطة / حمولة أجهزة"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">الاسم بالإنجليزية:</label>
                <Input
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Medium Cargo"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold">الحمولة هتبقى إيه (وصف للمستخدم):</label>
                <Input
                  value={cargoDescAr}
                  onChange={(e) => setCargoDescAr(e.target.value)}
                  placeholder="مثال: شنط ملابس أو أجهزة منزلية صغيرة"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold">الوصف بالإنجليزية (اختياري):</label>
                <Input
                  value={cargoDescEn}
                  onChange={(e) => setCargoDescEn(e.target.value)}
                  placeholder="e.g. Clothes or small appliances"
                />
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-muted/30 space-y-3">
              <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Scale className="w-4 h-4" />
                <span>الوزن والسعر الإضافي</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">أقل وزن (كجم):</label>
                  <Input
                    type="number"
                    min="0"
                    value={minWeightKg}
                    onChange={(e) => setMinWeightKg(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">أقصى وزن (كجم):</label>
                  <Input
                    type="number"
                    min="0"
                    value={maxWeightKg}
                    onChange={(e) => setMaxWeightKg(e.target.value)}
                    placeholder="مفتوح"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">السعر الإضافي (ج.م):</label>
                  <Input
                    type="number"
                    min="0"
                    value={extraPrice}
                    onChange={(e) => setExtraPrice(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">نص الوزن للعرض (اختياري):</label>
                  <Input
                    value={weightLabel}
                    onChange={(e) => setWeightLabel(e.target.value)}
                    placeholder="مثال: حتى 15 كجم"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">ترتيب الظهور:</label>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={!nameAr.trim() || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              {editingOpt ? "حفظ التعديلات" : "إضافة الأوبشن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
