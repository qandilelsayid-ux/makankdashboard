"use client";

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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Edit2,
  ExternalLink,
  FolderPlus,
  Layers,
  Plus,
  RefreshCw,
  Store,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KioskClient() {
  const queryClient = useQueryClient();
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"store" | "categories">("categories");

  // Category Dialog State
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [parentCategoryIdForSub, setParentCategoryIdForSub] = useState<number | null>(null);
  const [catNameAr, setCatNameAr] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catOrder, setCatOrder] = useState("0");

  // Kiosk Store Form State
  const [kioskNameAr, setKioskNameAr] = useState("كشك مكانك");
  const [kioskNameEn, setKioskNameEn] = useState("Makanak Kiosk");
  const [kioskLogo, setKioskLogo] = useState("");
  const [kioskCover, setKioskCover] = useState("");
  const [kioskPhone, setKioskPhone] = useState("01000000000");
  const [prepTime, setPrepTime] = useState("15");
  const [minDeliveryTime, setMinDeliveryTime] = useState("15");
  const [maxDeliveryTime, setMaxDeliveryTime] = useState("30");
  const [isKioskActive, setIsKioskActive] = useState(true);

  // 1. Fetch Cities
  const { data: citiesResponse } = useQuery({
    queryKey: ["kiosk-cities"],
    queryFn: () =>
      fetchHelper({
        endPoint: "cities" as any,
        params: { limit: 100 },
      }),
  });

  const cities: any[] = Array.isArray(citiesResponse?.data)
    ? citiesResponse.data
    : [];

  // Set default city
  useEffect(() => {
    if (!selectedCityId && cities.length > 0) {
      setSelectedCityId(String(cities[0].id));
    }
  }, [cities, selectedCityId]);

  // 2. Fetch Kiosks List (to find the Kiosk of the selected city)
  const {
    data: kiosksResponse,
    isLoading: isKiosksLoading,
    refetch: refetchKiosks,
  } = useQuery({
    queryKey: ["kiosk-admin-list", selectedCityId],
    queryFn: () =>
      fetchHelper({
        endPoint: "kiosk/admin/list" as any,
        params: { cityId: selectedCityId ? Number(selectedCityId) : undefined },
      }),
    enabled: !!selectedCityId,
  });

  const currentKiosk = Array.isArray(kiosksResponse?.data) && kiosksResponse.data.length > 0
    ? kiosksResponse.data[0]
    : null;

  // Sync Form when currentKiosk loads
  useEffect(() => {
    if (currentKiosk) {
      const name = typeof currentKiosk.name === "object" ? currentKiosk.name : {};
      setKioskNameAr(name.ar || "كشك مكانك");
      setKioskNameEn(name.en || "Makanak Kiosk");
      setKioskLogo(currentKiosk.logo || "");
      setKioskCover(currentKiosk.cover || "");
      setPrepTime(String(currentKiosk.prepTimeMinutes || 15));
      setMinDeliveryTime(String(currentKiosk.deliveryTimeMinMinutes || 15));
      setMaxDeliveryTime(String(currentKiosk.deliveryTimeMaxMinutes || 30));
      setIsKioskActive(!currentKiosk.isBlocked);
      if (currentKiosk.branches?.[0]?.phone) {
        setKioskPhone(currentKiosk.branches[0].phone);
      }
    }
  }, [currentKiosk]);

  // 3. Fetch Kiosk Categories & Sub-categories
  const {
    data: categoriesResponse,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["kiosk-admin-categories", currentKiosk?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `kiosk/admin/categories/${currentKiosk.id}` as any,
      }),
    enabled: !!currentKiosk?.id,
  });

  const categories: any[] = Array.isArray(categoriesResponse?.data)
    ? categoriesResponse.data
    : [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Save Kiosk Store
  const saveKioskMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "kiosk/admin/create-or-update" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تم حفظ إعدادات الكشك بنجاح!");
        refetchKiosks();
      } else {
        toast.error(res.message || "فشل في حفظ إعدادات الكشك");
      }
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ الكشك"),
  });

  // Save Category / Sub-category
  const saveCategoryMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingCategory) {
        return fetchHelper({
          endPoint: `kiosk/admin/category/${editingCategory.id}` as any,
          method: "PATCH",
          body,
        });
      }
      return fetchHelper({
        endPoint: "kiosk/admin/category" as any,
        method: "POST",
        body,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(editingCategory ? "تم تحديث الفئة بنجاح!" : "تمت إضافة الفئة بنجاح!");
        setIsCatDialogOpen(false);
        resetCatForm();
        refetchCategories();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Delete Category
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `kiosk/admin/category/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف الفئة بنجاح");
      refetchCategories();
    },
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveKiosk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId) {
      toast.error("يرجى اختيار المدينة أولاً");
      return;
    }
    saveKioskMutation.mutate({
      name: { ar: kioskNameAr, en: kioskNameEn },
      cityId: Number(selectedCityId),
      logo: kioskLogo || "uploads/kiosk-default.png",
      cover: kioskCover || "uploads/kiosk-cover.png",
      phone: kioskPhone,
      prepTimeMinutes: Number(prepTime) || 15,
      deliveryTimeMinMinutes: Number(minDeliveryTime) || 15,
      deliveryTimeMaxMinutes: Number(maxDeliveryTime) || 30,
      isActive: isKioskActive,
    });
  };

  const openAddMainCategory = () => {
    resetCatForm();
    setIsCatDialogOpen(true);
  };

  const openAddSubCategory = (parentCatId: number) => {
    resetCatForm();
    setParentCategoryIdForSub(parentCatId);
    setIsCatDialogOpen(true);
  };

  const openEditCategory = (cat: any) => {
    setEditingCategory(cat);
    const name = typeof cat.name === "object" ? cat.name : {};
    setCatNameAr(name.ar || "");
    setCatNameEn(name.en || "");
    setCatImage(cat.image || "");
    setCatOrder(String(cat.order || 0));
    setParentCategoryIdForSub(cat.parentId || null);
    setIsCatDialogOpen(true);
  };

  const resetCatForm = () => {
    setEditingCategory(null);
    setParentCategoryIdForSub(null);
    setCatNameAr("");
    setCatNameEn("");
    setCatImage("");
    setCatOrder("0");
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameAr.trim()) {
      toast.error("يرجى إدخال اسم الفئة بالعربية");
      return;
    }
    if (!currentKiosk?.id) {
      toast.error("يرجى إنشاء وحفظ إعدادات الكشك لهذه المدينة أولاً");
      return;
    }

    saveCategoryMutation.mutate({
      name: { ar: catNameAr, en: catNameEn || catNameAr },
      image: catImage || undefined,
      order: Number(catOrder) || 0,
      storeId: currentKiosk.id,
      parentId: parentCategoryIdForSub || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Top Bar: City Selector & Navigation Tabs ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
            اختر المدينة:
          </span>
          <Select value={selectedCityId} onValueChange={setSelectedCityId}>
            <SelectTrigger className="w-full md:w-[220px]">
              <SelectValue placeholder="اختر المدينة..." />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {typeof city.name === "object" ? city.name.ar || city.name.en : city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === "categories" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("categories")}
            className="flex items-center gap-2"
          >
            <Layers className="h-4 w-4" />
            <span>الفئات والـ Sub-categories</span>
          </Button>
          <Button
            variant={activeTab === "store" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab("store")}
            className="flex items-center gap-2"
          >
            <Store className="h-4 w-4" />
            <span>إعدادات الكشك بالمدينة</span>
          </Button>
        </div>
      </div>

      {/* ── TAB 1: KIOSK STORE SETUP ── */}
      {activeTab === "store" && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span>بيانات كشك مكانك للمدينة المختارة</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveKiosk} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">اسم الكشك بالعربية</label>
                  <Input
                    value={kioskNameAr}
                    onChange={(e) => setKioskNameAr(e.target.value)}
                    placeholder="كشك مكانك"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">اسم الكشك بالإنجليزية</label>
                  <Input
                    value={kioskNameEn}
                    onChange={(e) => setKioskNameEn(e.target.value)}
                    placeholder="Makanak Kiosk"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">رابط لوجو الكشك (Logo URL)</label>
                  <Input
                    value={kioskLogo}
                    onChange={(e) => setKioskLogo(e.target.value)}
                    placeholder="uploads/kiosk.png"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">رابط غلاف الكشك (Cover URL)</label>
                  <Input
                    value={kioskCover}
                    onChange={(e) => setKioskCover(e.target.value)}
                    placeholder="uploads/kiosk-cover.png"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">وقت التحضير (دقائق)</label>
                  <Input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">أقل وقت توصيل (دقائق)</label>
                  <Input
                    type="number"
                    value={minDeliveryTime}
                    onChange={(e) => setMinDeliveryTime(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">أقصى وقت توصيل (دقائق)</label>
                  <Input
                    type="number"
                    value={maxDeliveryTime}
                    onChange={(e) => setMaxDeliveryTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">رقم هاتف الاتصال بالكشك</label>
                <Input
                  value={kioskPhone}
                  onChange={(e) => setKioskPhone(e.target.value)}
                  placeholder="01000000000"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border">
                <div>
                  <p className="font-semibold text-sm">حالة الكشك (مفعل / مغلق)</p>
                  <p className="text-xs text-gray-500">
                    عند التعطيل، يظهر الكشك مغلقاً للعملاء في التطبيق
                  </p>
                </div>
                <Switch checked={isKioskActive} onCheckedChange={setIsKioskActive} />
              </div>

              <Button
                type="submit"
                disabled={saveKioskMutation.isPending}
                className="w-full md:w-auto mt-4"
              >
                {saveKioskMutation.isPending ? "جاري الحفظ..." : "حفظ إعدادات الكشك"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ── TAB 2: KIOSK CATEGORIES & SUB-CATEGORIES ── */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                <span>فئات كشك المدينة ({categories.length} فئة رئيسية)</span>
              </h2>
              <p className="text-xs text-gray-500">
                كل فئة رئيسية يظهر تحتها في تطبيق العميل سلايدر أفقي بالمنتجات، وعند الضغط عليها تفتح صفحتها مع الـ Sub-categories
              </p>
            </div>

            <div className="flex items-center gap-2">
              {currentKiosk?.id && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center gap-2 text-xs"
                >
                  <a
                    href={`/services?storeId=${currentKiosk.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>إدارة منتجات الكشك</span>
                  </a>
                </Button>
              )}
              <Button
                size="sm"
                onClick={openAddMainCategory}
                disabled={!currentKiosk?.id}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة فئة رئيسية</span>
              </Button>
            </div>
          </div>

          {!currentKiosk?.id ? (
            <Card className="p-8 text-center border-dashed">
              <Store className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                لم يتم إعداد الكشك لهذه المدينة بعد
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                يرجى الانتقال لتبويب "إعدادات الكشك بالمدينة" لحفظ الكشك أولاً، ثم العودة لإضافة الفئات.
              </p>
              <Button size="sm" onClick={() => setActiveTab("store")}>
                ضبط إعدادات الكشك الآن
              </Button>
            </Card>
          ) : isCategoriesLoading ? (
            <div className="py-12 text-center text-gray-500">جاري تحميل الفئات...</div>
          ) : categories.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Layers className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                لا توجد فئات مضافة للكشك حتى الآن
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                ابدأ بإضافة أول فئة رئيسية (مثل: مشروبات، مقرمشات، ألبان، حلويات...).
              </p>
              <Button size="sm" onClick={openAddMainCategory}>
                إضافة أول فئة رئيسية
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {categories.map((mainCat) => {
                const mainName =
                  typeof mainCat.name === "object" ? mainCat.name : {};
                const children: any[] = Array.isArray(mainCat.Children)
                  ? mainCat.Children
                  : [];

                return (
                  <Card
                    key={mainCat.id}
                    className="border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
                  >
                    <div className="p-4 bg-gray-50/70 dark:bg-gray-800/70 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {mainCat.image ? (
                          <img
                            src={mainCat.image.startsWith("http") ? mainCat.image : `/${mainCat.image}`}
                            alt=""
                            className="h-11 w-11 rounded-lg object-cover border"
                            onError={(e) => {
                              (e.target as any).src = "https://placehold.co/100x100?text=Category";
                            }}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                            📁
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              {mainName.ar || "فئة بدون اسم"}
                            </h3>
                            {mainName.en && (
                              <span className="text-xs text-gray-400">
                                ({mainName.en})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[11px] py-0">
                              {children.length} فئات فرعية (Sub-categories)
                            </Badge>
                            <span className="text-[11px] text-gray-400">
                              الترتيب: {mainCat.order}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddSubCategory(mainCat.id)}
                          className="h-8 text-xs flex items-center gap-1.5 border-dashed"
                        >
                          <FolderPlus className="h-3.5 w-3.5 text-primary" />
                          <span>إضافة فئة فرعية</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditCategory(mainCat)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف فئة "${mainName.ar}"؟`)) {
                              deleteCategoryMutation.mutate(mainCat.id);
                            }
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories Shelf */}
                    <CardContent className="p-4">
                      {children.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">
                          لا توجد فئات فرعية تحت هذا القسم بعد. اضغط "إضافة فئة فرعية" لتقسيم المنتجات.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {children.map((sub) => {
                            const subName =
                              typeof sub.name === "object" ? sub.name : {};
                            return (
                              <div
                                key={sub.id}
                                className="group relative bg-white dark:bg-gray-800 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center text-center shadow-xs hover:border-primary/50 transition-colors"
                              >
                                {sub.image ? (
                                  <img
                                    src={sub.image.startsWith("http") ? sub.image : `/${sub.image}`}
                                    alt=""
                                    className="h-10 w-10 rounded-md object-cover mb-2 border"
                                    onError={(e) => {
                                      (e.target as any).src = "https://placehold.co/100x100?text=Sub";
                                    }}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs mb-2">
                                    🏷️
                                  </div>
                                )}
                                <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 line-clamp-1">
                                  {subName.ar || "فئة فرعية"}
                                </p>
                                {subName.en && (
                                  <p className="text-[10px] text-gray-400 line-clamp-1">
                                    {subName.en}
                                  </p>
                                )}

                                {/* Hover actions */}
                                <div className="absolute top-1 left-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 rounded p-0.5">
                                  <button
                                    onClick={() => openEditCategory(sub)}
                                    className="text-gray-500 hover:text-primary p-0.5"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`حذف الفئة الفرعية "${subName.ar}"؟`)) {
                                        deleteCategoryMutation.mutate(sub.id);
                                      }
                                    }}
                                    className="text-red-400 hover:text-red-600 p-0.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DIALOG: ADD/EDIT CATEGORY OR SUBCATEGORY ── */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "تعديل الفئة"
                : parentCategoryIdForSub
                ? "إضافة فئة فرعية (Sub-category)"
                : "إضافة فئة رئيسية للكشك"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="text-sm font-medium">اسم الفئة (عربي)</label>
              <Input
                value={catNameAr}
                onChange={(e) => setCatNameAr(e.target.value)}
                placeholder="مثلاً: مشروبات غازية"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">اسم الفئة (إنجليزي)</label>
              <Input
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                placeholder="e.g. Soft Drinks"
              />
            </div>

            <div>
              <label className="text-sm font-medium">رابط صورة الفئة (Image URL)</label>
              <Input
                value={catImage}
                onChange={(e) => setCatImage(e.target.value)}
                placeholder="uploads/categories/drink.png"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ترتيب الظهور (Order)</label>
              <Input
                type="number"
                value={catOrder}
                onChange={(e) => setCatOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCatDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={saveCategoryMutation.isPending}>
                {saveCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ الفئة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
