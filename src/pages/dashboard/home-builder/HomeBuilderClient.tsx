import { useCallback, useEffect, useState } from "react";
import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocale, useTranslations } from "@/lib/i18n";
import { Link } from "@/lib/navigation";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminHomeSection,
  getLocalizedText,
  moveArrayItem,
  resolveDashboardImageUrl,
  SECTION_TYPE_META,
} from "./homeBuilderUtils";
import SectionEditorDialog from "./SectionEditorDialog";

export default function HomeBuilderClient() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<AdminHomeSection[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [mainBanners, setMainBanners] = useState<any[]>([]);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<AdminHomeSection | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [floatingBadge, setFloatingBadge] = useState<{
    enabled: boolean;
    storeId: number | null;
    storeName?: string;
    text: string;
    image: string;
  }>({
    enabled: true,
    storeId: null,
    storeName: "",
    text: "",
    image: "",
  });
  const [savingBadge, setSavingBadge] = useState(false);
  const [allStores, setAllStores] = useState<any[]>([]);

  const [quickServices, setQuickServices] = useState<{
    martImage: string;
    kioskImage: string;
    shippingImage: string;
    tableImage: string;
    specialImage: string;
  }>({
    martImage: "",
    kioskImage: "",
    shippingImage: "",
    tableImage: "",
    specialImage: "",
  });
  const [savingQuickServices, setSavingQuickServices] = useState(false);
  const [uploadingQuickCard, setUploadingQuickCard] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [secRes, cityRes, tplRes, bannerRes, badgeRes, storesRes, qsRes] = await Promise.all([
      fetchHelper({
        endPoint: ["homeAdminSections"],
        method: "GET",
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["cities"],
        method: "GET",
        params: { limit: 100 },
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["storeTemplates"],
        method: "GET",
        params: { limit: 100 },
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["banners"],
        method: "GET",
        params: { limit: 100 },
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["settings", "floating-badge"],
        method: "GET",
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["stores"],
        method: "GET",
        params: { limit: 200 },
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: ["settings", "quick-services"],
        method: "GET",
        redirectOnUnauthorized: false,
      }),
    ]);

    if (Array.isArray(secRes?.data)) setSections(secRes.data);
    if (Array.isArray(cityRes?.data)) setCities(cityRes.data);

    if (Array.isArray(tplRes?.data)) {
      const sorted = [...tplRes.data].sort(
        (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || Number(a.id) - Number(b.id),
      );
      setTemplates(sorted);
    }

    if (Array.isArray(bannerRes?.data)) {
      const sorted = [...bannerRes.data].sort(
        (a, b) => Number(a.order ?? 0) - Number(b.order ?? 0) || Number(a.id) - Number(b.id),
      );
      setMainBanners(sorted);
    }

    if (badgeRes?.data) {
      setFloatingBadge({
        enabled: Boolean(badgeRes.data.enabled),
        storeId: badgeRes.data.storeId ?? null,
        storeName: badgeRes.data.storeName || "",
        text: badgeRes.data.text || "",
        image: badgeRes.data.image || "",
      });
    }

    if (Array.isArray(storesRes?.data)) {
      setAllStores(storesRes.data);
    }

    if (qsRes?.data) {
      setQuickServices({
        martImage: qsRes.data.martImage || "",
        kioskImage: qsRes.data.kioskImage || "",
        shippingImage: qsRes.data.shippingImage || "",
        tableImage: qsRes.data.tableImage || "",
        specialImage: qsRes.data.specialImage || "",
      });
    }
    setLoading(false);
  }, []);

  const handleSaveFloatingBadge = async () => {
    try {
      setSavingBadge(true);
      const res = await fetchHelper({
        endPoint: ["settings", "floating-badge"],
        method: "PATCH",
        data: {
          enabled: floatingBadge.enabled,
          storeId: floatingBadge.storeId,
          text: floatingBadge.text,
          image: floatingBadge.image,
        },
      });
      if (res?.data) {
        toast.success(isAr ? "تم حفظ إعدادات الودجت الدوار بنجاح!" : "Floating badge saved successfully!");
      } else {
        toast.error(isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save floating badge");
      }
    } catch (e: any) {
      toast.error(e?.message || (isAr ? "حدث خطأ أثناء الحفظ" : "Failed to save"));
    } finally {
      setSavingBadge(false);
    }
  };

  const handleQuickCardUpload = async (
    key: "martImage" | "kioskImage" | "shippingImage" | "tableImage" | "specialImage",
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingQuickCard(key);
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetchHelper({
        endPoint: ["homeAdminUpload"],
        method: "POST",
        body: formData,
        redirectOnUnauthorized: false,
      });
      if (res?.success && res?.data?.image) {
        setQuickServices((prev) => ({ ...prev, [key]: res.data.image }));
        toast.success(isAr ? "تم رفع الصورة بنجاح!" : "Image uploaded successfully!");
      } else {
        toast.error(res?.message || (isAr ? "فشل رفع الصورة" : "Upload failed"));
      }
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء الرفع" : "Upload error");
    } finally {
      setUploadingQuickCard(null);
    }
  };

  const handleSaveQuickServices = async () => {
    try {
      setSavingQuickServices(true);
      const res = await fetchHelper({
        endPoint: ["settings", "quick-services"],
        method: "PATCH",
        data: quickServices,
      });
      if (res?.data) {
        toast.success(
          isAr
            ? "تم حفظ صور كروت الخدمات السريعة بنجاح!"
            : "Quick services cards saved successfully!",
        );
      } else {
        toast.error(res?.message || "Failed to save");
      }
    } catch {
      toast.error(isAr ? "حدث خطأ أثناء الحفظ" : "Error saving");
    } finally {
      setSavingQuickServices(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleReorderSection = async (index: number, delta: -1 | 1) => {
    const next = moveArrayItem(sections, index, delta);
    if (next === sections) return;
    setSections(next);

    const res = await fetchHelper({
      endPoint: ["homeAdminReorder"],
      method: "PATCH",
      body: { sectionIds: next.map((s) => s.id) },
      redirectOnUnauthorized: false,
    });
    if (res?.success && Array.isArray(res?.data)) {
      setSections(res.data);
      toast.success(isAr ? "تم تحديث ترتيب الأقسام" : "Section order saved");
    } else {
      toast.error(res?.message || "Reorder failed");
      loadAll();
    }
  };

  const handleToggleSection = async (section: AdminHomeSection) => {
    setBusyId(section.id);
    const res = await fetchHelper({
      endPoint: ["homeAdminSections", section.id, "toggle"],
      method: "PATCH",
      redirectOnUnauthorized: false,
    });
    setBusyId(null);
    if (res?.success && res?.data) {
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? res.data : s)),
      );
    } else {
      toast.error(res?.message || "Toggle failed");
    }
  };

  const handleDeleteSection = async (section: AdminHomeSection) => {
    if (section.isBuiltIn) return;
    const confirmed = window.confirm(
      isAr
        ? `هل تريد حذف قسم "${getLocalizedText(section.title, locale)}"؟`
        : `Delete section "${getLocalizedText(section.title, locale)}"?`,
    );
    if (!confirmed) return;

    setBusyId(section.id);
    const res = await fetchHelper({
      endPoint: ["homeAdminSections", section.id],
      method: "DELETE",
      redirectOnUnauthorized: false,
    });
    setBusyId(null);
    if (res?.success) {
      setSections((prev) => prev.filter((s) => s.id !== section.id));
      toast.success(isAr ? "تم حذف القسم" : "Section deleted");
    } else {
      toast.error(res?.message || "Delete failed");
    }
  };

  const handleQuickOrderSwap = async (
    endpointKey: "storeTemplates" | "banners",
    list: any[],
    setList: (next: any[]) => void,
    index: number,
    delta: -1 | 1,
  ) => {
    const next = moveArrayItem(list, index, delta).map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    if (next === list) return;
    setList(next);

    const a = next[index];
    const b = next[index + delta];
    await Promise.all([
      fetchHelper({
        endPoint: [endpointKey, a.id],
        method: "PATCH",
        body: { order: a.order },
        redirectOnUnauthorized: false,
      }),
      fetchHelper({
        endPoint: [endpointKey, b.id],
        method: "PATCH",
        body: { order: b.order },
        redirectOnUnauthorized: false,
      }),
    ]);
    toast.success(isAr ? "تم حفظ الترتيب" : "Order updated");
  };

  const handleQuickActiveToggle = async (
    endpointKey: "storeTemplates" | "banners",
    item: any,
    setList: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    const nextActive = !Boolean(item.active);
    setList((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, active: nextActive } : row)),
    );
    const res = await fetchHelper({
      endPoint: [endpointKey, item.id],
      method: "PATCH",
      body: { active: nextActive },
      redirectOnUnauthorized: false,
    });
    if (!res?.success) {
      loadAll();
      toast.error(res?.message || "Failed to update status");
    }
  };

  const renderSectionSummary = (section: AdminHomeSection) => {
    if (section.type === "STORES") {
      const count = section.Stores?.length ?? 0;
      if (count === 0) {
        return (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {isAr
              ? "مخفي حالياً: لم يتم اختيار مطاعم"
              : "Hidden until stores are added"}
          </span>
        );
      }
      const preview = section.Stores!
        .slice(0, 3)
        .map((s) => getLocalizedText(s.Store?.name, locale) || `#${s.storeId}`)
        .join("، ");
      return (
        <span className="text-xs text-muted-foreground">
          {count} {isAr ? "مطاعم:" : "stores:"} {preview}
          {count > 3 ? ` (+${count - 3})` : ""}
        </span>
      );
    }

    if (section.type === "PRODUCTS") {
      const count = section.Products?.length ?? 0;
      if (count === 0) {
        return (
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {isAr
              ? "مخفي حالياً: لم يتم اختيار منتجات"
              : "Hidden until products are added"}
          </span>
        );
      }
      const preview = section.Products!
        .slice(0, 3)
        .map((p) => getLocalizedText(p.Service?.name, locale) || `#${p.serviceId}`)
        .join("، ");
      return (
        <span className="text-xs text-muted-foreground">
          {count} {isAr ? "منتجات:" : "products:"} {preview}
          {count > 3 ? ` (+${count - 3})` : ""}
        </span>
      );
    }

    if (section.type === "BANNER") {
      const count = section.Banners?.length ?? 0;
      return count === 0 ? (
        <span className="text-xs text-amber-600 dark:text-amber-400">
          {isAr ? "مخفي حالياً: أضف صورة واحدة على الأقل" : "Hidden until images are added"}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">
          {count} {isAr ? "صور بانر" : "banner image(s)"}
        </span>
      );
    }

    return (
      <span className="text-xs text-muted-foreground">
        {isAr ? "يُدار تلقائياً من تبويبه المخصص" : "Managed via its dedicated module"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="sections" className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="sections">{t("homeTabSections")}</TabsTrigger>
            <TabsTrigger value="categories">{t("homeTabCategories")}</TabsTrigger>
            <TabsTrigger value="banners">{t("homeTabBanners")}</TabsTrigger>
            <TabsTrigger value="quickServices">{isAr ? "كروت الخدمات السريعة" : "Quick Services"}</TabsTrigger>
            <TabsTrigger value="floatingBadge">{isAr ? "الودجت الدوار" : "Floating Badge"}</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              {isAr ? "تحديث" : "Refresh"}
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingSection(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("addSection")}
            </Button>
          </div>
        </div>

        {/* TAB 1: HOME SECTIONS */}
        <TabsContent value="sections" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <LayoutGrid className="h-5 w-5" />
                {t("homeTabSections")}
              </CardTitle>
              <CardDescription>
                {isAr
                  ? "رتب الأقسام بالأسهم، اخفِ أو أظهر أي قسم، واضغط تعديل لاختيار المطاعم أو المنتجات أو البانرات"
                  : "Reorder sections with arrows, toggle visibility, and click Edit to curate stores, products, or banners."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && sections.length === 0 ? (
                <div className="py-12 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                sections.map((section, idx) => {
                  const meta = SECTION_TYPE_META[section.type];
                  return (
                    <div
                      key={section.id}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg border transition-colors ${
                        section.isActive
                          ? "bg-card"
                          : "bg-muted/40 opacity-75"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex flex-col gap-0.5 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            disabled={idx === 0}
                            onClick={() => handleReorderSection(idx, -1)}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleReorderSection(idx, 1)}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                          {idx + 1}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-base">
                              {getLocalizedText(section.title, locale)}
                            </span>
                            <Badge variant="secondary" className={meta?.colorClass}>
                              {meta?.[isAr ? "ar" : "en"] || section.type}
                            </Badge>
                            <Badge variant="outline">
                              {section.City
                                ? getLocalizedText(section.City.name, locale)
                                : t("allCitiesGlobal")}
                            </Badge>
                            <Badge variant="outline" className="text-[11px]">
                              {section.isBuiltIn ? t("builtInSection") : t("customSection")}
                            </Badge>
                          </div>
                          <div>{renderSectionSummary(section)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={section.isActive}
                          disabled={busyId === section.id}
                          onCheckedChange={() => handleToggleSection(section)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingSection(section);
                            setEditorOpen(true);
                          }}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          {isAr ? "تعديل" : "Edit"}
                        </Button>
                        {!section.isBuiltIn && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            disabled={busyId === section.id}
                            onClick={() => handleDeleteSection(section)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CATEGORIES ORDER */}
        <TabsContent value="categories" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle>{t("homeTabCategories")}</CardTitle>
                <CardDescription>
                  {isAr
                    ? "ترتيب وظهور الفئات في أول قسم بالرئيسية"
                    : "Reorder and toggle StoreTemplates shown in Categories"}
                </CardDescription>
              </div>
              <Link href="/store-templates">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t("openFullPage")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {templates.map((tpl, idx) => (
                <div
                  key={tpl.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() =>
                          handleQuickOrderSwap("storeTemplates", templates, setTemplates, idx, -1)
                        }
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === templates.length - 1}
                        onClick={() =>
                          handleQuickOrderSwap("storeTemplates", templates, setTemplates, idx, 1)
                        }
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {tpl.image && (
                      <img
                        src={resolveDashboardImageUrl(tpl.image)}
                        alt=""
                        className="h-10 w-10 rounded object-cover border"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {getLocalizedText(tpl.name, locale)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isAr ? "الترتيب:" : "Order:"} #{idx + 1}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(tpl.active)}
                    onCheckedChange={() =>
                      handleQuickActiveToggle("storeTemplates", tpl, setTemplates)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: MAIN BANNERS */}
        <TabsContent value="banners" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {t("homeTabBanners")}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "ترتيب وإيقاف/تفعيل البانرات الرئيسية سريعاً"
                    : "Quickly reorder or toggle main Home carousel banners"}
                </CardDescription>
              </div>
              <Link href="/banners">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t("openFullPage")}
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {mainBanners.map((banner, idx) => (
                <div
                  key={banner.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === 0}
                        onClick={() =>
                          handleQuickOrderSwap("banners", mainBanners, setMainBanners, idx, -1)
                        }
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        disabled={idx === mainBanners.length - 1}
                        onClick={() =>
                          handleQuickOrderSwap("banners", mainBanners, setMainBanners, idx, 1)
                        }
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    {banner.image && (
                      <img
                        src={resolveDashboardImageUrl(banner.image)}
                        alt=""
                        className="h-12 w-20 rounded object-cover border"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {getLocalizedText(banner.name, locale)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {banner.targetType || "GENERAL"} • #{idx + 1}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(banner.active)}
                    onCheckedChange={() =>
                      handleQuickActiveToggle("banners", banner, setMainBanners)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: QUICK SERVICES CARDS */}
        <TabsContent value="quickServices" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  {isAr ? "كروت الخدمات السريعة (أعلى الرئيسية)" : "Quick Services Cards"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "تحكم بصور الكروت الأربعة (مكانك مارت، كشك مكانك، شحن المحافظات، وحجز الطاولة). يمكنك رفع صورة لكل كارت أو كتابة الرابط مباشرة."
                    : "Customize the images for the 4 quick service cards on top of home. Upload an image or enter a direct URL."}
                </CardDescription>
              </div>
              <Button
                onClick={handleSaveQuickServices}
                disabled={savingQuickServices}
                className="shrink-0 bg-primary"
              >
                {savingQuickServices ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Check className="h-4 w-4 mr-1" />
                )}
                {isAr ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[
                  {
                    key: "martImage" as const,
                    title: isAr ? "مكانك مارت" : "Makanak Mart",
                    subtitle: isAr ? "سوبرماركت فوري" : "Fast Grocery",
                    pillText: isAr ? "15 - 20 دقيقة" : "15-20 min",
                    pillBg: "bg-amber-100 text-amber-900 border-amber-200",
                    defaultImg:
                      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
                  },
                  {
                    key: "kioskImage" as const,
                    title: isAr ? "كشك مكانك" : "Makanak Kiosk",
                    subtitle: isAr ? "سناكس ومشروبات" : "Snacks & Drinks",
                    pillText: isAr ? "مفتوح 24 ساعة" : "Open 24/7",
                    pillBg: "bg-teal-100 text-teal-900 border-teal-200",
                    defaultImg:
                      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=300&q=80",
                  },
                  {
                    key: "shippingImage" as const,
                    title: isAr ? "شحن المحافظات" : "Intercity Cargo",
                    subtitle: isAr ? "طرود سريعة وآمنة" : "Fast & Safe Parcels",
                    pillText: isAr ? "بين المحافظات" : "City to City",
                    pillBg: "bg-blue-100 text-blue-900 border-blue-200",
                    defaultImg:
                      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=300&q=80",
                  },
                  {
                    key: "tableImage" as const,
                    title: isAr ? "حجز طاولة" : "Table Booking",
                    subtitle: isAr ? "أكل مسبق بالمطعم" : "Pre-order Dine-in",
                    pillText: isAr ? "بدون انتظار" : "Zero Wait",
                    pillBg: "bg-pink-100 text-pink-900 border-pink-200",
                    defaultImg:
                      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80",
                  },
                  {
                    key: "specialImage" as const,
                    title: isAr ? "خدمات خاصة" : "Special services",
                    subtitle: isAr ? "مندوب خاص وصيدلية" : "Courier & pharmacy",
                    pillText: isAr ? "صفحة الخدمات الخاصة" : "Special services page",
                    pillBg: "bg-violet-100 text-violet-900 border-violet-200",
                    defaultImg:
                      "https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=300&q=80",
                  },
                ].map((card) => {
                  const currentVal = quickServices[card.key] || "";
                  const previewUrl = currentVal
                    ? resolveDashboardImageUrl(currentVal)
                    : card.defaultImg;
                  const isUploading = uploadingQuickCard === card.key;

                  return (
                    <div
                      key={card.key}
                      className="p-5 rounded-xl border bg-card flex flex-col gap-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-base text-foreground">
                          {card.title}
                        </span>
                        {currentVal ? (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            {isAr ? "صورة مخصصة نشطة" : "Custom image active"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            {isAr ? "الصورة الافتراضية" : "Default image"}
                          </Badge>
                        )}
                      </div>

                      {/* Live App Card Preview */}
                      <div className="rounded-xl border bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3 shadow-xs">
                        <div className="flex flex-col gap-1 min-w-0 flex-1">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {card.title}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {card.subtitle}
                          </span>
                          <span className={`inline-block w-fit text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.pillBg}`}>
                            {card.pillText}
                          </span>
                        </div>
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                          <img
                            src={previewUrl}
                            alt={card.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Controls: Upload & Direct URL */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors">
                            {isUploading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Upload className="h-3.5 w-3.5" />
                            )}
                            <span>{isAr ? "رفع صورة جديدة" : "Upload Image"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={(e) => handleQuickCardUpload(card.key, e)}
                            />
                          </label>

                          {currentVal && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setQuickServices((prev) => ({
                                  ...prev,
                                  [card.key]: "",
                                }));
                              }}
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-1" />
                              {isAr ? "استعادة الافتراضية" : "Reset default"}
                            </Button>
                          )}
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">
                            {isAr ? "أو أدخل مسار / رابط الصورة:" : "Or direct image URL / path:"}
                          </label>
                          <input
                            type="text"
                            value={currentVal}
                            placeholder={card.defaultImg}
                            className="w-full text-xs px-3 py-2 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            onChange={(e) =>
                              setQuickServices((prev) => ({
                                ...prev,
                                [card.key]: e.target.value.trim(),
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 5: FLOATING BADGE (الودجت الدوار) */}
        <TabsContent value="floatingBadge" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {isAr ? "الودجت الدوار في الرئيسية (Floating Badge)" : "Home Floating Partner Badge"}
                  </CardTitle>
                  <CardDescription>
                    {isAr
                      ? "ودجت دائري دوار يظهر على الجانب الأيسر من الشاشة لتسليط الضوء على مطعم وتوجيه العملاء إليه بنقرة واحدة"
                      : "Spinning circular badge on the left screen edge to highlight a featured store"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {floatingBadge.enabled ? (isAr ? "مفعل" : "Active") : (isAr ? "معطل" : "Disabled")}
                  </span>
                  <Switch
                    checked={floatingBadge.enabled}
                    onCheckedChange={(val) => setFloatingBadge((prev) => ({ ...prev, enabled: val }))}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Form Controls */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {isAr ? "المطعم المرتبط بالودجت" : "Target Store"}
                    </label>
                    <select
                      className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm"
                      value={floatingBadge.storeId ?? ""}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : null;
                        const s = allStores.find((st) => st.id === val);
                        setFloatingBadge((prev) => ({
                          ...prev,
                          storeId: val,
                          storeName: s ? getLocalizedText(s.name, locale) : prev.storeName,
                        }));
                      }}
                    >
                      <option value="">{isAr ? "-- اختر المطعم --" : "-- Select Store --"}</option>
                      {allStores.map((st) => (
                        <option key={st.id} value={st.id}>
                          #{st.id} - {getLocalizedText(st.name, locale)}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr
                        ? "عند الضغط على الودجت في الموبايل سيتم فتح صفحة هذا المطعم مباشرة"
                        : "When tapped in the mobile app, users will navigate to this store"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {isAr ? "النص المعروض داخل الودجت (اختياري)" : "Badge Text (Optional)"}
                    </label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm"
                      placeholder={isAr ? "مثال: كونترا، السلطان..." : "e.g. Contra, Sultan..."}
                      value={floatingBadge.text}
                      onChange={(e) => setFloatingBadge((prev) => ({ ...prev, text: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr
                        ? "إذا تُرك فارغاً فسيتم عرض اسم المطعم المختار تلقائياً"
                        : "If left empty, the chosen store name will be displayed"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {isAr ? "رابط لوجو / صورة الودجت (اختياري)" : "Badge Image / Logo URL (Optional)"}
                    </label>
                    <input
                      type="text"
                      className="w-full h-10 px-3 py-2 rounded-md border bg-background text-sm"
                      placeholder="https://..."
                      value={floatingBadge.image}
                      onChange={(e) => setFloatingBadge((prev) => ({ ...prev, image: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {isAr
                        ? "إذا أضفت رابط صورة سيتم عرض اللوجو داخل الدائرة الدوارة"
                        : "If provided, image will be displayed inside the spinning badge"}
                    </p>
                  </div>

                  <Button
                    onClick={handleSaveFloatingBadge}
                    disabled={savingBadge}
                    className="w-full sm:w-auto"
                  >
                    {savingBadge && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {isAr ? "حفظ إعدادات الودجت الدوار" : "Save Floating Badge"}
                  </Button>
                </div>

                {/* Live Preview */}
                <div className="flex flex-col items-center justify-center p-8 rounded-xl border bg-slate-950 text-white min-h-[260px] text-center relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded">
                    {isAr ? "معاينة حية للموبايل" : "Mobile Live Preview"}
                  </div>

                  {floatingBadge.enabled ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-700 shadow-2xl animate-[spin_10s_linear_infinite]">
                        {floatingBadge.image ? (
                          <img
                            src={floatingBadge.image}
                            alt="preview"
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-white px-2 text-center tracking-wider">
                            {floatingBadge.text || floatingBadge.storeName || (isAr ? "مكانك" : "Makanak")}
                          </span>
                        )}
                        <div className="absolute inset-1 rounded-full border border-dashed border-slate-600 pointer-events-none" />
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {floatingBadge.text || floatingBadge.storeName || (isAr ? "لم يتم تحديد مطعم" : "No store selected")}
                      </div>
                      <div className="text-xs text-emerald-400">
                        {isAr ? "الودجت يظهر ويدور على يسار الشاشة" : "Badge spins on left edge of home"}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">
                      {isAr ? "الودجت الدوار معطل حالياً في الصفحة الرئيسية" : "Floating badge is currently disabled on home"}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SectionEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editingSection={editingSection}
        cities={cities}
        onSaved={loadAll}
      />
    </div>
  );
}
