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

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [secRes, cityRes, tplRes, bannerRes] = await Promise.all([
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
    setLoading(false);
  }, []);

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
