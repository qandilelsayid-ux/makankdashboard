import { useEffect, useMemo, useState } from "react";
import { fetchHelper } from "@/api/fetch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocale, useTranslations } from "@/lib/i18n";
import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminHomeSection,
  getLocalizedText,
  HomeBannerActionType,
  HomeSectionBannerItem,
  HomeSectionType,
  moveArrayItem,
  resolveDashboardImageUrl,
  SECTION_TYPE_META,
} from "./homeBuilderUtils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSection: AdminHomeSection | null;
  cities: any[];
  onSaved: () => void;
}

export default function SectionEditorDialog({
  open,
  onOpenChange,
  editingSection,
  cities,
  onSaved,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [saving, setSaving] = useState(false);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingBannerIdx, setUploadingBannerIdx] = useState<number | null>(null);

  const [type, setType] = useState<HomeSectionType>("STORES");
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [subtitleAr, setSubtitleAr] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [cityId, setCityId] = useState<string>("ALL");
  const [isActive, setIsActive] = useState(true);
  const [headerBannerImage, setHeaderBannerImage] = useState<string>("");

  // Curated stores & products
  const [allStores, setAllStores] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [storeFilterId, setStoreFilterId] = useState<string>("ALL");
  const [itemSearch, setItemSearch] = useState("");

  const [selectedStores, setSelectedStores] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<HomeSectionBannerItem[]>([]);

  useEffect(() => {
    if (!open) return;

    if (editingSection) {
      setType(editingSection.type);
      setTitleAr(editingSection.title?.ar || "");
      setTitleEn(editingSection.title?.en || "");
      setSubtitleAr(editingSection.subtitle?.ar || "");
      setSubtitleEn(editingSection.subtitle?.en || "");
      setCityId(editingSection.cityId ? String(editingSection.cityId) : "ALL");
      setIsActive(editingSection.isActive);
      setHeaderBannerImage(editingSection.headerBannerImage || "");
      setSelectedStores(
        (editingSection.Stores || [])
          .map((item) => item.Store || { id: item.storeId, name: { ar: `#${item.storeId}` } })
          .filter(Boolean),
      );
      setSelectedProducts(
        (editingSection.Products || [])
          .map(
            (item) =>
              item.Service || { id: item.serviceId, name: { ar: `#${item.serviceId}` } },
          )
          .filter(Boolean),
      );
      setBanners(
        (editingSection.Banners || []).map((b) => ({
          id: b.id,
          image: b.image,
          actionType: b.actionType || "NONE",
          targetStoreId: b.targetStoreId ?? null,
          targetCategoryId: b.targetCategoryId ?? null,
          targetServiceId: b.targetServiceId ?? null,
          externalUrl: b.externalUrl ?? "",
          sortOrder: b.sortOrder,
        })),
      );
    } else {
      setType("STORES");
      setTitleAr("");
      setTitleEn("");
      setSubtitleAr("");
      setSubtitleEn("");
      setCityId("ALL");
      setIsActive(true);
      setHeaderBannerImage("");
      setSelectedStores([]);
      setSelectedProducts([]);
      setBanners([]);
    }
    setItemSearch("");
    setStoreFilterId("ALL");
  }, [open, editingSection]);

  // Lazy-load pickers data when dialog opens
  useEffect(() => {
    if (!open) return;
    let active = true;

    async function loadOptions() {
      const [storesRes, catsRes, servicesRes] = await Promise.all([
        fetchHelper({
          endPoint: ["stores"],
          method: "GET",
          params: { limit: 300 },
          redirectOnUnauthorized: false,
        }),
        fetchHelper({
          endPoint: ["categories"],
          method: "GET",
          params: { limit: 200 },
          redirectOnUnauthorized: false,
        }),
        fetchHelper({
          endPoint: ["services"],
          method: "GET",
          params: { limit: 300 },
          redirectOnUnauthorized: false,
        }),
      ]);
      if (!active) return;
      if (Array.isArray(storesRes?.data)) setAllStores(storesRes.data);
      if (Array.isArray(catsRes?.data)) setAllCategories(catsRes.data);
      if (Array.isArray(servicesRes?.data)) setAllServices(servicesRes.data);
    }

    loadOptions();
    return () => {
      active = false;
    };
  }, [open]);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await fetchHelper({
      endPoint: ["homeAdminUpload"],
      method: "POST",
      body: formData,
      redirectOnUnauthorized: false,
    });
    if (res?.success && res?.data?.image) {
      return res.data.image;
    }
    toast.error(res?.message || (isAr ? "فشل رفع الصورة" : "Image upload failed"));
    return null;
  };

  const handleHeaderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingHeader(true);
    const path = await uploadImageFile(file);
    setUploadingHeader(false);
    if (path) setHeaderBannerImage(path);
    e.target.value = "";
  };

  const handleBannerUpload = async (
    idx: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBannerIdx(idx);
    const path = await uploadImageFile(file);
    setUploadingBannerIdx(null);
    if (path) {
      setBanners((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, image: path } : item)),
      );
    }
    e.target.value = "";
  };

  const filteredAvailableStores = useMemo(() => {
    const selectedIds = new Set(selectedStores.map((s) => Number(s.id)));
    const q = itemSearch.trim().toLowerCase();
    return allStores.filter((s) => {
      if (selectedIds.has(Number(s.id))) return false;
      if (cityId !== "ALL" && s.cityId != null && Number(s.cityId) !== Number(cityId)) {
        return false;
      }
      if (!q) return true;
      return (
        getLocalizedText(s.name, "ar").toLowerCase().includes(q) ||
        getLocalizedText(s.name, "en").toLowerCase().includes(q) ||
        String(s.id).includes(q)
      );
    });
  }, [allStores, selectedStores, cityId, itemSearch]);

  const filteredAvailableProducts = useMemo(() => {
    const selectedIds = new Set(selectedProducts.map((p) => Number(p.id)));
    const q = itemSearch.trim().toLowerCase();
    return allServices.filter((svc) => {
      if (selectedIds.has(Number(svc.id))) return false;
      const svcStoreId = svc.storeId ?? svc.Store?.id;
      if (storeFilterId !== "ALL" && Number(svcStoreId) !== Number(storeFilterId)) {
        return false;
      }
      if (
        cityId !== "ALL" &&
        svc.Store?.cityId != null &&
        Number(svc.Store.cityId) !== Number(cityId)
      ) {
        return false;
      }
      if (!q) return true;
      return (
        getLocalizedText(svc.name, "ar").toLowerCase().includes(q) ||
        getLocalizedText(svc.name, "en").toLowerCase().includes(q) ||
        getLocalizedText(svc.Store?.name, "ar").toLowerCase().includes(q)
      );
    });
  }, [allServices, selectedProducts, storeFilterId, cityId, itemSearch]);

  const handleSave = async () => {
    if (!titleAr.trim() && !titleEn.trim()) {
      toast.error(isAr ? "اكتب عنوان القسم" : "Section title is required");
      return;
    }

    if (type === "BANNER" && banners.some((b) => !b.image)) {
      toast.error(isAr ? "ارفع كل صور البانر المختارة" : "All banner items need an image");
      return;
    }

    setSaving(true);
    const payload: Record<string, any> = {
      title: {
        ar: titleAr.trim() || titleEn.trim(),
        en: titleEn.trim() || titleAr.trim(),
      },
      subtitle:
        subtitleAr.trim() || subtitleEn.trim()
          ? { ar: subtitleAr.trim(), en: subtitleEn.trim() }
          : null,
      cityId: cityId === "ALL" ? null : Number(cityId),
      isActive,
      headerBannerImage: headerBannerImage || null,
    };

    if (!editingSection) {
      payload.type = type;
    }
    if (type === "STORES") {
      payload.storeIds = selectedStores.map((s) => Number(s.id));
    } else if (type === "PRODUCTS") {
      payload.productIds = selectedProducts.map((p) => Number(p.id));
    } else if (type === "BANNER") {
      payload.banners = banners.map((b, idx) => ({
        image: b.image,
        actionType: b.actionType,
        targetStoreId: b.actionType === "STORE" ? Number(b.targetStoreId || 0) || null : null,
        targetCategoryId:
          b.actionType === "CATEGORY" ? Number(b.targetCategoryId || 0) || null : null,
        targetServiceId:
          b.actionType === "PRODUCT" ? Number(b.targetServiceId || 0) || null : null,
        externalUrl: b.actionType === "URL" ? b.externalUrl || null : null,
        sortOrder: idx + 1,
      }));
    }

    const res = editingSection
      ? await fetchHelper({
          endPoint: ["homeAdminSections", editingSection.id],
          method: "PATCH",
          body: payload,
          redirectOnUnauthorized: false,
        })
      : await fetchHelper({
          endPoint: ["homeAdminSections"],
          method: "POST",
          body: payload,
          redirectOnUnauthorized: false,
        });

    setSaving(false);
    if (res?.success) {
      toast.success(isAr ? "تم حفظ القسم بنجاح" : "Section saved");
      onOpenChange(false);
      onSaved();
    } else {
      toast.error(res?.message || (isAr ? "حدث خطأ أثناء الحفظ" : "Save failed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingSection ? t("editSection") : t("addSection")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Section Type + City + Active */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="space-y-1.5">
              <Label>{t("sectionType")}</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as HomeSectionType)}
                disabled={Boolean(editingSection)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STORES">{SECTION_TYPE_META.STORES[isAr ? "ar" : "en"]}</SelectItem>
                  <SelectItem value="PRODUCTS">{SECTION_TYPE_META.PRODUCTS[isAr ? "ar" : "en"]}</SelectItem>
                  <SelectItem value="BANNER">{SECTION_TYPE_META.BANNER[isAr ? "ar" : "en"]}</SelectItem>
                  {editingSection &&
                    !["STORES", "PRODUCTS", "BANNER"].includes(editingSection.type) && (
                      <SelectItem value={editingSection.type}>
                        {SECTION_TYPE_META[editingSection.type][isAr ? "ar" : "en"]}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{t("selectCityScope")}</Label>
              <Select value={cityId} onValueChange={setCityId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allCitiesGlobal")}</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {getLocalizedText(c.name, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border rounded-md px-3 py-2">
              <Label className="cursor-pointer">{isAr ? "مفعل في الرئيسية" : "Visible"}</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("sectionTitleAr")}</Label>
              <Input
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder="مثال: المطاعم الأكثر شهرة"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("sectionTitleEn")}</Label>
              <Input
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Popular Restaurants"
              />
            </div>
          </div>

          {/* Subtitles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("sectionSubtitleAr")}</Label>
              <Input
                value={subtitleAr}
                onChange={(e) => setSubtitleAr(e.target.value)}
                placeholder="وصف قصير تحت العنوان"
              />
            </div>
            <div className="space-y-1.5">
              <Label>{t("sectionSubtitleEn")}</Label>
              <Input
                value={subtitleEn}
                onChange={(e) => setSubtitleEn(e.target.value)}
                placeholder="Short subtitle"
              />
            </div>
          </div>

          {/* Optional Header Banner Image */}
          <div className="space-y-1.5 border rounded-lg p-3 bg-muted/20">
            <Label>{t("headerBannerOptional")}</Label>
            <div className="flex items-center gap-3 flex-wrap">
              <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md cursor-pointer hover:bg-accent">
                {uploadingHeader ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4" />
                )}
                <span>{isAr ? "رفع صورة" : "Upload Image"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeaderUpload}
                />
              </label>
              {headerBannerImage && (
                <div className="flex items-center gap-2">
                  <img
                    src={resolveDashboardImageUrl(headerBannerImage)}
                    alt="header"
                    className="h-12 w-24 object-cover rounded border"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setHeaderBannerImage("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* STORES CURATION */}
          {type === "STORES" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-3">
              <div className="space-y-2">
                <Label className="font-semibold">
                  {t("pickStores")} ({selectedStores.length})
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedStores.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded">
                      {isAr
                        ? "لم يتم اختيار مطاعم بعد — سيظل القسم مخفياً حتى تضيف مطاعم"
                        : "No stores selected — section stays hidden until you add stores"}
                    </p>
                  ) : (
                    selectedStores.map((store, idx) => (
                      <div
                        key={store.id}
                        className="flex items-center justify-between gap-2 p-2 border rounded-md bg-background"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-bold text-muted-foreground w-5">
                            #{idx + 1}
                          </span>
                          <span className="text-sm font-medium truncate">
                            {getLocalizedText(store.name, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() =>
                              setSelectedStores((prev) => moveArrayItem(prev, idx, -1))
                            }
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={idx === selectedStores.length - 1}
                            onClick={() =>
                              setSelectedStores((prev) => moveArrayItem(prev, idx, 1))
                            }
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              setSelectedStores((prev) =>
                                prev.filter((s) => Number(s.id) !== Number(store.id)),
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder={isAr ? "ابحث عن مطعم..." : "Search stores..."}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {filteredAvailableStores.slice(0, 60).map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => setSelectedStores((prev) => [...prev, store])}
                      className="w-full flex items-center justify-between p-2 text-sm border rounded hover:bg-accent text-left"
                    >
                      <span className="truncate">
                        {getLocalizedText(store.name, locale)}
                      </span>
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTS CURATION */}
          {type === "PRODUCTS" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-lg p-3">
              <div className="space-y-2">
                <Label className="font-semibold">
                  {t("pickProducts")} ({selectedProducts.length})
                </Label>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedProducts.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded">
                      {isAr
                        ? "لم يتم اختيار منتجات بعد — سيظل القسم مخفياً حتى تضيف منتجات"
                        : "No products selected — section stays hidden until you add products"}
                    </p>
                  ) : (
                    selectedProducts.map((prod, idx) => (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-2 p-2 border rounded-md bg-background"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            #{idx + 1} {getLocalizedText(prod.name, locale)}
                          </div>
                          {prod.Store && (
                            <div className="text-xs text-muted-foreground truncate">
                              {getLocalizedText(prod.Store.name, locale)}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() =>
                              setSelectedProducts((prev) => moveArrayItem(prev, idx, -1))
                            }
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            disabled={idx === selectedProducts.length - 1}
                            onClick={() =>
                              setSelectedProducts((prev) => moveArrayItem(prev, idx, 1))
                            }
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() =>
                              setSelectedProducts((prev) =>
                                prev.filter((p) => Number(p.id) !== Number(prod.id)),
                              )
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Select value={storeFilterId} onValueChange={setStoreFilterId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "فلتر بالمطعم" : "Filter by store"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">
                      {isAr ? "كل المطاعم" : "All Stores"}
                    </SelectItem>
                    {allStores.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {getLocalizedText(s.name, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    placeholder={isAr ? "ابحث عن منتج أو وجبة..." : "Search products..."}
                    className="pl-8"
                  />
                </div>
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {filteredAvailableProducts.slice(0, 60).map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedProducts((prev) => [...prev, svc])}
                      className="w-full flex items-center justify-between p-2 text-sm border rounded hover:bg-accent text-left"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {getLocalizedText(svc.name, locale)}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {getLocalizedText(svc.Store?.name, locale)} • {svc.price} EGP
                        </div>
                      </div>
                      <Plus className="h-4 w-4 text-primary shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* BANNER / SHOWCASE SECTION */}
          {type === "BANNER" && (
            <div className="space-y-3 border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">
                  {t("sectionBanners")} ({banners.length})
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setBanners((prev) => [
                      ...prev,
                      {
                        image: "",
                        actionType: "NONE",
                        targetStoreId: null,
                        targetCategoryId: null,
                        targetServiceId: null,
                        externalUrl: "",
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t("addBannerImage")}
                </Button>
              </div>

              {banners.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded">
                  {isAr
                    ? "أضف صورة واحدة لتظهر كصورة مميزة، أو أكثر من صورة لتظهر كسلايدر"
                    : "Add 1 image for a showcase card or 2+ for an auto-carousel"}
                </p>
              )}

              <div className="space-y-3">
                {banners.map((banner, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 border rounded-md bg-muted/20 items-center"
                  >
                    <div className="md:col-span-4 space-y-2">
                      {banner.image ? (
                        <img
                          src={resolveDashboardImageUrl(banner.image)}
                          alt={`banner-${idx}`}
                          className="h-24 w-full object-cover rounded border"
                        />
                      ) : (
                        <div className="h-24 w-full flex items-center justify-center rounded border border-dashed text-xs text-muted-foreground">
                          {isAr ? "لا توجد صورة" : "No image"}
                        </div>
                      )}
                      <label className="inline-flex items-center justify-center w-full gap-1.5 px-2.5 py-1.5 text-xs border rounded cursor-pointer hover:bg-accent bg-background">
                        {uploadingBannerIdx === idx ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ImagePlus className="h-3.5 w-3.5" />
                        )}
                        <span>{isAr ? "اختيار صورة" : "Upload Image"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleBannerUpload(idx, e)}
                        />
                      </label>
                    </div>

                    <div className="md:col-span-6 space-y-2">
                      <div className="space-y-1">
                        <Label className="text-xs">{t("actionType")}</Label>
                        <Select
                          value={banner.actionType}
                          onValueChange={(v) =>
                            setBanners((prev) =>
                              prev.map((item, i) =>
                                i === idx
                                  ? { ...item, actionType: v as HomeBannerActionType }
                                  : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">
                              {isAr ? "بدون توجيه (صورة فقط)" : "None (Image only)"}
                            </SelectItem>
                            <SelectItem value="STORE">
                              {isAr ? "فتح مطعم محدد" : "Open Store"}
                            </SelectItem>
                            <SelectItem value="CATEGORY">
                              {isAr ? "فتح فئة / قسم" : "Open Category"}
                            </SelectItem>
                            <SelectItem value="PRODUCT">
                              {isAr ? "فتح منتج محدد" : "Open Product"}
                            </SelectItem>
                            <SelectItem value="URL">
                              {isAr ? "رابط خارجي" : "External URL"}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {banner.actionType === "STORE" && (
                        <Select
                          value={banner.targetStoreId ? String(banner.targetStoreId) : ""}
                          onValueChange={(v) =>
                            setBanners((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, targetStoreId: Number(v) } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isAr ? "اختر المطعم" : "Select Store"} />
                          </SelectTrigger>
                          <SelectContent>
                            {allStores.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {getLocalizedText(s.name, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {banner.actionType === "CATEGORY" && (
                        <Select
                          value={
                            banner.targetCategoryId ? String(banner.targetCategoryId) : ""
                          }
                          onValueChange={(v) =>
                            setBanners((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, targetCategoryId: Number(v) } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isAr ? "اختر الفئة" : "Select Category"} />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {getLocalizedText(c.name, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {banner.actionType === "PRODUCT" && (
                        <Select
                          value={
                            banner.targetServiceId ? String(banner.targetServiceId) : ""
                          }
                          onValueChange={(v) =>
                            setBanners((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, targetServiceId: Number(v) } : item,
                              ),
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={isAr ? "اختر المنتج" : "Select Product"} />
                          </SelectTrigger>
                          <SelectContent>
                            {allServices.map((svc) => (
                              <SelectItem key={svc.id} value={String(svc.id)}>
                                {getLocalizedText(svc.name, locale)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {banner.actionType === "URL" && (
                        <Input
                          value={banner.externalUrl || ""}
                          onChange={(e) =>
                            setBanners((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, externalUrl: e.target.value } : item,
                              ),
                            )
                          }
                          placeholder="https://..."
                        />
                      )}
                    </div>

                    <div className="md:col-span-2 flex md:flex-col items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={idx === 0}
                        onClick={() => setBanners((prev) => moveArrayItem(prev, idx, -1))}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={idx === banners.length - 1}
                        onClick={() => setBanners((prev) => moveArrayItem(prev, idx, 1))}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() =>
                          setBanners((prev) => prev.filter((_, i) => i !== idx))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isAr ? "إلغاء" : "Cancel"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isAr ? "حفظ التعديلات" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
