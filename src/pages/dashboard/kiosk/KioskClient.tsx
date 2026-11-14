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
  FolderPlus,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  Store,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function KioskClient() {
  const queryClient = useQueryClient();
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"store" | "categories" | "products" | "banners">("categories");

  // Category Dialog State
  const [isCatDialogOpen, setIsCatDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [parentCategoryIdForSub, setParentCategoryIdForSub] = useState<number | null>(null);
  const [catNameAr, setCatNameAr] = useState("");
  const [catNameEn, setCatNameEn] = useState("");
  const [catImage, setCatImage] = useState("");
  const [catOrder, setCatOrder] = useState("0");

  // Product Dialog State
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [prodNameAr, setProdNameAr] = useState("");
  const [prodNameEn, setProdNameEn] = useState("");
  const [prodDescAr, setProdDescAr] = useState("");
  const [prodDescEn, setProdDescEn] = useState("");
  const [prodImage, setProdImage] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDiscountPrice, setProdDiscountPrice] = useState("");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");

  // Banner Dialog State
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerNameAr, setBannerNameAr] = useState("");
  const [bannerNameEn, setBannerNameEn] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerCategoryId, setBannerCategoryId] = useState("");

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

  // Flat list of all categories and subcategories for select dropdowns
  const allSelectableCategories: { id: number; name: string }[] = [];
  categories.forEach((cat) => {
    const mainName = cat.name?.ar || cat.name?.en || `فئة #${cat.id}`;
    allSelectableCategories.push({ id: cat.id, name: `[رئيسية] ${mainName}` });
    if (Array.isArray(cat.Children)) {
      cat.Children.forEach((sub: any) => {
        const subName = sub.name?.ar || sub.name?.en || `فرعية #${sub.id}`;
        allSelectableCategories.push({ id: sub.id, name: ` └─ ${subName}` });
      });
    }
  });

  // 4. Fetch Kiosk Products
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["kiosk-admin-products", currentKiosk?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `kiosk/admin/products/${currentKiosk.id}` as any,
      }),
    enabled: !!currentKiosk?.id && activeTab === "products",
  });

  const products: any[] = Array.isArray(productsResponse?.data)
    ? productsResponse.data
    : [];

  // 5. Fetch Kiosk Banners
  const {
    data: bannersResponse,
    isLoading: isBannersLoading,
    refetch: refetchBanners,
  } = useQuery({
    queryKey: ["kiosk-admin-banners", currentKiosk?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `kiosk/admin/banners/${currentKiosk.id}` as any,
      }),
    enabled: !!currentKiosk?.id && activeTab === "banners",
  });

  const banners: any[] = Array.isArray(bannersResponse?.data)
    ? bannersResponse.data
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

  // Save Product
  const saveProductMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingProduct) {
        return fetchHelper({
          endPoint: `kiosk/admin/product/${editingProduct.id}` as any,
          method: "PATCH",
          body,
        });
      }
      return fetchHelper({
        endPoint: "kiosk/admin/product" as any,
        method: "POST",
        body,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(editingProduct ? "تم تحديث المنتج بنجاح!" : "تمت إضافة المنتج بنجاح!");
        setIsProductDialogOpen(false);
        resetProductForm();
        refetchProducts();
      } else {
        toast.error(res.message || "حدث خطأ في حفظ المنتج");
      }
    },
  });

  // Toggle Product Availability
  const toggleProductMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `kiosk/admin/product/${id}/toggle` as any,
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("تم تحديث حالة توفر المنتج");
      refetchProducts();
    },
  });

  // Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `kiosk/admin/product/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      refetchProducts();
    },
  });

  // Save Banner
  const saveBannerMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "kiosk/admin/banner" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تمت إضافة البانر بنجاح!");
        setIsBannerDialogOpen(false);
        resetBannerForm();
        refetchBanners();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Delete Banner
  const deleteBannerMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `kiosk/admin/banner/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف البانر بنجاح");
      refetchBanners();
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
      toast.error("يرجى كتابة اسم الفئة بالعربية");
      return;
    }
    if (!currentKiosk?.id) {
      toast.error("يجب حفظ الكشك أولاً قبل إضافة فئات له");
      return;
    }

    saveCategoryMutation.mutate({
      storeId: currentKiosk.id,
      name: { ar: catNameAr, en: catNameEn || catNameAr },
      image: catImage || undefined,
      order: Number(catOrder) || 0,
      parentId: parentCategoryIdForSub || undefined,
    });
  };

  const openAddProduct = () => {
    resetProductForm();
    if (allSelectableCategories.length > 0) {
      setProdCategoryId(String(allSelectableCategories[0].id));
    }
    setIsProductDialogOpen(true);
  };

  const openEditProduct = (prod: any) => {
    setEditingProduct(prod);
    const name = typeof prod.name === "object" ? prod.name : {};
    const desc = typeof prod.description === "object" ? prod.description : {};
    setProdNameAr(name.ar || "");
    setProdNameEn(name.en || "");
    setProdDescAr(desc.ar || "");
    setProdDescEn(desc.en || "");
    setProdImage(prod.image || "");
    setProdPrice(String(prod.price || ""));
    setProdDiscountPrice(prod.priceAfterDiscount ? String(prod.priceAfterDiscount) : "");
    setProdCategoryId(String(prod.categoryId || ""));
    setProdAvailable(prod.available ?? true);
    setIsProductDialogOpen(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdNameAr("");
    setProdNameEn("");
    setProdDescAr("");
    setProdDescEn("");
    setProdImage("");
    setProdPrice("");
    setProdDiscountPrice("");
    setProdCategoryId("");
    setProdAvailable(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNameAr.trim() || !prodPrice || !prodCategoryId) {
      toast.error("يرجى إكمال الحقول الأساسية (الاسم، السعر، الفئة)");
      return;
    }

    saveProductMutation.mutate({
      storeId: currentKiosk.id,
      categoryId: Number(prodCategoryId),
      name: { ar: prodNameAr, en: prodNameEn || prodNameAr },
      description: { ar: prodDescAr, en: prodDescEn },
      image: prodImage || "uploads/product-default.png",
      price: Number(prodPrice),
      priceAfterDiscount: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
      available: prodAvailable,
    });
  };

  const resetBannerForm = () => {
    setBannerNameAr("");
    setBannerNameEn("");
    setBannerImage("");
    setBannerCategoryId("");
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerNameAr.trim() || !bannerImage.trim()) {
      toast.error("يرجى كتابة عنوان البانر ورابط الصورة");
      return;
    }

    saveBannerMutation.mutate({
      storeId: currentKiosk.id,
      name: { ar: bannerNameAr, en: bannerNameEn || bannerNameAr },
      image: bannerImage,
      categoryId: bannerCategoryId ? Number(bannerCategoryId) : undefined,
    });
  };

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const nameAr = p.name?.ar || "";
    const nameEn = p.name?.en || "";
    const matchesSearch =
      nameAr.toLowerCase().includes(productSearch.toLowerCase()) ||
      nameEn.toLowerCase().includes(productSearch.toLowerCase());

    const matchesCat =
      productCategoryFilter === "ALL" ||
      String(p.categoryId) === productCategoryFilter;

    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
            🏪
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <span>إدارة كشك مكانك</span>
              <Badge variant="outline" className="border-primary text-primary font-bold">
                تحكم شامل
              </Badge>
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-0.5">
              تحكم كامل في التوقيتات، الصور، الفئات، التصنيفات الفرعية، المنتجات، والبانرز
            </p>
          </div>
        </div>

        {/* City Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold whitespace-nowrap text-gray-700 dark:text-gray-300">
            المدينة:
          </label>
          <Select value={selectedCityId} onValueChange={setSelectedCityId}>
            <SelectTrigger className="w-[180px] bg-gray-50 dark:bg-gray-900 font-bold">
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {city.name?.ar || city.name?.en || city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── NAVIGATION TABS ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Button
          variant={activeTab === "categories" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("categories")}
          className="flex items-center gap-2 rounded-xl"
        >
          <Layers className="h-4 w-4" />
          <span>الفئات والـ Sub-categories ({categories.length})</span>
        </Button>
        <Button
          variant={activeTab === "products" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("products")}
          className="flex items-center gap-2 rounded-xl"
        >
          <Package className="h-4 w-4" />
          <span>منتجات الكشك والأسعار</span>
        </Button>
        <Button
          variant={activeTab === "banners" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("banners")}
          className="flex items-center gap-2 rounded-xl"
        >
          <ImageIcon className="h-4 w-4" />
          <span>بانرز وعروض الكشك</span>
        </Button>
        <Button
          variant={activeTab === "store" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab("store")}
          className="flex items-center gap-2 rounded-xl"
        >
          <Store className="h-4 w-4" />
          <span>إعدادات وتوقيتات الكشك</span>
        </Button>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════════
          TAB 1: KIOSK STORE SETUP & TIMINGS
      ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "store" && (
        <Card className="border-gray-200 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span>بيانات وتوقيتات كشك مكانك للمدينة المختارة</span>
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
                  <label className="text-sm font-medium">رابط غلاف الكشك (Cover Banner URL)</label>
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
                    عند التعطيل، يظهر الكشك مغلقاً للعملاء في التطبيق مع تنبيه
                  </p>
                </div>
                <Switch checked={isKioskActive} onCheckedChange={setIsKioskActive} />
              </div>

              <Button
                type="submit"
                disabled={saveKioskMutation.isPending}
                className="w-full md:w-auto mt-4"
              >
                {saveKioskMutation.isPending ? "جاري الحفظ..." : "حفظ إعدادات وتوقيتات الكشك"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          TAB 2: KIOSK CATEGORIES & SUB-CATEGORIES
      ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <div className="space-y-6">
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

            <Button
              size="sm"
              onClick={openAddMainCategory}
              disabled={!currentKiosk?.id}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة فئة رئيسية جديدة</span>
            </Button>
          </div>

          {!currentKiosk?.id ? (
            <Card className="p-8 text-center border-dashed">
              <Store className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                لم يتم إعداد الكشك لهذه المدينة بعد
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                يرجى الانتقال لتبويب "إعدادات وتوقيتات الكشك" لحفظ الكشك أولاً.
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
              {categories.map((cat: any) => {
                const nameAr = cat.name?.ar || cat.name?.en || "بدون اسم";
                const subCats = Array.isArray(cat.Children) ? cat.Children : [];

                return (
                  <Card key={cat.id} className="border-gray-200 dark:border-gray-700 overflow-hidden">
                    <CardHeader className="bg-gray-50/80 dark:bg-gray-800/50 py-3 px-4 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-6 bg-primary rounded-full" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-gray-900 dark:text-gray-100">
                                {nameAr}
                              </h3>
                              <Badge variant="secondary" className="text-xs font-semibold">
                                {subCats.length} تصنيف فرعي
                              </Badge>
                            </div>
                            <span className="text-xs text-gray-400">
                              ترتيب العرض: {cat.order || 0}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAddSubCategory(cat.id)}
                            className="h-8 text-xs flex items-center gap-1 text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <FolderPlus className="h-3.5 w-3.5" />
                            <span>إضافة Sub-category</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditCategory(cat)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف فئة "${nameAr}" وجميع تصنيفاتها الفرعية؟`)) {
                                deleteCategoryMutation.mutate(cat.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {/* Sub-categories */}
                    <CardContent className="p-4">
                      {subCats.length === 0 ? (
                        <div className="text-xs text-gray-400 py-2">
                          لا توجد تصنيفات فرعية مضافة تحت هذه الفئة بعد.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {subCats.map((sub: any) => {
                            const subNameAr = sub.name?.ar || sub.name?.en || "بدون اسم";
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400">└─</span>
                                  <div>
                                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                      {subNameAr}
                                    </p>
                                    <span className="text-[10px] text-gray-400">
                                      ترتيب: {sub.order || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => openEditCategory(sub)}
                                    className="h-7 w-7 p-0"
                                  >
                                    <Edit2 className="h-3.5 w-3.5 text-gray-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (confirm(`حذف التصنيف الفرعي "${subNameAr}"؟`)) {
                                        deleteCategoryMutation.mutate(sub.id);
                                      }
                                    }}
                                    className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
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

      {/* ════════════════════════════════════════════════════════════════════════════
          TAB 3: KIOSK PRODUCTS & PRICING
      ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <span>منتجات الكشك ({filteredProducts.length} منتج)</span>
              </h2>
              <p className="text-xs text-gray-500">
                إضافة وتعديل أسعار المنتجات والخصومات وحالة التوفر مباشرة
              </p>
            </div>

            <Button
              size="sm"
              onClick={openAddProduct}
              disabled={!currentKiosk?.id}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة منتج جديد للكشك</span>
            </Button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border">
            <div className="relative flex-1 w-full">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="ابحث بالاسم عن أي منتج في الكشك..."
                className="pr-9"
              />
            </div>
            <div className="w-full sm:w-60">
              <Select
                value={productCategoryFilter}
                onValueChange={setProductCategoryFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="فلترة حسب الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الفئات</SelectItem>
                  {allSelectableCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Table */}
          {isProductsLoading ? (
            <div className="py-12 text-center text-gray-500">جاري تحميل المنتجات...</div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Package className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                لا توجد منتجات مضافة للكشك حتى الآن
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                أضف أول منتج وحدد سعره وتصنيفه ليظهر للعملاء فوراً.
              </p>
              <Button size="sm" onClick={openAddProduct}>
                إضافة أول منتج للكشك
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const nameAr = p.name?.ar || p.name?.en || "منتج بدون اسم";
                const catName = p.Category?.name?.ar || p.Category?.name?.en || "غير محدد";
                const hasDiscount = p.priceAfterDiscount && p.priceAfterDiscount < p.price;

                return (
                  <Card key={p.id} className="border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col justify-between">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-lg overflow-hidden">
                            {p.image ? (
                              <img src={p.image.startsWith("http") ? p.image : `https://api.makanak-app.com/${p.image}`} alt={nameAr} className="w-full h-full object-cover" />
                            ) : (
                              "📦"
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100 line-clamp-1">
                              {nameAr}
                            </h4>
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {catName}
                            </span>
                          </div>
                        </div>

                        {/* Availability Switch */}
                        <div className="flex items-center gap-1.5" title="تبديل حالة التوفر">
                          <Switch
                            checked={p.available}
                            onCheckedChange={() => toggleProductMutation.mutate(p.id)}
                          />
                        </div>
                      </div>

                      {/* Pricing Info */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div>
                          {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through mr-1">
                              {p.price} ج.م
                            </span>
                          )}
                          <span className="text-base font-black text-primary">
                            {hasDiscount ? p.priceAfterDiscount : p.price} ج.م
                          </span>
                        </div>
                        {hasDiscount && (
                          <Badge variant="destructive" className="text-[10px]">
                            خصم {(p.price - p.priceAfterDiscount).toFixed(0)} ج.م
                          </Badge>
                        )}
                      </div>
                    </CardContent>

                    {/* Actions Footer */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 flex items-center justify-between border-t">
                      <span className="text-[11px] text-gray-400">
                        {p.available ? "✅ متوفر للطلب" : "❌ غير متوفر"}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditProduct(p)}
                          className="h-8 text-xs flex items-center gap-1"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          <span>تعديل</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المنتج "${nameAr}"؟`)) {
                              deleteProductMutation.mutate(p.id);
                            }
                          }}
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════════════
          TAB 4: KIOSK BANNERS & OFFERS
      ════════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "banners" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <span>بانرز وعروض الكشك الإعلانية ({banners.length})</span>
              </h2>
              <p className="text-xs text-gray-500">
                تظهر هذه البانرز داخل صفحة الكشك للمستخدمين لعرض الخصومات والعروض السريعة
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                resetBannerForm();
                setIsBannerDialogOpen(true);
              }}
              disabled={!currentKiosk?.id}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة بانر جديد للكشك</span>
            </Button>
          </div>

          {isBannersLoading ? (
            <div className="py-12 text-center text-gray-500">جاري تحميل البانرز...</div>
          ) : banners.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <ImageIcon className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">
                لا توجد بانرز إعلانية مضافة للكشك حتى الآن
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                أضف بانرات عروض ترويجية لتظهر أعلى منتجات الكشك.
              </p>
              <Button
                size="sm"
                onClick={() => {
                  resetBannerForm();
                  setIsBannerDialogOpen(true);
                }}
              >
                إضافة أول بانر للكشك
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => {
                const bannerName = b.name?.ar || b.name?.en || "بانر إعلاني";
                return (
                  <Card key={b.id} className="border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="h-32 bg-gray-100 relative">
                      <img
                        src={b.image.startsWith("http") ? b.image : `https://api.makanak-app.com/${b.image}`}
                        alt={bannerName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm">{bannerName}</h4>
                        {b.Category && (
                          <span className="text-xs text-gray-500">
                            مرتبط بفئة: {b.Category.name?.ar || b.Category.name?.en}
                          </span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (confirm(`حذف البانر "${bannerName}"؟`)) {
                            deleteBannerMutation.mutate(b.id);
                          }
                        }}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── DIALOG 1: ADD/EDIT CATEGORY ── */}
      <Dialog open={isCatDialogOpen} onOpenChange={setIsCatDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? "تعديل الفئة"
                : parentCategoryIdForSub
                ? "إضافة تصنيف فرعي (Sub-category)"
                : "إضافة فئة رئيسية جديدة"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700">اسم الفئة بالعربية *</label>
              <Input
                value={catNameAr}
                onChange={(e) => setCatNameAr(e.target.value)}
                placeholder="مثال: مشروبات، مقرمشات..."
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700">اسم الفئة بالإنجليزية</label>
              <Input
                value={catNameEn}
                onChange={(e) => setCatNameEn(e.target.value)}
                placeholder="Beverages, Snacks..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700">رابط صورة/أيقونة الفئة</label>
              <Input
                value={catImage}
                onChange={(e) => setCatImage(e.target.value)}
                placeholder="uploads/category.png"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700">ترتيب العرض (Order)</label>
              <Input
                type="number"
                value={catOrder}
                onChange={(e) => setCatOrder(e.target.value)}
                placeholder="0"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsCatDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveCategoryMutation.isPending}>
                {saveCategoryMutation.isPending ? "جاري الحفظ..." : "حفظ الفئة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 2: ADD/EDIT PRODUCT ── */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "تعديل منتج في الكشك" : "إضافة منتج جديد في الكشك"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">اسم المنتج بالعربية *</label>
                <Input
                  value={prodNameAr}
                  onChange={(e) => setProdNameAr(e.target.value)}
                  placeholder="شيبسي جبنة متبلة"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold">اسم المنتج بالإنجليزية</label>
                <Input
                  value={prodNameEn}
                  onChange={(e) => setProdNameEn(e.target.value)}
                  placeholder="Chips Cheese"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">الفئة أو الـ Sub-category *</label>
              <Select value={prodCategoryId} onValueChange={setProdCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة التابع لها المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {allSelectableCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold">السعر الأصلي (ج.م) *</label>
                <Input
                  type="number"
                  step="0.5"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="20"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold">السعر بعد الخصم (اختياري)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={prodDiscountPrice}
                  onChange={(e) => setProdDiscountPrice(e.target.value)}
                  placeholder="15"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold">رابط صورة المنتج (Image URL)</label>
              <Input
                value={prodImage}
                onChange={(e) => setProdImage(e.target.value)}
                placeholder="uploads/product.png"
              />
            </div>

            <div>
              <label className="text-xs font-bold">وصف المنتج (اختياري)</label>
              <Input
                value={prodDescAr}
                onChange={(e) => setProdDescAr(e.target.value)}
                placeholder="وصف مختصر للمنتج..."
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg border">
              <div>
                <p className="font-bold text-xs">توفر المنتج للطلب (In-Stock)</p>
                <p className="text-[11px] text-gray-500">عند إلغائه يظهر غير متاح في التطبيق</p>
              </div>
              <Switch checked={prodAvailable} onCheckedChange={setProdAvailable} />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveProductMutation.isPending}>
                {saveProductMutation.isPending ? "جاري الحفظ..." : "حفظ المنتج"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── DIALOG 3: ADD BANNER ── */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة بانر إعلاني لكشك مكانك</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBanner} className="space-y-3">
            <div>
              <label className="text-xs font-bold">عنوان البانر بالعربية *</label>
              <Input
                value={bannerNameAr}
                onChange={(e) => setBannerNameAr(e.target.value)}
                placeholder="عروض الصيف على المشروبات"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold">رابط صورة البانر *</label>
              <Input
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="uploads/banner.png"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold">ربط بفئة معينة (اختياري)</label>
              <Select value={bannerCategoryId} onValueChange={setBannerCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة عند الضغط على البانر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون فئة محددة</SelectItem>
                  {allSelectableCategories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-4">
              <Button type="button" variant="outline" onClick={() => setIsBannerDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveBannerMutation.isPending}>
                {saveBannerMutation.isPending ? "جاري الحفظ..." : "حفظ البانر"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
