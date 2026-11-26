import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
import { useMutation } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  formatCityLabel,
  ShippingCenter,
  ShippingGovernorate,
  ShippingVillage,
} from "./types";

// =========================================================================
// TAB A: Shared Governorates & Their Centers (لشحن المحافظات بمراكزها)
// =========================================================================

interface GovernoratesCentersTabProps {
  govsList: ShippingGovernorate[];
  isLoading: boolean;
  isCityAdmin: boolean;
  refetchGovs: () => void;
}

export function GovernoratesCentersTab({
  govsList,
  isLoading,
  isCityAdmin,
  refetchGovs,
}: GovernoratesCentersTabProps) {
  const [search, setSearch] = useState("");

  // Add Gov (Super Admin)
  const [isAddGovOpen, setIsAddGovOpen] = useState(false);
  const [govNameAr, setGovNameAr] = useState("");
  const [govNameEn, setGovNameEn] = useState("");

  // Add / Edit Center (Available to BOTH Super Admin & City Admin!)
  const [isCenterOpen, setIsCenterOpen] = useState(false);
  const [centerGov, setCenterGov] = useState<ShippingGovernorate | null>(null);
  const [editingCenter, setEditingCenter] = useState<ShippingCenter | null>(null);
  const [centerNameAr, setCenterNameAr] = useState("");
  const [centerNameEn, setCenterNameEn] = useState("");

  const pickupOrigins = govsList.filter((g) => g.isPickupOrigin);

  const filteredGovs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return govsList;
    return govsList.filter((g) => {
      const centers = g.Centers || g.centers || [];
      return (
        g.nameAr.toLowerCase().includes(q) ||
        g.nameEn.toLowerCase().includes(q) ||
        centers.some(
          (c) =>
            c.nameAr.toLowerCase().includes(q) || c.nameEn.toLowerCase().includes(q),
        )
      );
    });
  }, [govsList, search]);

  const addGovMutation = useMutation({
    mutationFn: async (body: { nameAr: string; nameEn: string }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingGovs"],
        method: "POST",
        body,
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل إضافة المحافظة");
        return;
      }
      toast.success("تمت إضافة المحافظة بنجاح");
      setIsAddGovOpen(false);
      setGovNameAr("");
      setGovNameEn("");
      refetchGovs();
    },
  });

  const togglePickupMutation = useMutation({
    mutationFn: async ({ id, isPickupOrigin }: { id: number; isPickupOrigin: boolean }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingGovs", id],
        method: "PATCH",
        body: { isPickupOrigin },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل التعديل");
        return;
      }
      refetchGovs();
    },
  });

  const saveCenterMutation = useMutation({
    mutationFn: async () => {
      if (editingCenter) {
        return fetchHelper({
          endPoint: [
            "governorateShipping",
            "govShippingAdmin",
            "govShippingCenters",
            editingCenter.id,
          ],
          method: "PATCH",
          body: {
            nameAr: centerNameAr.trim(),
            nameEn: centerNameEn.trim() || centerNameAr.trim(),
          },
        });
      }
      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingCenters"],
        method: "POST",
        body: {
          governorateId: centerGov?.id,
          nameAr: centerNameAr.trim(),
          nameEn: centerNameEn.trim() || centerNameAr.trim(),
        },
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل حفظ المركز");
        return;
      }
      toast.success(editingCenter ? "تم تعديل المركز بنجاح" : "تمت إضافة المركز بنجاح");
      setIsCenterOpen(false);
      refetchGovs();
    },
  });

  const toggleCenterMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingCenters", id],
        method: "PATCH",
        body: { isActive },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل التعديل");
        return;
      }
      refetchGovs();
    },
  });

  const deleteCenterMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingCenters", id],
        method: "DELETE",
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل حذف المركز");
        return;
      }
      toast.success("تم حذف المركز");
      refetchGovs();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">المحافظات ومراكزها (مشتركة لكل المدن)</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              كل المدن تقدر تشحن وتوصّل لكل المحافظات ومراكزها المضافة هنا — أضف المراكز/الأحياء داخل أي محافظة لتظهر للعملاء
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-[220px]">
              <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
              <Input
                placeholder="ابحث عن محافظة أو مركز..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 h-9 text-xs"
              />
            </div>

            {!isCityAdmin && (
              <Button onClick={() => setIsAddGovOpen(true)} size="sm" className="gap-1.5 text-xs">
                <Plus className="w-4 h-4" />
                <span>إضافة محافظة</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              جاري تحميل المحافظات ومراكزها...
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200">
                {pickupOrigins.length
                  ? `أماكن الاستلام الافتراضية: ${pickupOrigins.map((g) => g.nameAr).join("، ")} — كما أن أي محافظة تبدأ منها مسار في مدينتك تتاح للاستلام تلقائياً.`
                  : "كل المحافظات متاحة كنقطة استلام وتوصيل. أضف مراكز/أحياء داخل كل محافظة للتسليم الدقيق داخل المدن."}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGovs.map((gov) => {
                  const centers = gov.Centers || gov.centers || [];
                  return (
                    <div
                      key={gov.id}
                      className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-card flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-sm flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                            <span>{gov.nameAr}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{gov.nameEn}</div>
                        </div>

                        {!isCityAdmin && (
                          <button
                            type="button"
                            disabled={togglePickupMutation.isPending}
                            onClick={() =>
                              togglePickupMutation.mutate({
                                id: gov.id,
                                isPickupOrigin: !gov.isPickupOrigin,
                              })
                            }
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              gov.isPickupOrigin
                                ? "border-sky-300 bg-sky-100 text-sky-800"
                                : "border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {gov.isPickupOrigin ? "✓ استلام" : "استلام"}
                          </button>
                        )}
                      </div>

                      {/* Centers inside Governorate */}
                      <div className="space-y-2 border-t pt-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-muted-foreground">
                            المراكز / الأحياء ({centers.length})
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[11px] gap-1"
                            onClick={() => {
                              setCenterGov(gov);
                              setEditingCenter(null);
                              setCenterNameAr("");
                              setCenterNameEn("");
                              setIsCenterOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                            <span>إضافة مركز</span>
                          </Button>
                        </div>

                        {centers.length === 0 ? (
                          <div className="text-[11px] text-muted-foreground">
                            لا توجد مراكز مضافة بعد (الشحن متاح للمحافظة ككل)
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {centers.map((c) => (
                              <div
                                key={c.id}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${
                                  c.isActive
                                    ? "bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                                    : "bg-gray-100 border-gray-200 text-gray-400 line-through"
                                }`}
                              >
                                <span>{c.nameAr}</span>
                                <button
                                  type="button"
                                  title="تعديل"
                                  onClick={() => {
                                    setCenterGov(gov);
                                    setEditingCenter(c);
                                    setCenterNameAr(c.nameAr);
                                    setCenterNameEn(c.nameEn);
                                    setIsCenterOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Pencil className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  title={c.isActive ? "تعطيل" : "تفعيل"}
                                  onClick={() =>
                                    toggleCenterMutation.mutate({
                                      id: c.id,
                                      isActive: !c.isActive,
                                    })
                                  }
                                  className="text-[10px] font-bold text-amber-600"
                                >
                                  {c.isActive ? "×" : "✓"}
                                </button>
                                {!isCityAdmin && (
                                  <button
                                    type="button"
                                    title="حذف"
                                    onClick={() => {
                                      if (confirm(`حذف مركز ${c.nameAr}؟`)) {
                                        deleteCenterMutation.mutate(c.id);
                                      }
                                    }}
                                    className="text-rose-500 hover:text-rose-700"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ADD GOV MODAL (Super Admin) */}
      <Dialog open={isAddGovOpen} onOpenChange={setIsAddGovOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة محافظة جديدة</DialogTitle>
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
              disabled={!govNameAr.trim() || !govNameEn.trim() || addGovMutation.isPending}
              onClick={() =>
                addGovMutation.mutate({ nameAr: govNameAr.trim(), nameEn: govNameEn.trim() })
              }
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ADD / EDIT CENTER MODAL */}
      <Dialog open={isCenterOpen} onOpenChange={setIsCenterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCenter
                ? `تعديل مركز (${centerGov?.nameAr || ""})`
                : `إضافة مركز جديد داخل ${centerGov?.nameAr || ""}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold">اسم المركز / الحي بالعربية:</label>
              <Input
                value={centerNameAr}
                onChange={(e) => setCenterNameAr(e.target.value)}
                placeholder="مثال: مدينة نصر / المحلة الكبرى / طلخا"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold">الاسم بالإنجليزية:</label>
              <Input
                value={centerNameEn}
                onChange={(e) => setCenterNameEn(e.target.value)}
                placeholder="e.g. Nasr City"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!centerNameAr.trim() || saveCenterMutation.isPending}
              onClick={() => saveCenterMutation.mutate()}
            >
              {editingCenter ? "حفظ التعديلات" : "إضافة المركز"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =========================================================================
// TAB B: City-Scoped Villages (القرى والمناطق التابعة للمدينة)
// =========================================================================

interface VillagesTabProps {
  effectiveCityId: number | null;
  isCityAdmin: boolean;
  villagesList: ShippingVillage[];
  isLoading: boolean;
  citiesList: Array<{ id: number; name: any }>;
  refetchVillages: () => void;
}

export function VillagesTab({
  effectiveCityId,
  isCityAdmin,
  villagesList,
  isLoading,
  citiesList,
  refetchVillages,
}: VillagesTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVillage, setEditingVillage] = useState<ShippingVillage | null>(null);
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [formCityId, setFormCityId] = useState<string>(
    effectiveCityId ? String(effectiveCityId) : "",
  );
  const [isPickupOrigin, setIsPickupOrigin] = useState(false);

  const openAdd = () => {
    setEditingVillage(null);
    setNameAr("");
    setNameEn("");
    setFormCityId(effectiveCityId ? String(effectiveCityId) : "");
    setIsPickupOrigin(false);
    setIsModalOpen(true);
  };

  const openEdit = (v: ShippingVillage) => {
    setEditingVillage(v);
    setNameAr(v.nameAr);
    setNameEn(v.nameEn);
    setFormCityId(v.cityId ? String(v.cityId) : "");
    setIsPickupOrigin(Boolean(v.isPickupOrigin));
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, any> = {
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim() || nameAr.trim(),
        isPickupOrigin,
      };
      if (!isCityAdmin && formCityId) {
        body.cityId = Number(formCityId);
      }

      if (editingVillage) {
        return fetchHelper({
          endPoint: [
            "governorateShipping",
            "govShippingAdmin",
            "govShippingVillages",
            editingVillage.id,
          ],
          method: "PATCH",
          body,
        });
      }

      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingVillages"],
        method: "POST",
        body,
      });
    },
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل حفظ القرية");
        return;
      }
      toast.success(editingVillage ? "تم تعديل القرية بنجاح" : "تمت إضافة القرية بنجاح");
      setIsModalOpen(false);
      refetchVillages();
    },
  });

  const patchVillageMutation = useMutation({
    mutationFn: async ({
      id,
      isActive,
      isPickupOrigin: pickupVal,
    }: {
      id: number;
      isActive?: boolean;
      isPickupOrigin?: boolean;
    }) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingVillages", id],
        method: "PATCH",
        body: {
          ...(isActive !== undefined ? { isActive } : {}),
          ...(pickupVal !== undefined ? { isPickupOrigin: pickupVal } : {}),
        },
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل التعديل");
        return;
      }
      refetchVillages();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingVillages", id],
        method: "DELETE",
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res?.message || "فشل الحذف");
        return;
      }
      toast.success("تم حذف القرية بنجاح");
      refetchVillages();
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">القرى والمناطق التابعة للمدينة</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              تظهر هذه القرى والمناطق فقط لعملاء هذه المدينة عند اختيار «شحن قرى»
            </p>
          </div>
          <Button onClick={openAdd} size="sm" className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" />
            <span>إضافة قرية / منطقة</span>
          </Button>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              جاري تحميل القرى...
            </div>
          ) : villagesList.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
              <p className="font-semibold">لا توجد قرى مضافة لهذه المدينة بعد</p>
              <p className="text-xs mt-1">
                اضغط «إضافة قرية / منطقة» لإضافة القرى المحيطة بمدينتك (مثل صفط تراب، بشبيش، الهياتم...)
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {villagesList.map((v) => (
                <div
                  key={v.id}
                  className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-card flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm">{v.nameAr}</div>
                      <div className="text-xs text-muted-foreground">{v.nameEn}</div>
                      {v.City && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {formatCityLabel(v.City)}
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={v.isActive}
                      onCheckedChange={(checked) =>
                        patchVillageMutation.mutate({ id: v.id, isActive: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between border-t pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        patchVillageMutation.mutate({
                          id: v.id,
                          isPickupOrigin: !v.isPickupOrigin,
                        })
                      }
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                        v.isPickupOrigin
                          ? "border-orange-300 bg-orange-100 text-orange-800"
                          : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {v.isPickupOrigin ? "✓ استلام من هنا" : "تعيين كنقطة استلام"}
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-blue-600"
                        onClick={() => openEdit(v)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-rose-500"
                        onClick={() => {
                          if (confirm(`هل تريد حذف قرية ${v.nameAr}؟`)) {
                            deleteMutation.mutate(v.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD / EDIT VILLAGE MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVillage ? "تعديل بيانات القرية / المنطقة" : "إضافة قرية / منطقة جديدة"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {!isCityAdmin && (
              <div className="space-y-1">
                <label className="text-xs font-bold">المدينة التابعة لها القرية:</label>
                <Select value={formCityId} onValueChange={setFormCityId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المدينة (إجباري)" />
                  </SelectTrigger>
                  <SelectContent>
                    {citiesList.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {formatCityLabel(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold">اسم القرية / المنطقة بالعربية:</label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: صفط تراب"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold">الاسم بالإنجليزية:</label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                placeholder="e.g. Saft Turab"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={isPickupOrigin}
                onChange={(e) => setIsPickupOrigin(e.target.checked)}
              />
              <span>متاح الاستلام من هذه المنطقة (نقطة انطلاق)</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              className="w-full"
              disabled={
                !nameAr.trim() ||
                (!isCityAdmin && !formCityId) ||
                saveMutation.isPending
              }
              onClick={() => saveMutation.mutate()}
            >
              {editingVillage ? "حفظ التعديلات" : "إضافة الآن"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
