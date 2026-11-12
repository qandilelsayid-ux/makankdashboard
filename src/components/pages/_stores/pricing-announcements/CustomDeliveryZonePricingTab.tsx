"use client";

import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useApiQuery } from "@/hooks/useApiQuery";
import { useLocale, useTranslations } from "@/lib/i18n";
import {
  AlertCircle,
  Bike,
  CheckCircle2,
  Filter,
  Layers,
  Loader2,
  MapPinned,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Tag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { APIChangeStatus } from "@/api/global/ApiChangeStatus";
import { queryClient } from "@/lib/queryClient";

interface CustomZoneItem {
  zoneId: number;
  name: { ar?: string; en?: string } | string;
  cityId?: number;
  storeDeliveryPrice?: number | null;
  price: number | null;
  priceAfterDiscount?: number | null;
}

interface CustomDeliveryPricesResponse {
  defaultPrice: number;
  zones: CustomZoneItem[];
}

// scope "pharmacy": the same screen for the pharmacy courier's own prices
// (/zones/pharmacy-delivery-prices). A zone with no pharmacy price — and no
// pharmacy default — is charged the regular special-courier price.
export default function CustomDeliveryZonePricingTab({ scope = "custom" }: { scope?: "custom" | "pharmacy" }) {
  const t = useTranslations();
  const locale = useLocale();
  const isPharmacy = scope === "pharmacy";
  const pricesEndpoint = isPharmacy ? "pharmacy-delivery-prices" : "custom-delivery-prices";
  const ar = locale === "ar";
  const serviceName = isPharmacy
    ? ar ? "مندوب الصيدلية" : "Pharmacy Courier"
    : ar ? "المندوب الخاص" : "Custom Delivery";

  // API Data
  const { data: response, isLoading, refetch } = useApiQuery({
    queryKey: [isPharmacy ? "pharmacy-delivery-zone-prices" : "custom-delivery-zone-prices"],
    endPoint: ["zones", pricesEndpoint],
  });

  const { data: citiesResponse } = useApiQuery({
    queryKey: ["cities-zones-filter"],
    endPoint: ["cities"],
    params: { limit: 1000 },
  });

  const rawData = response?.data as CustomDeliveryPricesResponse | undefined;
  const rawZones = useMemo(() => rawData?.zones ?? [], [rawData]);
  const serverDefaultPrice = rawData?.defaultPrice ?? 0;

  // Form State
  const [defaultPriceInput, setDefaultPriceInput] = useState<string>("");
  const [editedPrices, setEditedPrices] = useState<Record<number, string>>({});
  const [editedDiscountPrices, setEditedDiscountPrices] = useState<Record<number, string>>({});

  // Quick Uniform Tools
  const [uniformPriceInput, setUniformPriceInput] = useState<string>("");
  const [uniformDiscountInput, setUniformDiscountInput] = useState<string>("");

  // Filters
  const [searchZoneQuery, setSearchZoneQuery] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<string>("all");

  const [isSaving, setIsSaving] = useState(false);

  // Sync state with server data
  useEffect(() => {
    if (rawData) {
      setDefaultPriceInput(serverDefaultPrice > 0 ? String(serverDefaultPrice) : "");
      const prices: Record<number, string> = {};
      const discounts: Record<number, string> = {};
      rawZones.forEach((z) => {
        if (z.price != null && z.price > 0) {
          prices[z.zoneId] = String(z.price);
        }
        if (z.priceAfterDiscount != null && z.priceAfterDiscount > 0) {
          discounts[z.zoneId] = String(z.priceAfterDiscount);
        }
      });
      setEditedPrices(prices);
      setEditedDiscountPrices(discounts);
    }
  }, [rawData, rawZones, serverDefaultPrice]);

  // Cities List for filter
  const citiesList = useMemo(() => {
    const list = citiesResponse?.data?.data || citiesResponse?.data || [];
    return Array.isArray(list) ? list : [];
  }, [citiesResponse]);

  const getCityName = (cityId?: number) => {
    if (!cityId) return null;
    const found = citiesList.find((c: any) => Number(c.id) === Number(cityId));
    if (!found) return null;
    return locale === "ar"
      ? found?.name?.ar || found?.name?.en || String(cityId)
      : found?.name?.en || found?.name?.ar || String(cityId);
  };

  const getZoneName = (name: any) => {
    if (!name) return "";
    if (typeof name === "string") return name;
    return locale === "ar" ? name.ar || name.en || "" : name.en || name.ar || "";
  };

  // Filtered Zones
  const filteredZones = useMemo(() => {
    return rawZones.filter((z) => {
      const matchesCity =
        selectedCityId === "all" || String(z.cityId) === selectedCityId;
      const zoneName = getZoneName(z.name).toLowerCase();
      const matchesSearch =
        !searchZoneQuery || zoneName.includes(searchZoneQuery.toLowerCase().trim());
      return matchesCity && matchesSearch;
    });
  }, [rawZones, selectedCityId, searchZoneQuery, locale]);

  // Stats
  const customPricedCount = useMemo(() => {
    return rawZones.filter((z) => {
      const p = editedPrices[z.zoneId];
      return p !== undefined && p !== "" && Number(p) > 0;
    }).length;
  }, [rawZones, editedPrices]);

  const defaultPricedCount = Math.max(0, rawZones.length - customPricedCount);

  // Handlers
  const handleApplyUniformPrice = () => {
    if (!uniformPriceInput || isNaN(Number(uniformPriceInput)) || Number(uniformPriceInput) < 0) {
      toast.error(
        locale === "ar"
          ? "يرجى إدخال سعر صحيح لتطبيقه على المناطق"
          : "Please enter a valid price to apply"
      );
      return;
    }

    const newPrices = { ...editedPrices };
    const newDiscounts = { ...editedDiscountPrices };

    filteredZones.forEach((z) => {
      newPrices[z.zoneId] = uniformPriceInput;
      if (uniformDiscountInput && !isNaN(Number(uniformDiscountInput)) && Number(uniformDiscountInput) > 0) {
        newDiscounts[z.zoneId] = uniformDiscountInput;
      }
    });

    setEditedPrices(newPrices);
    setEditedDiscountPrices(newDiscounts);

    toast.success(
      locale === "ar"
        ? `تم تطبيق السعر (${uniformPriceInput} ج.م) على ${filteredZones.length} منطقة`
        : `Applied (${uniformPriceInput} EGP) across ${filteredZones.length} zones`
    );
  };

  const handleClearZone = (zoneId: number) => {
    setEditedPrices((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
    setEditedDiscountPrices((prev) => {
      const next = { ...prev };
      delete next[zoneId];
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const zonePrices = rawZones.map((z) => {
        const rawP = editedPrices[z.zoneId];
        const rawD = editedDiscountPrices[z.zoneId];

        const price = rawP !== undefined && rawP !== "" && !isNaN(Number(rawP)) ? Number(rawP) : null;
        const priceAfterDiscount = rawD !== undefined && rawD !== "" && !isNaN(Number(rawD)) && Number(rawD) > 0 ? Number(rawD) : null;

        return {
          zoneId: z.zoneId,
          price,
          priceAfterDiscount: price != null ? priceAfterDiscount : null,
        };
      });

      const defaultPriceVal =
        defaultPriceInput !== "" && !isNaN(Number(defaultPriceInput))
          ? Number(defaultPriceInput)
          : null;

      const res = await fetchHelper({
        endPoint: ["zones", pricesEndpoint] as any,
        method: "PATCH",
        body: {
          defaultPrice: defaultPriceVal,
          zonePrices,
        },
      });

      if (res?.success) {
        toast.success(
          ar
            ? `تم حفظ وتثبيت أسعار مناطق ${serviceName} بنجاح`
            : `${serviceName} zone prices saved successfully`
        );
        refetch();
      } else {
        toast.error(res?.message || t("error"));
      }
    } catch (e: any) {
      toast.error(e?.message || t("error"));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {ar ? `جاري تحميل أسعار مناطق ${serviceName}...` : `Loading ${serviceName} zone prices...`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Explanation */}
      <Card className="border-primary/25 bg-gradient-to-r from-primary/5 via-background to-secondary/5 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
                <Bike className="h-6 w-6" />
              </span>
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  {isPharmacy
                    ? ar ? "تسعير مناطق مندوب الصيدلية" : "Pharmacy Courier Zone Pricing"
                    : ar ? "تسعير مناطق المندوب الخاص (توصيل المشتريات والطلبات الحرة)" : "Custom Delivery Zone Pricing (Private Courier)"}
                  <Badge variant="outline" className="border-primary/40 text-primary font-semibold text-xs">
                    {locale === "ar" ? "تسعير منفصل" : "Independent"}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1 leading-relaxed text-muted-foreground">
                  {isPharmacy
                    ? ar
                      ? "تسعيرة خاصة بطلبات مندوب الصيدلية. حط سعر لمنطقة معيّنة أو سعر افتراضي لباقي المناطق. أي منطقة مالهاش سعر هنا (ومفيش سعر افتراضي) بتتحاسب بتسعير المندوب الخاص العادي (تسعيرة مناطقه أو السعر الثابت + الكيلو)."
                      : "Pricing for pharmacy courier orders only. Set a price per zone or a default for the rest. A zone with no price here (and no default) is charged the regular special-courier pricing (its zone prices, or base fee + per km)."
                    : locale === "ar"
                    ? "هنا يمكنك تحديد تسعيرة مناطق مخصصة لطلبات المندوب الخاص فقط. يمكنك تحديد سعر افتراضي موحد لباقي المناطق، مع تخصيص سعر محدد لأي مناطق معينة (مثل المناطق البعيدة). تظل تسعيرة توصيل المتاجر والمطاعم منفصلة تماماً دون أي تعارض."
                    : "Configure independent zone pricing for custom errand delivery. Set a default price for remaining zones, and assign custom rates for specific zones. Store delivery prices remain completely separate."}
                </CardDescription>
              </div>
            </div>

            {/* Save Button in Header */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="font-bold gap-2 shrink-0 self-start sm:self-center shadow-xs"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {ar ? `حفظ تسعيرات ${serviceName}` : `Save ${serviceName} Prices`}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Controls Grid: Default Price for Remaining Zones + Uniform Price Tool */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card A: Default Price for Remaining Zones */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Layers className="h-4 w-4 text-primary" />
              {locale === "ar" ? "السعر الافتراضي لباقي المناطق" : "Default Price for Remaining Zones"}
            </CardTitle>
            <CardDescription className="text-xs">
              {isPharmacy
                ? ar
                  ? "أي منطقة مالهاش سعر في الجدول هتتحاسب بالسعر ده. لو سبته فاضي، بتتحاسب بتسعير المندوب الخاص العادي."
                  : "Zones without a price below use this price. Leave it empty to use the regular special-courier pricing."
                : locale === "ar"
                ? "أي منطقة لم يتم إدخال سعر مخصص لها بالجدول أدناه ستُحاسب تلقائياً بهذا السعر الأساسي."
                : "Any zone without a specific custom price below will automatically use this base price."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={defaultPriceInput}
                  onChange={(e) => setDefaultPriceInput(e.target.value)}
                  placeholder="25"
                  className="pe-12 font-bold text-base"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">
                  {locale === "ar" ? "ج.م" : "EGP"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs px-2.5 py-1">
                {defaultPriceInput && Number(defaultPriceInput) > 0
                  ? locale === "ar"
                    ? `مفعّل: ${defaultPriceInput} ج.م`
                    : `Active: ${defaultPriceInput} EGP`
                  : locale === "ar"
                  ? "غير محدد"
                  : "Not set"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card B: Quick Uniform Price Tool */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              {locale === "ar" ? "تطبيق سعر موحد سريع على المناطق" : "Quick Uniform Price Setter"}
            </CardTitle>
            <CardDescription className="text-xs">
              {locale === "ar"
                ? "تعبئة سريعة لكل المناطق المعروضة أدناه بسعر واحد بضغطة زر واحدة."
                : "Quickly fill all filtered zones below with a single rate."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative w-28 sm:w-32">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={uniformPriceInput}
                  onChange={(e) => setUniformPriceInput(e.target.value)}
                  placeholder={locale === "ar" ? "السعر" : "Price"}
                  className="pe-10 font-medium text-sm"
                />
                <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                  {locale === "ar" ? "ج.م" : "EGP"}
                </span>
              </div>

              <div className="relative w-28 sm:w-32">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={uniformDiscountInput}
                  onChange={(e) => setUniformDiscountInput(e.target.value)}
                  placeholder={locale === "ar" ? "بعد الخصم" : "Discounted"}
                  className="pe-10 font-medium text-sm text-green-700"
                />
                <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                  {locale === "ar" ? "ج.م" : "EGP"}
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleApplyUniformPrice}
                className="text-xs font-semibold gap-1.5 h-9"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {locale === "ar" ? "تطبيق على المعروض" : "Apply to Visible"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filter Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-card border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Zone */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={searchZoneQuery}
              onChange={(e) => setSearchZoneQuery(e.target.value)}
              placeholder={locale === "ar" ? "بحث عن منطقة..." : "Search zone..."}
              className="ps-8 text-xs h-9"
            />
          </div>

          {/* City Filter */}
          <div className="w-full sm:w-52">
            <Select value={selectedCityId} onValueChange={setSelectedCityId}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder={locale === "ar" ? "جميع المدن" : "All Cities"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {locale === "ar" ? "جميع المدن" : "All Cities"}
                </SelectItem>
                {citiesList.map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {locale === "ar" ? c.name?.ar || c.name?.en : c.name?.en || c.name?.ar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Count Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Badge variant="outline" className="border-green-600/30 text-green-700 bg-green-50/50">
            {locale === "ar" ? `تسعيرة مخصصة: ${customPricedCount}` : `Custom: ${customPricedCount}`}
          </Badge>
          <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">
            {locale === "ar" ? `بالسعر الافتراضي: ${defaultPricedCount}` : `Default: ${defaultPricedCount}`}
          </Badge>

          {selectedCityId !== "all" && (() => {
            const selectedCity = citiesList.find((c: any) => String(c.id) === selectedCityId);
            if (!selectedCity) return null;
            const isCustomDeliveryOpen = selectedCity.customDeliveryActive !== false;
            return (
              <div className="flex items-center gap-2 px-3 py-1 rounded-md border bg-muted/40 text-xs">
                <span className="font-medium text-foreground">
                  {locale === "ar" ? "المندوب الخاص للمدينة:" : "City Custom Delivery:"}
                </span>
                <span className={isCustomDeliveryOpen ? "text-green-600 font-semibold" : "text-destructive font-semibold"}>
                  {isCustomDeliveryOpen ? (locale === "ar" ? "مفتوح" : "Open") : (locale === "ar" ? "مغلق" : "Closed")}
                </span>
                <Switch
                  checked={isCustomDeliveryOpen}
                  onCheckedChange={async (checked) => {
                    try {
                      await APIChangeStatus(["cities"], "", String(selectedCity.id), {
                        customDeliveryActive: checked,
                      });
                      toast.success(
                        locale === "ar"
                          ? `تم ${checked ? "فتح" : "إغلاق"} خدمة المندوب الخاص لـ ${selectedCity.name?.ar || selectedCity.name?.en}`
                          : `Custom delivery ${checked ? "opened" : "closed"} for city`
                      );
                      queryClient.invalidateQueries({ queryKey: ["cities"] });
                      queryClient.invalidateQueries({ queryKey: ["cities-zones-filter"] });
                    } catch (err: any) {
                      toast.error(err?.message || "Error");
                    }
                  }}
                />
              </div>
            );
          })()}
        </div>
      </div>

      {/* 4. Zones Table */}
      <Card className="border-border/80 shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>{locale === "ar" ? "المنطقة" : "Zone"}</TableHead>
              <TableHead>{locale === "ar" ? "المدينة" : "City"}</TableHead>
              <TableHead className="text-center">{locale === "ar" ? "سعر المتاجر (للمقارنة)" : "Store Price (Reference)"}</TableHead>
              <TableHead className="w-44 text-center">{ar ? `سعر ${serviceName}` : `${serviceName} Price`}</TableHead>
              <TableHead className="w-44 text-center">{locale === "ar" ? "السعر بعد الخصم (اختياري)" : "Price After Discount"}</TableHead>
              <TableHead className="text-center">{locale === "ar" ? "حالة التسعير" : "Status"}</TableHead>
              <TableHead className="w-16 text-center"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  {locale === "ar" ? "لا توجد مناطق مطابقة للبحث." : "No zones match the filter."}
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((z, idx) => {
                const cityName = getCityName(z.cityId);
                const currentPrice = editedPrices[z.zoneId] ?? "";
                const currentDiscount = editedDiscountPrices[z.zoneId] ?? "";
                const hasCustomPrice = currentPrice !== "" && Number(currentPrice) > 0;

                return (
                  <TableRow key={z.zoneId} className={hasCustomPrice ? "bg-primary/2" : ""}>
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {idx + 1}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPinned className="h-4 w-4 text-primary/70 shrink-0" />
                        <span className="font-semibold text-sm">{getZoneName(z.name)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {cityName ? (
                        <Badge variant="outline" className="text-xs font-normal">
                          {cityName}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center text-xs text-muted-foreground font-medium">
                      {z.storeDeliveryPrice != null && z.storeDeliveryPrice > 0
                        ? `${z.storeDeliveryPrice} ${locale === "ar" ? "ج.م" : "EGP"}`
                        : "-"}
                    </TableCell>

                    {/* Custom Delivery Price Input */}
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedPrices((prev) => ({ ...prev, [z.zoneId]: val }));
                          }}
                          placeholder={
                            defaultPriceInput && Number(defaultPriceInput) > 0
                              ? `${defaultPriceInput} (افتراضي)`
                              : locale === "ar"
                              ? "افتراضي"
                              : "Default"
                          }
                          className="pe-10 font-bold text-center text-sm"
                        />
                        <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                          {locale === "ar" ? "ج.م" : "EGP"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Custom Delivery Price After Discount Input */}
                    <TableCell>
                      <div className="relative">
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          value={currentDiscount}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditedDiscountPrices((prev) => ({ ...prev, [z.zoneId]: val }));
                          }}
                          placeholder="-"
                          className="pe-10 text-center text-sm font-semibold text-green-700"
                        />
                        <span className="absolute end-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-muted-foreground pointer-events-none">
                          {locale === "ar" ? "ج.م" : "EGP"}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="text-center">
                      {hasCustomPrice ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold text-[11px] gap-1 px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          {locale === "ar" ? "تسعيرة مخصصة" : "Custom"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[11px] font-normal px-2 py-0.5">
                          {isPharmacy && !(Number(defaultPriceInput) > 0)
                            ? ar ? "بتسعير المندوب الخاص" : "Special courier rate"
                            : ar ? "بالسعر الافتراضي" : "Default Rate"}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Reset Button */}
                    <TableCell className="text-center">
                      {hasCustomPrice && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleClearZone(z.zoneId)}
                          title={locale === "ar" ? "إلغاء التخصيص والعودة للافتراضي" : "Reset to default"}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 5. Floating Bottom Save Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-card border shadow-md sticky bottom-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
          <span>
            {locale === "ar"
              ? "لا تنسَ الضغط على زر الحفظ بالأسفل بعد الانتهاء من إدخال وتعديل الأسعار."
              : "Remember to save your changes when finished."}
          </span>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="font-bold gap-2 px-6 shadow-sm"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {ar ? `حفظ تسعيرات ${serviceName}` : `Save ${serviceName} Prices`}
        </Button>
      </div>
    </div>
  );
}
