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
  Check,
  Clock,
  Edit2,
  FolderPlus,
  Gift,
  Image as ImageIcon,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function MartClient() {
  const queryClient = useQueryClient();
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "store" | "departments" | "products" | "flashDeals" | "sections" | "banners" | "crossSells" | "bundles"
  >("store");

  // Bundle Dialog State (Smart Combos)
  const [isBundleDialogOpen, setIsBundleDialogOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState<any>(null);
  const [bundleTitleAr, setBundleTitleAr] = useState("");
  const [bundleTitleEn, setBundleTitleEn] = useState("");
  const [bundleDescAr, setBundleDescAr] = useState("");
  const [bundleDescEn, setBundleDescEn] = useState("");
  const [bundlePricingMode, setBundlePricingMode] = useState<"FIXED" | "DYNAMIC">("FIXED");
  const [bundlePriceBefore, setBundlePriceBefore] = useState("");
  const [bundlePriceAfter, setBundlePriceAfter] = useState("");
  const [bundleIsActive, setBundleIsActive] = useState(true);
  const [bundleSelectedProductIds, setBundleSelectedProductIds] = useState<number[]>([]);
  const [bundleFreeProductIds, setBundleFreeProductIds] = useState<number[]>([]);
  const [bundleImageFile, setBundleImageFile] = useState<File | null>(null);
  const [bundleImagePreview, setBundleImagePreview] = useState("");
  const [bundleProductSearch, setBundleProductSearch] = useState("");

  // Department Dialog State
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [parentDeptIdForSub, setParentDeptIdForSub] = useState<number | null>(null);
  const [deptNameAr, setDeptNameAr] = useState("");
  const [deptNameEn, setDeptNameEn] = useState("");
  const [deptImage, setDeptImage] = useState("");
  const [deptOrder, setDeptOrder] = useState("0");

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
  const [prodBarcode, setProdBarcode] = useState("");
  const [prodUnit, setProdUnit] = useState("قطعة");
  const [prodUnitValue, setProdUnitValue] = useState("1");
  const [prodStock, setProdStock] = useState("100");
  const [prodMinAlert, setProdMinAlert] = useState("5");
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("ALL");

  // Flash Deal Dialog State
  const [isFlashDialogOpen, setIsFlashDialogOpen] = useState(false);
  const [flashServiceId, setFlashServiceId] = useState("");
  const [flashDiscount, setFlashDiscount] = useState("20");
  const [flashEndsAt, setFlashEndsAt] = useState("");
  const [flashTitleAr, setFlashTitleAr] = useState("عرض خاص لفترة محدودة");

  // Section Dialog State
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [sectionTitleAr, setSectionTitleAr] = useState("");
  const [sectionTitleEn, setSectionTitleEn] = useState("");
  const [sectionOrder, setSectionOrder] = useState("0");
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [addItemServiceId, setAddItemServiceId] = useState("");

  // Banner Dialog State
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);
  const [bannerNameAr, setBannerNameAr] = useState("");
  const [bannerNameEn, setBannerNameEn] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerCategoryId, setBannerCategoryId] = useState("");

  // Cross-Sell ("نسيت حاجة معاك؟") State
  const [isCrossSellDialogOpen, setIsCrossSellDialogOpen] = useState(false);
  const [crossSellServiceId, setCrossSellServiceId] = useState("");
  const [crossSellDisplayOrder, setCrossSellDisplayOrder] = useState("0");
  const [enableCrossSellState, setEnableCrossSellState] = useState(true);
  const [enableSubstitutionPolicyState, setEnableSubstitutionPolicyState] = useState(true);
  const [crossSellTitleAr, setCrossSellTitleAr] = useState("نسيت حاجة معاك؟");
  const [crossSellTitleEn, setCrossSellTitleEn] = useState("Forgot something?");
  const [crossSellMaxPriceState, setCrossSellMaxPriceState] = useState("");

  // Store Settings Form State
  const [martNameAr, setMartNameAr] = useState("مكانك مارت");
  const [martNameEn, setMartNameEn] = useState("Makanak Mart");
  const [martLogo, setMartLogo] = useState("");
  const [martCover, setMartCover] = useState("");
  const [martPhone, setMartPhone] = useState("01000000000");
  const [martPrepTime, setMartPrepTime] = useState(10);
  const [martDeliveryMin, setMartDeliveryMin] = useState(15);
  const [martDeliveryMax, setMartDeliveryMax] = useState(25);
  const [martMinOrder, setMartMinOrder] = useState(50);
  const [martFreeDeliveryThreshold, setMartFreeDeliveryThreshold] = useState(200);
  const [martIsActive, setMartIsActive] = useState(true);

  // 1. Fetch Cities
  const { data: citiesResponse } = useQuery({
    queryKey: ["mart-cities"],
    queryFn: () =>
      fetchHelper({
        endPoint: "cities" as any,
        method: "GET",
      }),
  });

  const cities = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];

  useEffect(() => {
    if (cities.length > 0 && !selectedCityId) {
      setSelectedCityId(String(cities[0].id));
    }
  }, [cities, selectedCityId]);

  // 2. Fetch Mart Stores List
  const {
    data: martsResponse,
    isLoading: isLoadingMarts,
    refetch: refetchMarts,
  } = useQuery({
    queryKey: ["mart-admin-list", selectedCityId],
    queryFn: () =>
      fetchHelper({
        endPoint: "mart/admin/list" as any,
        method: "GET",
      }),
  });

  const allMarts = Array.isArray(martsResponse?.data) ? martsResponse.data : [];

  const currentMart = allMarts.find(
    (m: any) => String(m.cityId) === String(selectedCityId)
  ) || null;

  // Clone Catalog State & Mutation
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false);
  const [cloneSourceStoreId, setCloneSourceStoreId] = useState<string>("");
  const [cloneTargetCityId, setCloneTargetCityId] = useState<string>("");
  const [clonePriceMultiplier, setClonePriceMultiplier] = useState<string>("1.0");

  const cloneMartCatalogMutation = useMutation({
    mutationFn: (body: { sourceStoreId: number; targetCityId: number; priceMultiplier?: number }) =>
      fetchHelper({
        endPoint: "mart/admin/clone-catalog" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res: any) => {
      if (res.success || res.data) {
        toast.success("تم استنساخ كتالوج مكانك مارت بنجاح إلى المدينة المحددة!");
        setIsCloneDialogOpen(false);
        refetchMarts();
        if (cloneTargetCityId) {
          setSelectedCityId(String(cloneTargetCityId));
        }
      } else {
        toast.error(res.message || "فشل استنساخ الكتالوج");
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || "حدث خطأ أثناء استنساخ الكتالوج");
    },
  });

  const handleOpenCloneDialog = (sourceId?: number, targetId?: string) => {
    const defaultSource = sourceId
      ? String(sourceId)
      : currentMart?.id
      ? String(currentMart.id)
      : allMarts[0]?.id
      ? String(allMarts[0].id)
      : "";
    setCloneSourceStoreId(defaultSource);
    setCloneTargetCityId(targetId || selectedCityId || "");
    setClonePriceMultiplier("1.0");
    setIsCloneDialogOpen(true);
  };

  useEffect(() => {
    if (currentMart) {
      const name = currentMart.name;
      setMartNameAr(typeof name === "object" ? name.ar || "مكانك مارت" : name || "مكانك مارت");
      setMartNameEn(typeof name === "object" ? name.en || "Makanak Mart" : name || "Makanak Mart");
      setMartLogo(currentMart.logo || "");
      setMartCover(currentMart.cover || "");
      setMartPhone(currentMart.branches?.[0]?.phone || "01000000000");
      setMartPrepTime(currentMart.prepTimeMinutes ?? 10);
      setMartDeliveryMin(currentMart.deliveryTimeMinMinutes ?? 15);
      setMartDeliveryMax(currentMart.deliveryTimeMaxMinutes ?? 25);
      setMartMinOrder(currentMart.minOrderAmount ?? 50);
      setMartFreeDeliveryThreshold(currentMart.freeDeliveryThreshold ?? 200);
      setMartIsActive(!currentMart.isBlocked);
    } else {
      setMartNameAr("مكانك مارت");
      setMartNameEn("Makanak Mart");
      setMartLogo("");
      setMartCover("");
      setMartPhone("01000000000");
      setMartPrepTime(10);
      setMartDeliveryMin(15);
      setMartDeliveryMax(25);
      setMartMinOrder(50);
      setMartFreeDeliveryThreshold(200);
      setMartIsActive(true);
    }
  }, [currentMart]);

  // 3. Fetch Departments
  const {
    data: deptsResponse,
    isLoading: isLoadingDepts,
    refetch: refetchDepts,
  } = useQuery({
    queryKey: ["mart-admin-departments", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/departments/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const departments = Array.isArray(deptsResponse?.data) ? deptsResponse.data : [];

  // Flat list of all categories for dropdowns
  const flatCategoriesList: Array<{ id: number; name: string; isSub: boolean }> = [];
  departments.forEach((dept: any) => {
    const dName = typeof dept.name === "object" ? dept.name.ar || dept.name.en : dept.name;
    flatCategoriesList.push({ id: dept.id, name: dName, isSub: false });
    if (Array.isArray(dept.Children)) {
      dept.Children.forEach((sub: any) => {
        const sName = typeof sub.name === "object" ? sub.name.ar || sub.name.en : sub.name;
        flatCategoriesList.push({ id: sub.id, name: `↳ ${sName}`, isSub: true });
      });
    }
  });

  // 4. Fetch Products
  const {
    data: prodsResponse,
    isLoading: isLoadingProds,
    refetch: refetchProds,
  } = useQuery({
    queryKey: ["mart-admin-products", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/products/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const products = Array.isArray(prodsResponse?.data) ? prodsResponse.data : [];

  // 5. Fetch Flash Deals
  const {
    data: flashResponse,
    isLoading: isLoadingFlash,
    refetch: refetchFlash,
  } = useQuery({
    queryKey: ["mart-admin-flash-deals", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/flash-deals/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const flashDeals = Array.isArray(flashResponse?.data) ? flashResponse.data : [];

  // 6. Fetch Sections
  const {
    data: sectionsResponse,
    isLoading: isLoadingSections,
    refetch: refetchSections,
  } = useQuery({
    queryKey: ["mart-admin-sections", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/sections/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const sections = Array.isArray(sectionsResponse?.data) ? sectionsResponse.data : [];

  // 7. Fetch Banners
  const {
    data: bannersResponse,
    isLoading: isLoadingBanners,
    refetch: refetchBanners,
  } = useQuery({
    queryKey: ["mart-admin-banners", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/banners/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const banners = Array.isArray(bannersResponse?.data) ? bannersResponse.data : [];

  // 8. Fetch Cross-Sells ("نسيت حاجة معاك؟")
  const {
    data: crossSellsResponse,
    isLoading: isLoadingCrossSells,
    refetch: refetchCrossSells,
  } = useQuery({
    queryKey: ["mart-admin-cross-sells", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `mart/admin/cross-sells/${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const crossSellsData = Array.isArray(crossSellsResponse?.data?.items)
    ? crossSellsResponse.data.items
    : [];
  const crossSellSettings = crossSellsResponse?.data?.settings;

  useEffect(() => {
    if (crossSellSettings) {
      setEnableCrossSellState(crossSellSettings.enableCrossSell ?? true);
      setEnableSubstitutionPolicyState(crossSellSettings.enableSubstitutionPolicy ?? true);
      setCrossSellTitleAr(crossSellSettings.crossSellTitle?.ar || "نسيت حاجة معاك؟");
      setCrossSellTitleEn(crossSellSettings.crossSellTitle?.en || "Forgot something?");
      setCrossSellMaxPriceState(
        crossSellSettings.crossSellMaxPrice !== null && crossSellSettings.crossSellMaxPrice !== undefined
          ? String(crossSellSettings.crossSellMaxPrice)
          : ""
      );
    }
  }, [crossSellSettings]);

  // 9. Fetch Bundles / Combos
  const {
    data: bundlesResponse,
    isLoading: isLoadingBundles,
    refetch: refetchBundles,
  } = useQuery({
    queryKey: ["mart-admin-bundles", currentMart?.id],
    queryFn: () =>
      fetchHelper({
        endPoint: `bundles?storeId=${currentMart.id}` as any,
        method: "GET",
      }),
    enabled: !!currentMart?.id,
  });

  const bundles = Array.isArray(bundlesResponse?.data) ? bundlesResponse.data : [];

  // ─── Mutations ─────────────────────────────────────────────────────────────

  // Save Mart Store
  const saveMartMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "mart/admin/create-or-update" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تم حفظ إعدادات مكانك مارت بنجاح!");
        refetchMarts();
      } else {
        toast.error(res.message || "فشل في حفظ إعدادات مكانك مارت");
      }
    },
    onError: () => toast.error("حدث خطأ أثناء حفظ مكانك مارت"),
  });

  // Save Department / Subcategory
  const saveDeptMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingDept) {
        return fetchHelper({
          endPoint: `mart/admin/department/${editingDept.id}` as any,
          method: "PATCH",
          body,
        });
      }
      return fetchHelper({
        endPoint: "mart/admin/department" as any,
        method: "POST",
        body,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(editingDept ? "تم تحديث القسم بنجاح!" : "تمت إضافة القسم بنجاح!");
        setIsDeptDialogOpen(false);
        resetDeptForm();
        refetchDepts();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Delete Department
  const deleteDeptMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/department/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف القسم بنجاح");
      refetchDepts();
    },
  });

  // Save Product
  const saveProductMutation = useMutation({
    mutationFn: (body: any) => {
      if (editingProduct) {
        return fetchHelper({
          endPoint: `mart/admin/product/${editingProduct.id}` as any,
          method: "PATCH",
          body,
        });
      }
      return fetchHelper({
        endPoint: "mart/admin/product" as any,
        method: "POST",
        body,
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        toast.success(editingProduct ? "تم تحديث المنتج بنجاح!" : "تمت إضافة المنتج بنجاح!");
        setIsProductDialogOpen(false);
        resetProductForm();
        refetchProds();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Toggle Product Stock
  const toggleStockMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/product/${id}/toggle` as any,
        method: "PATCH",
      }),
    onSuccess: () => {
      toast.success("تم تغيير حالة توفر المنتج");
      refetchProds();
    },
  });

  // Delete Product
  const deleteProductMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/product/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      refetchProds();
    },
  });

  // Save Flash Deal
  const saveFlashDealMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "mart/admin/flash-deal" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تم إنشاء عرض الفلاش سيل بنجاح!");
        setIsFlashDialogOpen(false);
        refetchFlash();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Delete Flash Deal
  const deleteFlashDealMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/flash-deal/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف عرض الفلاش سيل");
      refetchFlash();
    },
  });

  // Save Section
  const saveSectionMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "mart/admin/section" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تم إنشاء الرف التفاعلي بنجاح!");
        setIsSectionDialogOpen(false);
        setSectionTitleAr("");
        setSectionTitleEn("");
        refetchSections();
      } else {
        toast.error(res.message || "حدث خطأ");
      }
    },
  });

  // Add Item to Section
  const addSectionItemMutation = useMutation({
    mutationFn: ({ sectionId, serviceId }: { sectionId: number; serviceId: number }) =>
      fetchHelper({
        endPoint: `mart/admin/section/${sectionId}/item` as any,
        method: "POST",
        body: { serviceId },
      }),
    onSuccess: () => {
      toast.success("تمت إضافة المنتج للرف بنجاح!");
      setIsAddItemDialogOpen(false);
      refetchSections();
    },
  });

  // Remove Item from Section
  const removeSectionItemMutation = useMutation({
    mutationFn: ({ sectionId, serviceId }: { sectionId: number; serviceId: number }) =>
      fetchHelper({
        endPoint: `mart/admin/section/${sectionId}/item/${serviceId}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف المنتج من الرف");
      refetchSections();
    },
  });

  // Delete Section
  const deleteSectionMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/section/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف الرف بنجاح");
      refetchSections();
    },
  });

  // Save Banner
  const saveBannerMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: "mart/admin/banner" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res) => {
      if (res.success) {
        toast.success("تمت إضافة بنر المارت بنجاح!");
        setIsBannerDialogOpen(false);
        setBannerNameAr("");
        setBannerNameEn("");
        setBannerImage("");
        setBannerCategoryId("");
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
        endPoint: `mart/admin/banner/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف البنر");
      refetchBanners();
    },
  });

  // Cross-Sell Mutations
  const addCrossSellMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: `mart/admin/cross-sells/${currentMart.id}` as any,
        method: "POST",
        body,
      }),
    onSuccess: () => {
      toast.success("تمت إضافة المنتج بنجاح إلى سيكشن نسيت حاجة معاك؟");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-cross-sells", currentMart?.id] });
      setIsCrossSellDialogOpen(false);
      setCrossSellServiceId("");
    },
    onError: () => toast.error("فشل إضافة المنتج"),
  });

  const removeCrossSellMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `mart/admin/cross-sells/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("تم حذف المنتج من السيكشن");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-cross-sells", currentMart?.id] });
    },
    onError: () => toast.error("فشل حذف المنتج"),
  });

  const updateCrossSellSettingsMutation = useMutation({
    mutationFn: (body: any) =>
      fetchHelper({
        endPoint: `mart/admin/cross-sells/${currentMart.id}/settings` as any,
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      toast.success("تم تحديث إعدادات سيكشن نسيت حاجة معاك؟ بنجاح");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-cross-sells", currentMart?.id] });
    },
    onError: () => toast.error("فشل تحديث الإعدادات"),
  });

  // ─── Bundle Mutations ───────────────────────────────────────────────────────
  const createBundleMutation = useMutation({
    mutationFn: (body: FormData) =>
      fetchHelper({
        endPoint: "bundles" as any,
        method: "POST",
        body,
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res.message || "حدث خطأ أثناء إنشاء الباقة");
        return;
      }
      toast.success("تم إنشاء الباقة الترويجية بنجاح");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-bundles", currentMart?.id] });
      setIsBundleDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.message || "فشل الاتصال بالخادم"),
  });

  const updateBundleMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: FormData }) =>
      fetchHelper({
        endPoint: `bundles/${id}` as any,
        method: "PATCH",
        body,
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res.message || "حدث خطأ أثناء تعديل الباقة");
        return;
      }
      toast.success("تم تعديل الباقة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-bundles", currentMart?.id] });
      setIsBundleDialogOpen(false);
    },
    onError: (err: any) => toast.error(err?.message || "فشل الاتصال بالخادم"),
  });

  const deleteBundleMutation = useMutation({
    mutationFn: (id: number) =>
      fetchHelper({
        endPoint: `bundles/${id}` as any,
        method: "DELETE",
      }),
    onSuccess: (res: any) => {
      if (res?.success === false) {
        toast.error(res.message || "حدث خطأ أثناء حذف الباقة");
        return;
      }
      toast.success("تم حذف الباقة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-bundles", currentMart?.id] });
    },
    onError: () => toast.error("فشل حذف الباقة"),
  });

  const toggleBundleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => {
      const fd = new FormData();
      fd.append("isActive", String(isActive));
      return fetchHelper({
        endPoint: `bundles/${id}` as any,
        method: "PATCH",
        body: fd,
      });
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة الباقة");
      queryClient.invalidateQueries({ queryKey: ["mart-admin-bundles", currentMart?.id] });
    },
  });

  const handleOpenBundleDialog = (bundle?: any) => {
    if (bundle) {
      setEditingBundle(bundle);
      const tAr = typeof bundle.title === "object" ? bundle.title.ar : bundle.title;
      const tEn = typeof bundle.title === "object" ? bundle.title.en : "";
      const dAr = typeof bundle.description === "object" ? bundle.description.ar : bundle.description;
      const dEn = typeof bundle.description === "object" ? bundle.description.en : "";
      setBundleTitleAr(tAr || "");
      setBundleTitleEn(tEn || "");
      setBundleDescAr(dAr || "");
      setBundleDescEn(dEn || "");
      setBundlePricingMode(bundle.pricingMode || "FIXED");
      setBundlePriceBefore(bundle.priceBeforeDiscount ? String(bundle.priceBeforeDiscount) : "");
      setBundlePriceAfter(bundle.priceAfterDiscount ? String(bundle.priceAfterDiscount) : "");
      setBundleIsActive(bundle.isActive ?? true);
      setBundleImagePreview(bundle.image || "");
      setBundleImageFile(null);
      setBundleProductSearch("");

      const paidIds: number[] = [];
      const freeIds: number[] = [];
      if (Array.isArray(bundle.ScopeServices)) {
        bundle.ScopeServices.forEach((ss: any) => {
          if (ss.role === "FREE") freeIds.push(ss.serviceId);
          else paidIds.push(ss.serviceId);
        });
      }
      setBundleSelectedProductIds(paidIds);
      setBundleFreeProductIds(freeIds);
    } else {
      setEditingBundle(null);
      setBundleTitleAr("");
      setBundleTitleEn("");
      setBundleDescAr("");
      setBundleDescEn("");
      setBundlePricingMode("FIXED");
      setBundlePriceBefore("");
      setBundlePriceAfter("");
      setBundleIsActive(true);
      setBundleImagePreview("");
      setBundleImageFile(null);
      setBundleSelectedProductIds([]);
      setBundleFreeProductIds([]);
      setBundleProductSearch("");
    }
    setIsBundleDialogOpen(true);
  };

  const handleSaveBundle = async () => {
    if (!currentMart?.id) return toast.error("لا يوجد متجر مارت محدد");
    if (!bundleTitleAr.trim()) {
      return toast.error("يرجى إدخال اسم الباقة بالعربية");
    }
    if (bundleSelectedProductIds.length === 0) {
      return toast.error("يرجى اختيار منتج واحد على الأقل مشمول في الباقة");
    }
    if (bundlePricingMode === "FIXED" && (!bundlePriceAfter || Number(bundlePriceAfter) <= 0)) {
      return toast.error("يرجى إدخال سعر الباقة بعد الخصم");
    }

    const body = new FormData();
    body.append("title", JSON.stringify({ ar: bundleTitleAr.trim(), en: (bundleTitleEn || bundleTitleAr).trim() }));
    body.append("description", JSON.stringify({ ar: bundleDescAr.trim(), en: (bundleDescEn || bundleDescAr).trim() }));
    body.append("storeId", String(currentMart.id));
    body.append("isActive", String(bundleIsActive));
    body.append("type", "BUY_X_GET_Y_FREE");
    body.append("pricingMode", bundlePricingMode);
    body.append("requiredPaidQuantity", "1");
    body.append("freeQuantity", "1");
    body.append("paidSizeRule", "ANY");
    body.append("freeSizeRule", "ANY");
    body.append("freeValueRule", "CAP_TO_CHEAPEST_PAID");
    body.append("paidCategoryIds", ",");
    body.append("freeCategoryIds", ",");

    if (bundlePricingMode === "FIXED") {
      if (bundlePriceBefore && Number(bundlePriceBefore) > 0) {
        body.append("priceBeforeDiscount", String(bundlePriceBefore));
      }
      if (bundlePriceAfter && Number(bundlePriceAfter) > 0) {
        body.append("priceAfterDiscount", String(bundlePriceAfter));
      }
    }

    if (bundleSelectedProductIds.length > 0) {
      bundleSelectedProductIds.forEach((id) => body.append("paidServiceIds", String(id)));
    } else {
      body.append("paidServiceIds", ",");
    }

    if (bundleFreeProductIds.length > 0) {
      bundleFreeProductIds.forEach((id) => body.append("freeServiceIds", String(id)));
    } else {
      body.append("freeServiceIds", ",");
    }

    if (bundleImageFile) {
      body.append("image", bundleImageFile);
    } else if (!editingBundle) {
      try {
        const resp = await fetch("/logo.png");
        if (resp.ok) {
          const blob = await resp.blob();
          body.append("image", new File([blob], "bundle.png", { type: "image/png" }));
        }
      } catch {}
    }

    if (editingBundle) {
      updateBundleMutation.mutate({ id: editingBundle.id, body });
    } else {
      createBundleMutation.mutate(body);
    }
  };

  // ─── Helpers & Form Resets ──────────────────────────────────────────────────

  const resetDeptForm = () => {
    setEditingDept(null);
    setParentDeptIdForSub(null);
    setDeptNameAr("");
    setDeptNameEn("");
    setDeptImage("");
    setDeptOrder("0");
  };

  const handleOpenCreateDept = (parentId?: number) => {
    resetDeptForm();
    if (parentId) setParentDeptIdForSub(parentId);
    setIsDeptDialogOpen(true);
  };

  const handleOpenEditDept = (dept: any) => {
    setEditingDept(dept);
    setParentDeptIdForSub(dept.parentId || null);
    const n = dept.name;
    setDeptNameAr(typeof n === "object" ? n.ar || "" : n || "");
    setDeptNameEn(typeof n === "object" ? n.en || "" : n || "");
    setDeptImage(dept.image || "");
    setDeptOrder(String(dept.order || 0));
    setIsDeptDialogOpen(true);
  };

  const handleSaveDeptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMart) return toast.error("يرجى اختيار وحفظ متجر المارت أولاً");
    if (!deptNameAr) return toast.error("اسم القسم بالعربي مطلوب");

    saveDeptMutation.mutate({
      storeId: currentMart.id,
      name: { ar: deptNameAr, en: deptNameEn || deptNameAr },
      image: deptImage || "uploads/mart-default-dept.png",
      parentId: parentDeptIdForSub || undefined,
      order: Number(deptOrder) || 0,
    });
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
    setProdBarcode("");
    setProdUnit("قطعة");
    setProdUnitValue("1");
    setProdStock("100");
    setProdMinAlert("5");
    setProdCategoryId("");
    setProdAvailable(true);
  };

  const handleOpenCreateProduct = () => {
    resetProductForm();
    if (flatCategoriesList.length > 0) {
      setProdCategoryId(String(flatCategoriesList[0].id));
    }
    setIsProductDialogOpen(true);
  };

  const handleOpenEditProduct = (prod: any) => {
    setEditingProduct(prod);
    const n = prod.name;
    const d = prod.description;
    setProdNameAr(typeof n === "object" ? n.ar || "" : n || "");
    setProdNameEn(typeof n === "object" ? n.en || "" : n || "");
    setProdDescAr(typeof d === "object" ? d.ar || "" : d || "");
    setProdDescEn(typeof d === "object" ? d.en || "" : d || "");
    setProdImage(prod.image || "");
    setProdPrice(String(prod.price || ""));
    setProdDiscountPrice(prod.priceAfterDiscount ? String(prod.priceAfterDiscount) : "");
    setProdBarcode(prod.barcode || "");
    setProdUnit(prod.unit || "قطعة");
    setProdUnitValue(prod.unitValue || "1");
    setProdStock(String(prod.stockQuantity ?? 100));
    setProdMinAlert(String(prod.minAlertStock ?? 5));
    setProdCategoryId(String(prod.categoryId || ""));
    setProdAvailable(prod.available ?? true);
    setIsProductDialogOpen(true);
  };

  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMart) return toast.error("يرجى اختيار وحفظ متجر المارت أولاً");
    if (!prodNameAr) return toast.error("اسم المنتج بالعربي مطلوب");
    if (!prodPrice) return toast.error("السعر مطلوب");
    if (!prodCategoryId) return toast.error("يرجى اختيار فئة المنتج");

    saveProductMutation.mutate({
      storeId: currentMart.id,
      categoryId: Number(prodCategoryId),
      name: { ar: prodNameAr, en: prodNameEn || prodNameAr },
      description: { ar: prodDescAr, en: prodDescEn },
      image: prodImage || "uploads/mart-default-product.png",
      price: Number(prodPrice),
      priceAfterDiscount: prodDiscountPrice ? Number(prodDiscountPrice) : undefined,
      barcode: prodBarcode || undefined,
      unit: prodUnit,
      unitValue: prodUnitValue,
      stockQuantity: Number(prodStock) || 0,
      minAlertStock: Number(prodMinAlert) || 5,
      available: prodAvailable,
    });
  };

  const handleSaveMartSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCityId) return toast.error("يرجى اختيار المدينة");

    saveMartMutation.mutate({
      cityId: Number(selectedCityId),
      name: { ar: martNameAr, en: martNameEn },
      logo: martLogo || "uploads/mart-logo.png",
      cover: martCover || "uploads/mart-cover.png",
      phone: martPhone,
      prepTimeMinutes: Number(martPrepTime),
      deliveryTimeMinMinutes: Number(martDeliveryMin),
      deliveryTimeMaxMinutes: Number(martDeliveryMax),
      minOrderAmount: Number(martMinOrder),
      freeDeliveryThreshold: Number(martFreeDeliveryThreshold),
      isActive: martIsActive,
    });
  };

  // Filtered Products
  const filteredProducts = products.filter((p: any) => {
    if (productCategoryFilter !== "ALL" && String(p.categoryId) !== productCategoryFilter) {
      return false;
    }
    if (productSearch) {
      const q = productSearch.toLowerCase();
      const nAr = (typeof p.name === "object" ? p.name.ar : p.name) || "";
      const nEn = (typeof p.name === "object" ? p.name.en : "") || "";
      const b = p.barcode || "";
      return (
        nAr.toLowerCase().includes(q) ||
        nEn.toLowerCase().includes(q) ||
        b.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* City Switcher & Header Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              مكانك مارت - السوبرماركت السريع
            </h2>
            <p className="text-xs text-gray-500">
              التحكم في المتجر المركزي والمخزون الحي والفئات وعروض الفلاش سيل
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
            المدينة:
          </span>
          <Select value={selectedCityId} onValueChange={setSelectedCityId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="اختر المدينة" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city: any) => (
                <SelectItem key={city.id} value={String(city.id)}>
                  {typeof city.name === "object" ? city.name.ar || city.name.en : city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenCloneDialog()}
            className="border-emerald-600/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-semibold flex items-center gap-1.5"
            disabled={allMarts.length === 0}
            title="استنساخ الكتالوج من أو إلى مدينة أخرى"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">استنساخ الكتالوج</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMarts();
              refetchDepts();
              refetchProds();
              refetchFlash();
              refetchSections();
              refetchBanners();
              refetchCrossSells();
              refetchBundles();
              toast.success("تم تحديث البيانات");
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-zinc-800 pb-1">
        {[
          { key: "store", label: "إعدادات المارت", icon: Store },
          { key: "departments", label: "الأقسام والفئات", icon: Layers },
          { key: "products", label: "المنتجات والمخزون الحي", icon: Package },
          { key: "flashDeals", label: "عروض الفلاش سيل", icon: Zap },
          { key: "sections", label: "الرفوف التفاعلية", icon: Sparkles },
          { key: "banners", label: "بنرات المارت", icon: ImageIcon },
          { key: "crossSells", label: "نسيت حاجة معاك؟", icon: ShoppingCart },
          { key: "bundles", label: "التجميعات والعروض (Combos)", icon: Gift },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                isSel
                  ? "border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: STORE SETTINGS */}
      {activeTab === "store" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Store className="h-4 w-4 text-emerald-600" />
              إعدادات مكانك مارت للمدينة المحددة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!currentMart && (
              <div className="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                  <Store className="h-5 w-5 flex-shrink-0" />
                  <p className="text-xs">
                    لا يوجد فرع مكانك مارت مسجل لهذه المدينة حالياً. يمكنك ملء النموذج أدناه لإنشاء الفرع، أو استنساخ الكتالوج بالكامل من فرع مدينة أخرى.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleOpenCloneDialog(allMarts[0]?.id, selectedCityId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 whitespace-nowrap text-xs"
                  disabled={allMarts.length === 0}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>استنساخ الكتالوج لهذه المدينة</span>
                </Button>
              </div>
            )}
            <form onSubmit={handleSaveMartSettings} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    الاسم بالعربي
                  </label>
                  <Input
                    value={martNameAr}
                    onChange={(e) => setMartNameAr(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    الاسم بالإنجليزي
                  </label>
                  <Input
                    value={martNameEn}
                    onChange={(e) => setMartNameEn(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    مسار الشعار (Logo)
                  </label>
                  <Input
                    value={martLogo}
                    onChange={(e) => setMartLogo(e.target.value)}
                    placeholder="uploads/mart-logo.png"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    مسار صورة الغلاف (Cover)
                  </label>
                  <Input
                    value={martCover}
                    onChange={(e) => setMartCover(e.target.value)}
                    placeholder="uploads/mart-cover.png"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    وقت التجهيز بالمخزن (بالدقائق)
                  </label>
                  <Input
                    type="number"
                    value={martPrepTime}
                    onChange={(e) => setMartPrepTime(Number(e.target.value))}
                    min={1}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    أدنى وقت توصيل (بالدقائق)
                  </label>
                  <Input
                    type="number"
                    value={martDeliveryMin}
                    onChange={(e) => setMartDeliveryMin(Number(e.target.value))}
                    min={5}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    أقصى وقت توصيل (بالدقائق)
                  </label>
                  <Input
                    type="number"
                    value={martDeliveryMax}
                    onChange={(e) => setMartDeliveryMax(Number(e.target.value))}
                    min={10}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    الحد الأدنى للطلب (جنيه)
                  </label>
                  <Input
                    type="number"
                    value={martMinOrder}
                    onChange={(e) => setMartMinOrder(Number(e.target.value))}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    الحد الأدنى للتوصيل المجاني (جنيه)
                  </label>
                  <Input
                    type="number"
                    value={martFreeDeliveryThreshold}
                    onChange={(e) => setMartFreeDeliveryThreshold(Number(e.target.value))}
                    min={0}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    هاتف المخزن / المارت
                  </label>
                  <Input
                    value={martPhone}
                    onChange={(e) => setMartPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    حالة مكانك مارت في هذه المدينة
                  </p>
                  <p className="text-xs text-gray-500">
                    عند التعطيل لن يظهر كارت مكانك مارت للمستخدمين في هذه المدينة
                  </p>
                </div>
                <Switch checked={martIsActive} onCheckedChange={setMartIsActive} />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveMartMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {saveMartMutation.isPending ? "جاري الحفظ..." : "حفظ إعدادات المارت"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2-8: Guard against unconfigured Mart store for selected city */}
      {!currentMart && activeTab !== "store" ? (
        <Card className="p-8 text-center border-dashed border-gray-200 dark:border-zinc-800">
          <Store className="h-10 w-10 mx-auto text-gray-400 mb-2" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            لم يتم إعداد مكانك مارت لهذه المدينة بعد
          </h3>
          <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
            يمكنك استنساخ كافة الأقسام والمنتجات والسكاشن تلقائياً من مدينة أخرى (مثل المحلة) أو ضبط بيانات المتجر يدوياً لتفعيل المارت في هذه المدينة.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="sm"
              onClick={() => handleOpenCloneDialog(allMarts[0]?.id, selectedCityId)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5"
              disabled={allMarts.length === 0}
            >
              <Sparkles className="h-4 w-4" />
              <span>استنساخ الكتالوج لهذه المدينة</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => setActiveTab("store")}>
              إعداد وتفعيل المتجر يدوياً
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* TAB 2: DEPARTMENTS & SUBCATEGORIES */}
      {activeTab === "departments" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              الأقسام الكبرى والفئات الفرعية
            </CardTitle>
            <Button
              size="sm"
              onClick={() => handleOpenCreateDept()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة قسم رئيسي
            </Button>
          </CardHeader>
          <CardContent>
            {departments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Layers className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد أقسام مضافة بعد لمكانك مارت</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenCreateDept()}
                  className="mt-4"
                >
                  إضافة أول قسم الآن
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {departments.map((dept: any) => {
                  const dName =
                    typeof dept.name === "object" ? dept.name.ar || dept.name.en : dept.name;
                  return (
                    <div
                      key={dept.id}
                      className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center font-bold text-lg">
                            {dept.image ? (
                              <img
                                src={dept.image}
                                alt={dName}
                                className="h-8 w-8 object-contain"
                              />
                            ) : (
                              <FolderPlus className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                              {dName}
                            </h3>
                            <p className="text-xs text-gray-500">
                              الترتيب: {dept.order} • الفئات الفرعية: {dept.Children?.length || 0}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenCreateDept(dept.id)}
                            className="text-xs flex items-center gap-1"
                          >
                            <FolderPlus className="h-3.5 w-3.5 text-emerald-600" />
                            إضافة فئة فرعية
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditDept(dept)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("هل أنت متأكد من حذف هذا القسم؟")) {
                                deleteDeptMutation.mutate(dept.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Subcategories list */}
                      {Array.isArray(dept.Children) && dept.Children.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-50 dark:border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {dept.Children.map((sub: any) => {
                            const sName =
                              typeof sub.name === "object"
                                ? sub.name.ar || sub.name.en
                                : sub.name;
                            return (
                              <div
                                key={sub.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/40 text-xs"
                              >
                                <span className="font-medium text-gray-800 dark:text-gray-200">
                                  ↳ {sName}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleOpenEditDept(sub)}
                                    className="p-1 text-gray-500 hover:text-gray-800"
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm("حذف هذه الفئة الفرعية؟")) {
                                        deleteDeptMutation.mutate(sub.id);
                                      }
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PRODUCTS & LIVE INVENTORY */}
      {activeTab === "products" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-600" />
              المنتجات والمخزون الحي ({products.length} صنف)
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleOpenCreateProduct}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                إضافة منتج جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="بحث باسم المنتج أو الباركود..."
                  className="pr-9"
                />
              </div>
              <Select
                value={productCategoryFilter}
                onValueChange={setProductCategoryFilter}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="تصفية حسب الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">جميع الفئات</SelectItem>
                  {flatCategoriesList.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد منتجات مطابقة</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-zinc-800">
                <table className="w-full text-sm text-right">
                  <thead className="bg-gray-50 dark:bg-zinc-800/60 text-xs font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">المنتج</th>
                      <th className="p-3">الفئة</th>
                      <th className="p-3">السعر</th>
                      <th className="p-3">الباركود</th>
                      <th className="p-3">الوحدة</th>
                      <th className="p-3">المخزون الحي</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {filteredProducts.map((prod: any) => {
                      const pName =
                        typeof prod.name === "object" ? prod.name.ar || prod.name.en : prod.name;
                      const isLowStock =
                        (prod.stockQuantity ?? 0) <= (prod.minAlertStock ?? 5);

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/30 transition-colors"
                        >
                          <td className="p-3 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-gray-100">
                              {prod.image ? (
                                <img
                                  src={prod.image}
                                  alt={pName}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {pName}
                              </p>
                              {prod.unitValue && (
                                <p className="text-xs text-gray-400">{prod.unitValue}</p>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-xs text-gray-500">
                            {prod.Category?.name?.ar || prod.Category?.name || "—"}
                          </td>
                          <td className="p-3 font-bold text-gray-900 dark:text-gray-100">
                            {prod.price} ج
                            {prod.priceAfterDiscount && (
                              <span className="block text-xs line-through text-gray-400 font-normal">
                                {prod.priceAfterDiscount} ج
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-xs font-mono text-gray-500">
                            {prod.barcode || "—"}
                          </td>
                          <td className="p-3 text-xs text-gray-600">
                            {prod.unit || "قطعة"}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                isLowStock
                                  ? "bg-red-50 text-red-600 border-red-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              }
                            >
                              {prod.stockQuantity ?? 0} {prod.unit || "قطعة"}
                              {isLowStock && " (وشك النفاد)"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Switch
                              checked={prod.available}
                              onCheckedChange={() => toggleStockMutation.mutate(prod.id)}
                            />
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditProduct(prod)}
                              >
                                <Edit2 className="h-4 w-4 text-gray-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("حذف هذا المنتج نهائياً من المارت؟")) {
                                    deleteProductMutation.mutate(prod.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 4: FLASH DEALS */}
      {activeTab === "flashDeals" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              عروض الفلاش سيل المؤقتة (مع مؤقت تنازلي حي)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                if (products.length === 0) return toast.error("أضف منتجات أولاً");
                setFlashServiceId(String(products[0].id));
                setIsFlashDialogOpen(true);
              }}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة عرض فلاش سيل
            </Button>
          </CardHeader>
          <CardContent>
            {flashDeals.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد عروض فلاش سيل نشطة حالياً</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {flashDeals.map((deal: any) => {
                  const s = deal.Service;
                  const sName = s?.name?.ar || s?.name || "منتج";
                  return (
                    <div
                      key={deal.id}
                      className="border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 bg-amber-50/30 dark:bg-amber-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-lg bg-white overflow-hidden p-1 border">
                          <img
                            src={s?.image}
                            alt={sName}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                            {sName}
                          </p>
                          <Badge className="bg-amber-500 text-white text-xs mt-1">
                            خصم {deal.discountPercentage}%
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("حذف هذا العرض؟")) {
                              deleteFlashDealMutation.mutate(deal.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                      <div className="mt-3 pt-2 border-t border-amber-100 text-xs text-gray-500 flex items-center justify-between">
                        <span>ينتهي: {new Date(deal.endsAt).toLocaleString("ar-EG")}</span>
                        <span>متاح: {deal.maxQuantity} قطعة</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 5: SECTIONS / MERCHANDISING SHELVES */}
      {activeTab === "sections" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              الرفوف التفاعلية في الواجهة (مثل الأكثر طلباً، الفطور الصباحي...)
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsSectionDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إنشاء رف جديد
            </Button>
          </CardHeader>
          <CardContent>
            {sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد رفوف تفاعلية مضافة بعد</p>
              </div>
            ) : (
              <div className="space-y-6">
                {sections.map((sec: any) => {
                  const sTitle =
                    typeof sec.title === "object" ? sec.title.ar || sec.title.en : sec.title;
                  return (
                    <div
                      key={sec.id}
                      className="border border-gray-100 dark:border-zinc-800 rounded-xl p-4 bg-white dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-gray-100">
                            {sTitle}
                          </h3>
                          <p className="text-xs text-gray-400">
                            الترتيب: {sec.order} • المنتجات المضافة: {sec.Items?.length || 0}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSectionId(sec.id);
                              if (products.length > 0) {
                                setAddItemServiceId(String(products[0].id));
                              }
                              setIsAddItemDialogOpen(true);
                            }}
                            className="text-xs flex items-center gap-1"
                          >
                            <Plus className="h-3.5 w-3.5 text-emerald-600" />
                            إضافة منتج للرف
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("حذف هذا الرف بالكامل؟")) {
                                deleteSectionMutation.mutate(sec.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>

                      {/* Items in section */}
                      {Array.isArray(sec.Items) && sec.Items.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                          {sec.Items.map((item: any) => {
                            const p = item.Service;
                            const pName = p?.name?.ar || p?.name || "صنف";
                            return (
                              <div
                                key={item.id}
                                className="relative group border rounded-lg p-2 bg-gray-50/50 text-center"
                              >
                                <img
                                  src={p?.image}
                                  alt={pName}
                                  className="h-12 w-12 object-contain mx-auto mb-1"
                                />
                                <p className="text-xs font-semibold truncate">{pName}</p>
                                <p className="text-xs text-emerald-600 font-bold">{p?.price} ج</p>
                                <button
                                  onClick={() =>
                                    removeSectionItemMutation.mutate({
                                      sectionId: sec.id,
                                      serviceId: item.serviceId,
                                    })
                                  }
                                  className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 py-2">
                          لم يتم ربط أي منتجات بهذا الرف حتى الآن
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: BANNERS */}
      {activeTab === "banners" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-emerald-600" />
              بنرات عروض وسلايدر المارت
            </CardTitle>
            <Button
              size="sm"
              onClick={() => setIsBannerDialogOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إضافة بنر جديد
            </Button>
          </CardHeader>
          <CardContent>
            {banners.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ImageIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد بنرات مضافة لمكانك مارت</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {banners.map((b: any) => {
                  const bName = typeof b.name === "object" ? b.name.ar || b.name.en : b.name;
                  return (
                    <div
                      key={b.id}
                      className="relative border rounded-xl overflow-hidden bg-white group"
                    >
                      <img
                        src={b.image}
                        alt={bName}
                        className="w-full h-36 object-cover"
                      />
                      <div className="p-3 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-sm">{bName}</p>
                          {b.Category && (
                            <p className="text-xs text-gray-400">
                              يوجه إلى: {b.Category.name?.ar || b.Category.name}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("حذف هذا البنر؟")) {
                              deleteBannerMutation.mutate(b.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 7: CROSS-SELLS ("نسيت حاجة معاك؟") */}
      {activeTab === "crossSells" && (
        <div className="space-y-6">
          {/* Card 1: Cross-Sell Settings */}
          <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-emerald-600" />
                <span>إعدادات سيكشن نسيت حاجة معاك؟ (Checkout Add-ons)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-100">
                    تفعيل السيكشن في السلة والشيك آوت
                  </p>
                  <p className="text-xs text-gray-500">
                    إظهار شريط المنتجات المقترحة السريعة للعميل قبل تأكيد الطلب
                  </p>
                </div>
                <Switch
                  checked={enableCrossSellState}
                  onCheckedChange={(val) => setEnableCrossSellState(val)}
                />
              </div>

              {/* Substitution Policy Switch */}
              <div className="flex items-center justify-between p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                <div>
                  <p className="font-bold text-sm text-blue-950 dark:text-blue-100 flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <span>سياسة استبدال المنتجات لو صنف خلص (Smart Substitution Policy)</span>
                  </p>
                  <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                    إتاحة خيارات (اتصل بيا / استبدله / احذفه) للعملاء في الشيك آوت عند نفاد أي صنف من المخزن
                  </p>
                </div>
                <Switch
                  checked={enableSubstitutionPolicyState}
                  onCheckedChange={(val) => setEnableSubstitutionPolicyState(val)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    عنوان السيكشن (عربي)
                  </label>
                  <Input
                    value={crossSellTitleAr}
                    onChange={(e) => setCrossSellTitleAr(e.target.value)}
                    placeholder="نسيت حاجة معاك؟"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    عنوان السيكشن (إنجليزي)
                  </label>
                  <Input
                    value={crossSellTitleEn}
                    onChange={(e) => setCrossSellTitleEn(e.target.value)}
                    placeholder="Forgot something?"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                  الحد الأقصى لسعر المنتجات التلقائية (جنيه) - اختياري
                </label>
                <Input
                  type="number"
                  value={crossSellMaxPriceState}
                  onChange={(e) => setCrossSellMaxPriceState(e.target.value)}
                  placeholder="مثال: 25 (لعرض المنتجات الأقل من 25 ج تلقائياً إذا لم توجد منتجات يدوية كافية)"
                  className="mt-1"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  إذا تركتها فارغة، سيتم عرض المنتجات اليدوية المحددة بالجدول أدناه فقط.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    updateCrossSellSettingsMutation.mutate({
                      enableCrossSell: enableCrossSellState,
                      enableSubstitutionPolicy: enableSubstitutionPolicyState,
                      crossSellTitle: {
                        ar: crossSellTitleAr || "نسيت حاجة معاك؟",
                        en: crossSellTitleEn || "Forgot something?",
                      },
                      crossSellMaxPrice: crossSellMaxPriceState
                        ? Number(crossSellMaxPriceState)
                        : null,
                    });
                  }}
                  disabled={updateCrossSellSettingsMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  حفظ إعدادات السيكشن
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Manual Cross-Sell Items */}
          <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-emerald-600" />
                <span>المنتجات المحددة يدوياً في السيكشن ({crossSellsData.length})</span>
              </CardTitle>
              <Button
                size="sm"
                onClick={() => setIsCrossSellDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                <Plus className="h-3.5 w-3.5 ml-1" />
                إضافة منتج للسيكشن
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingCrossSells ? (
                <div className="py-8 text-center text-sm text-gray-500">جاري التحميل...</div>
              ) : crossSellsData.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  لا توجد منتجات محددة يدوياً حالياً. يمكنك إضافة شوكولاتات صغيرة، لبان، مناديل، أو استخدام سقف السعر التلقائي.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {crossSellsData.map((item: any) => {
                    const svc = item.Service;
                    if (!svc) return null;
                    const price = svc.priceAfterDiscount || svc.price;
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-zinc-800"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-zinc-700">
                            {svc.image ? (
                              <img
                                src={svc.image.startsWith("http") ? svc.image : `/uploads/${svc.image}`}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Package className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-gray-900 dark:text-gray-100 line-clamp-1">
                              {typeof svc.name === "object" ? svc.name?.ar : svc.name}
                            </p>
                            <p className="text-xs font-semibold text-emerald-600">
                              {price} ج
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeCrossSellMutation.mutate(item.id)}
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 8: SMART BUNDLES & COMBOS */}
      {activeTab === "bundles" && (
        <Card className="border-gray-100 dark:border-zinc-800 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Gift className="h-4 w-4 text-emerald-600" />
                <span>عروض وتجميعات التوفير الذكية (Smart Combos & Bundles)</span>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                باقات مجمعة مجهزة للعميل في واجهة المارت بخصم خاص وإضافة سريعة للسلة بنقرة واحدة
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => handleOpenBundleDialog()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              إنشاء باقة / عرض جديد
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingBundles ? (
              <div className="text-center py-12 text-gray-500">جاري تحميل الباقات والعروض...</div>
            ) : bundles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Gift className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>لا توجد باقات أو تجميعات ذكية مضافة بعد</p>
                <p className="text-xs text-gray-400 mt-1">
                  أنشئ باقات تجميعية مثل: "باقة الفطور العائلي"، "عرض التوفير الأسبوعي"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bundles.map((bundle: any) => {
                  const title =
                    typeof bundle.title === "object"
                      ? bundle.title.ar || bundle.title.en
                      : bundle.title;
                  const desc =
                    typeof bundle.description === "object"
                      ? bundle.description.ar || bundle.description.en
                      : bundle.description;
                  const paidItems =
                    bundle.ScopeServices?.filter((ss: any) => ss.role === "PAID") || [];
                  const freeItems =
                    bundle.ScopeServices?.filter((ss: any) => ss.role === "FREE") || [];
                  const savings =
                    bundle.priceBeforeDiscount && bundle.priceAfterDiscount
                      ? bundle.priceBeforeDiscount - bundle.priceAfterDiscount
                      : 0;

                  return (
                    <div
                      key={bundle.id}
                      className={`border rounded-xl p-4 transition-all flex flex-col justify-between ${
                        bundle.isActive
                          ? "border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10"
                          : "border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 opacity-75"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-lg bg-white overflow-hidden p-1 border flex items-center justify-center shrink-0">
                              {bundle.image ? (
                                <img
                                  src={
                                    bundle.image.startsWith("http")
                                      ? bundle.image
                                      : `/uploads/${bundle.image}`
                                  }
                                  alt={title}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Gift className="h-6 w-6 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
                                {title}
                              </h4>
                              {desc && (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{desc}</p>
                              )}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {bundle.pricingMode === "FIXED" ? (
                                  <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">
                                    سعر باقة: {bundle.priceAfterDiscount ?? bundle.priceBeforeDiscount} ج
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    سعر ديناميكي
                                  </Badge>
                                )}
                                {savings > 0 && (
                                  <Badge className="bg-rose-500 text-white text-[10px] px-1.5 py-0">
                                    وفر {savings} ج
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-emerald-600"
                              onClick={() => handleOpenBundleDialog(bundle)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-500 hover:text-rose-600"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف باقة "${title}"؟`)) {
                                  deleteBundleMutation.mutate(bundle.id);
                                }
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Included Items Preview */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-zinc-800 text-xs">
                          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center justify-between">
                            <span>المنتجات المشمولة ({paidItems.length}):</span>
                            <span className="text-[11px] text-gray-400">
                              {freeItems.length > 0 && `+ ${freeItems.length} مجاناً`}
                            </span>
                          </p>
                          <div className="space-y-1 max-h-24 overflow-y-auto">
                            {paidItems.map((ss: any, idx: number) => {
                              const pName =
                                typeof ss.Service?.name === "object"
                                  ? ss.Service?.name?.ar || ss.Service?.name?.en
                                  : ss.Service?.name || `منتج #${ss.serviceId}`;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between text-[11px] bg-white/70 dark:bg-zinc-800/50 px-2 py-1 rounded"
                                >
                                  <span className="truncate">{pName}</span>
                                  <span className="font-mono text-gray-500 font-bold shrink-0">
                                    {ss.Service?.price ? `${ss.Service.price} ج` : ""}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Active Toggle Footer */}
                      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-xs text-gray-500 font-medium">
                          {bundle.isActive ? "نشطة ومعروضة للعملاء" : "معطلة مؤقتاً"}
                        </span>
                        <Switch
                          checked={bundle.isActive}
                          onCheckedChange={(checked) =>
                            toggleBundleActiveMutation.mutate({ id: bundle.id, isActive: checked })
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
        </>
      )}

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* Category / Subcategory Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingDept
                ? "تعديل القسم"
                : parentDeptIdForSub
                ? "إضافة فئة فرعية"
                : "إضافة قسم رئيسي"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDeptSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold">الاسم بالعربي</label>
              <Input
                value={deptNameAr}
                onChange={(e) => setDeptNameAr(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">الاسم بالإنجليزي</label>
              <Input
                value={deptNameEn}
                onChange={(e) => setDeptNameEn(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">مسار الصورة / الأيقونة</label>
              <Input
                value={deptImage}
                onChange={(e) => setDeptImage(e.target.value)}
                placeholder="uploads/dept-icon.png"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">الترتيب (Order)</label>
              <Input
                type="number"
                value={deptOrder}
                onChange={(e) => setDeptOrder(e.target.value)}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                حفظ
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "تعديل المنتج" : "إضافة منتج جديد لمكانك مارت"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProductSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">اسم المنتج بالعربي</label>
                <Input
                  value={prodNameAr}
                  onChange={(e) => setProdNameAr(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">الاسم بالإنجليزي</label>
                <Input
                  value={prodNameEn}
                  onChange={(e) => setProdNameEn(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">الفئة التابع لها</label>
              <Select value={prodCategoryId} onValueChange={setProdCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {flatCategoriesList.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">السعر الحالي (جنيه)</label>
                <Input
                  type="number"
                  step="0.5"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">سعر الخصم / السعر القديم</label>
                <Input
                  type="number"
                  step="0.5"
                  value={prodDiscountPrice}
                  onChange={(e) => setProdDiscountPrice(e.target.value)}
                  placeholder="اختياري"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold">الباركود</label>
                <Input
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  placeholder="6221000..."
                  className="mt-1 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">الوحدة</label>
                <Input
                  value={prodUnit}
                  onChange={(e) => setProdUnit(e.target.value)}
                  placeholder="كجم / لتر / قطعة"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">قيمة الوحدة</label>
                <Input
                  value={prodUnitValue}
                  onChange={(e) => setProdUnitValue(e.target.value)}
                  placeholder="1 لتر / 500 جم"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">الكمية في المخزن (المخزون الحي)</label>
                <Input
                  type="number"
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">تنبيه انخفاض المخزون عند</label>
                <Input
                  type="number"
                  value={prodMinAlert}
                  onChange={(e) => setProdMinAlert(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold">مسار صورة المنتج</label>
              <Input
                value={prodImage}
                onChange={(e) => setProdImage(e.target.value)}
                placeholder="uploads/product.png"
                className="mt-1"
              />
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-gray-50">
              <span className="text-xs font-semibold">متاح للطلب الفوري في التطبيق</span>
              <Switch checked={prodAvailable} onCheckedChange={setProdAvailable} />
            </div>

            <DialogFooter>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                حفظ المنتج
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Flash Deal Dialog */}
      <Dialog open={isFlashDialogOpen} onOpenChange={setIsFlashDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>إضافة عرض فلاش سيل مؤقت</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentMart || !flashServiceId || !flashEndsAt) {
                return toast.error("يرجى ملء جميع البيانات");
              }
              saveFlashDealMutation.mutate({
                storeId: currentMart.id,
                serviceId: Number(flashServiceId),
                discountPercentage: Number(flashDiscount),
                endsAt: new Date(flashEndsAt).toISOString(),
                title: { ar: flashTitleAr, en: flashTitleAr },
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold">اختر المنتج</label>
              <Select value={flashServiceId} onValueChange={setFlashServiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {typeof p.name === "object" ? p.name.ar || p.name.en : p.name} ({p.price} ج)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold">نسبة الخصم (%)</label>
              <Input
                type="number"
                value={flashDiscount}
                onChange={(e) => setFlashDiscount(e.target.value)}
                min={1}
                max={99}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">تاريخ ووقت انتهاء العرض</label>
              <Input
                type="datetime-local"
                value={flashEndsAt}
                onChange={(e) => setFlashEndsAt(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">
                إنشاء العرض
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>إنشاء رف تفاعلي في الواجهة</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentMart || !sectionTitleAr) return toast.error("عنوان الرف مطلوب");
              saveSectionMutation.mutate({
                storeId: currentMart.id,
                title: { ar: sectionTitleAr, en: sectionTitleEn || sectionTitleAr },
                order: Number(sectionOrder) || 0,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold">عنوان الرف بالعربي (مثلاً: الأكثر طلباً)</label>
              <Input
                value={sectionTitleAr}
                onChange={(e) => setSectionTitleAr(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">عنوان الرف بالإنجليزي</label>
              <Input
                value={sectionTitleEn}
                onChange={(e) => setSectionTitleEn(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">الترتيب</label>
              <Input
                type="number"
                value={sectionOrder}
                onChange={(e) => setSectionOrder(e.target.value)}
                className="mt-1"
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                إنشاء الرف
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Item to Section Dialog */}
      <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>إضافة منتج لهذا الرف</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold">اختر المنتج</label>
              <Select value={addItemServiceId} onValueChange={setAddItemServiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المنتج" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {typeof p.name === "object" ? p.name.ar || p.name.en : p.name} ({p.price} ج)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  if (!selectedSectionId || !addItemServiceId) return;
                  addSectionItemMutation.mutate({
                    sectionId: selectedSectionId,
                    serviceId: Number(addItemServiceId),
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                إضافة
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Banner Dialog */}
      <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>إضافة بنر ترويجي لمكانك مارت</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!currentMart || !bannerNameAr || !bannerImage) {
                return toast.error("يرجى ملء اسم البنر والصورة");
              }
              saveBannerMutation.mutate({
                storeId: currentMart.id,
                name: { ar: bannerNameAr, en: bannerNameEn || bannerNameAr },
                image: bannerImage,
                categoryId: bannerCategoryId ? Number(bannerCategoryId) : undefined,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-xs font-semibold">اسم / عنوان البنر</label>
              <Input
                value={bannerNameAr}
                onChange={(e) => setBannerNameAr(e.target.value)}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">مسار صورة البنر</label>
              <Input
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder="uploads/mart-banner.png"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold">القسم المستهدف عند الضغط (اختياري)</label>
              <Select value={bannerCategoryId} onValueChange={setBannerCategoryId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="بدون توجيه لقسم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون توجيه لقسم</SelectItem>
                  {flatCategoriesList.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                حفظ البنر
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: ADD CROSS-SELL ITEM */}
      <Dialog open={isCrossSellDialogOpen} onOpenChange={setIsCrossSellDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة منتج لسيكشن نسيت حاجة معاك؟</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                اختر المنتج من منتجات المارت
              </label>
              <Select value={crossSellServiceId} onValueChange={setCrossSellServiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر منتجاً..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {products.map((p: any) => {
                    const name = typeof p.name === "object" ? p.name?.ar : p.name;
                    const price = p.priceAfterDiscount || p.price;
                    return (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {name} ({price} ج)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                ترتيب العرض
              </label>
              <Input
                type="number"
                value={crossSellDisplayOrder}
                onChange={(e) => setCrossSellDisplayOrder(e.target.value)}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCrossSellDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={() => {
                if (!crossSellServiceId) {
                  toast.error("يرجى اختيار منتج");
                  return;
                }
                addCrossSellMutation.mutate({
                  serviceId: Number(crossSellServiceId),
                  displayOrder: Number(crossSellDisplayOrder || 0),
                });
              }}
              disabled={addCrossSellMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              إضافة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bundle Dialog (Smart Combos) */}
      <Dialog open={isBundleDialogOpen} onOpenChange={setIsBundleDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-emerald-600" />
              <span>
                {editingBundle ? "تعديل الباقة التجميعية" : "إنشاء باقة تجميعية ذكية للمارت"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title AR / EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">اسم الباقة (عربي) *</label>
                <Input
                  value={bundleTitleAr}
                  onChange={(e) => setBundleTitleAr(e.target.value)}
                  placeholder="مثال: باقة الفطور العائلي"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">اسم الباقة (إنجليزي)</label>
                <Input
                  value={bundleTitleEn}
                  onChange={(e) => setBundleTitleEn(e.target.value)}
                  placeholder="e.g. Family Breakfast Combo"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Description AR / EN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold">وصف الباقة (عربي)</label>
                <Input
                  value={bundleDescAr}
                  onChange={(e) => setBundleDescAr(e.target.value)}
                  placeholder="مثال: جبن + حليب + بيض + خبز طازج"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-semibold">وصف الباقة (إنجليزي)</label>
                <Input
                  value={bundleDescEn}
                  onChange={(e) => setBundleDescEn(e.target.value)}
                  placeholder="e.g. Cheese + Milk + Eggs + Bread"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Pricing Mode Selection */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl space-y-3 border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                    طريقة تسعير الباقة
                  </p>
                  <p className="text-[11px] text-gray-500">
                    حدد ما إذا كانت الباقة بسعر ثابت مخفض أو مجموع ديناميكي
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-1 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setBundlePricingMode("FIXED")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      bundlePricingMode === "FIXED"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    سعر ثابت مخفض
                  </button>
                  <button
                    type="button"
                    onClick={() => setBundlePricingMode("DYNAMIC")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      bundlePricingMode === "DYNAMIC"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    سعر ديناميكي
                  </button>
                </div>
              </div>

              {bundlePricingMode === "FIXED" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      السعر الفعلي للعميل بعد الخصم (ج) *
                    </label>
                    <Input
                      type="number"
                      value={bundlePriceAfter}
                      onChange={(e) => setBundlePriceAfter(e.target.value)}
                      placeholder="مثال: 150"
                      className="mt-1 font-bold border-emerald-300 focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                        السعر قبل الخصم (المرجعي)
                      </label>
                      {bundleSelectedProductIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const sum = bundleSelectedProductIds.reduce((acc, id) => {
                              const p = products.find((x: any) => x.id === id);
                              return acc + (p?.price || 0);
                            }, 0);
                            setBundlePriceBefore(String(sum));
                          }}
                          className="text-[10px] text-emerald-600 hover:underline font-semibold"
                        >
                          استخدم المجموع (
                          {bundleSelectedProductIds.reduce((acc, id) => {
                            const p = products.find((x: any) => x.id === id);
                            return acc + (p?.price || 0);
                          }, 0)}{" "}
                          ج)
                        </button>
                      )}
                    </div>
                    <Input
                      type="number"
                      value={bundlePriceBefore}
                      onChange={(e) => setBundlePriceBefore(e.target.value)}
                      placeholder="مثال: 200"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Product Selector for Bundle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    المنتجات المشمولة في الباقة * ({bundleSelectedProductIds.length} محددة)
                  </label>
                  <p className="text-[11px] text-gray-500">
                    اختر المنتجات التي يحصل عليها العميل داخل هذه الباقة
                  </p>
                </div>
                {bundleSelectedProductIds.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 h-7"
                    onClick={() => setBundleSelectedProductIds([])}
                  >
                    إلغاء تحديد الكل
                  </Button>
                )}
              </div>

              {/* Search input for products */}
              <div className="relative">
                <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input
                  value={bundleProductSearch}
                  onChange={(e) => setBundleProductSearch(e.target.value)}
                  placeholder="ابحث عن منتج لإضافته للباقة..."
                  className="pr-8 text-xs h-9"
                />
              </div>

              {/* Products list with checkboxes */}
              <div className="border border-gray-200 dark:border-zinc-800 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 bg-white dark:bg-zinc-950">
                {products
                  .filter((p: any) => {
                    const pName =
                      typeof p.name === "object" ? p.name.ar || p.name.en : p.name;
                    return pName
                      ?.toLowerCase()
                      .includes(bundleProductSearch.toLowerCase().trim());
                  })
                  .map((p: any) => {
                    const pName =
                      typeof p.name === "object" ? p.name.ar || p.name.en : p.name;
                    const isSelected = bundleSelectedProductIds.includes(p.id);

                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            setBundleSelectedProductIds(
                              bundleSelectedProductIds.filter((id) => id !== p.id)
                            );
                          } else {
                            setBundleSelectedProductIds([
                              ...bundleSelectedProductIds,
                              p.id,
                            ]);
                          }
                        }}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                            : "hover:bg-gray-50 dark:hover:bg-zinc-900 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <div className="h-7 w-7 rounded bg-white overflow-hidden p-0.5 border flex items-center justify-center shrink-0">
                            {p.image ? (
                              <img
                                src={
                                  p.image.startsWith("http")
                                    ? p.image
                                    : `/uploads/${p.image}`
                                }
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            ) : (
                              <Package className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                            {pName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-400">
                          {p.price} ج
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <label className="text-xs font-semibold">صورة الباقة الترويجية</label>
              <div className="flex items-center gap-3 mt-1.5">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setBundleImageFile(file);
                      setBundleImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-xs"
                />
                {bundleImagePreview && (
                  <div className="h-10 w-10 rounded border overflow-hidden shrink-0">
                    <img
                      src={
                        bundleImagePreview.startsWith("blob:") ||
                        bundleImagePreview.startsWith("http")
                          ? bundleImagePreview
                          : `/uploads/${bundleImagePreview}`
                      }
                      alt="preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  تفعيل وعرض الباقة في التطبيق فوراً
                </p>
                <p className="text-[11px] text-gray-500">
                  عند التفعيل ستظهر في واجهة المارت للعملاء للشراء بنقرة واحدة
                </p>
              </div>
              <Switch checked={bundleIsActive} onCheckedChange={setBundleIsActive} />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBundleDialogOpen(false)}
              disabled={createBundleMutation.isPending || updateBundleMutation.isPending}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveBundle}
              disabled={createBundleMutation.isPending || updateBundleMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {createBundleMutation.isPending || updateBundleMutation.isPending
                ? "جاري الحفظ..."
                : editingBundle
                ? "تعديل الباقة"
                : "إنشاء الباقة الترويجية"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CLONE MART CATALOG DIALOG ── */}
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span>استنساخ كتالوج مكانك مارت لمدينة أخرى</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-xs text-gray-500">
              يقوم هذا الإجراء بنسخ كافة الأقسام الرئيسية والفرعية، والمنتجات، وصورها، ورفوف العرض التفاعلية من المتجر المصدري إلى المدينة المستهدفة لتوفير عناء الإدخال اليدوي مع الحفاظ التام على استقلالية الأسعار والمخزون لكل مدينة.
            </p>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                المتجر المصدر (Source Mart)
              </label>
              <Select value={cloneSourceStoreId} onValueChange={setCloneSourceStoreId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر فرع المارت المصدر" />
                </SelectTrigger>
                <SelectContent>
                  {allMarts.map((m: any) => {
                    const cName = m.city?.name
                      ? (typeof m.city.name === "object" ? m.city.name.ar || m.city.name.en : m.city.name)
                      : `مدينة #${m.cityId}`;
                    const mName = typeof m.name === "object" ? m.name.ar || m.name.en : m.name;
                    return (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {mName} ({cName})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                المدينة المستهدفة (Target City)
              </label>
              <Select value={cloneTargetCityId} onValueChange={setCloneTargetCityId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="اختر المدينة المستهدفة" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city: any) => (
                    <SelectItem key={city.id} value={String(city.id)}>
                      {typeof city.name === "object" ? city.name.ar || city.name.en : city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                معامل تعديل الأسعار (اختياري)
              </label>
              <Input
                type="number"
                step="0.05"
                min="0.1"
                value={clonePriceMultiplier}
                onChange={(e) => setClonePriceMultiplier(e.target.value)}
                placeholder="1.0"
                className="mt-1"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                القيمة 1.0 تعني نفس الأسعار تماماً. القيمة 1.1 تعني زيادة 10% لأسعار المدينة المستهدفة.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCloneDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={cloneMartCatalogMutation.isPending || !cloneSourceStoreId || !cloneTargetCityId}
              onClick={() => {
                cloneMartCatalogMutation.mutate({
                  sourceStoreId: Number(cloneSourceStoreId),
                  targetCityId: Number(cloneTargetCityId),
                  priceMultiplier: Number(clonePriceMultiplier) || 1.0,
                });
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {cloneMartCatalogMutation.isPending ? "جاري الاستنساخ..." : "بدء استنساخ المارت"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
