import { fetchHelper } from "@/api/fetch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import SelectPaginated from "@/components/common/Inputs/select/SelectPaginatedInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Gift, ImagePlus, Save, Send, Trash2 } from "lucide-react";
import type { endpointType } from "@/utils/endpoints";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useRouter } from "@/lib/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type CampaignFormType = "NOTIFICATION" | "OFFER";
type IncentiveType = "none" | "freeDelivery" | "discount";
type CampaignTargetType = "ALL" | "CUSTOMER" | "STORE" | "SERVICE" | "SELECTED_USERS" | "DELIVERY" | "SPECIAL_DRIVER";

type LocalizedText = string | { ar?: string; en?: string } | null | undefined;

type CampaignData = {
  id?: number;
  type?: CampaignFormType;
  title?: LocalizedText;
  description?: LocalizedText;
  featureText?: LocalizedText;
  valueText?: LocalizedText;
  image?: string | null;
  targetType?: CampaignTargetType;
  targetUserIds?: Array<string | number>;
  storeId?: string | number | null;
  serviceId?: string | number | null;
  startAt?: string | null;
  endAt?: string | null;
  displayIntervalHours?: number | null;
  clickTargetType?: string;
  clickStoreId?: string | number | null;
  clickCategoryId?: string | number | null;
  clickServiceId?: string | number | null;
  clickDeliveryId?: string | number | null;
  clickUrl?: string;
  deliveryId?: string | null;
};

type CampaignFormState = {
  type: CampaignFormType;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  incentiveType: IncentiveType;
  discountValueAr: string;
  discountValueEn: string;
  image: File | null;
  targetType: CampaignTargetType;
  targetUserIds: string[];
  storeId: string;
  serviceId: string;
  startAt: string;
  endAt: string;
  displayIntervalHours: string;
  clickTargetType: string;
  clickStoreId: string;
  clickCategoryId: string;
  clickServiceId: string;
  clickDeliveryId: string;
  clickUrl: string;
  deliveryId: string;
};

const incentiveTypes: IncentiveType[] = ["none", "freeDelivery", "discount"];
const targetTypes: CampaignTargetType[] = ["ALL", "CUSTOMER", "STORE", "SERVICE", "SELECTED_USERS"];
const intervalOptions = ["0", "1", "6", "12", "24", "48"];

function getLocalizedText(value: LocalizedText, locale: string) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[locale as "ar" | "en"] || value.ar || value.en || "";
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function toIsoDate(value: string) {
  return value ? new Date(value).toISOString() : "";
}

function getInitialForm(data?: CampaignData | null, locale = "ar"): CampaignFormState {
  const valueTextStr = data?.valueText ? getLocalizedText(data.valueText, locale) : "";
  const isFreeDelivery = valueTextStr.includes("توصيل") || valueTextStr.toLowerCase().includes("free");
  const incentiveType: IncentiveType = isFreeDelivery ? "freeDelivery" : (data?.valueText ? "discount" : "none");

  let discountValueAr = "";
  let discountValueEn = "";
  if (incentiveType === "discount" && data?.valueText) {
    if (typeof data.valueText === "object" && data.valueText !== null) {
      discountValueAr = data.valueText.ar || "";
      discountValueEn = data.valueText.en || "";
    } else if (typeof data.valueText === "string") {
      discountValueAr = data.valueText;
      discountValueEn = data.valueText;
    }

    if (discountValueAr.trim().startsWith("خصم")) {
      discountValueAr = discountValueAr.trim().substring(3).trim();
    }
    if (discountValueEn.trim().toLowerCase().endsWith("discount")) {
      const trimmed = discountValueEn.trim();
      discountValueEn = trimmed.substring(0, trimmed.length - 8).trim();
    }
  }

  return {
    type: data?.type || "NOTIFICATION",
    titleAr: typeof data?.title === "object" ? data?.title?.ar || "" : locale === "ar" ? data?.title || "" : "",
    titleEn: typeof data?.title === "object" ? data?.title?.en || "" : locale === "en" ? data?.title || "" : "",
    descriptionAr: typeof data?.description === "object" ? data?.description?.ar || "" : locale === "ar" ? data?.description || "" : "",
    descriptionEn: typeof data?.description === "object" ? data?.description?.en || "" : locale === "en" ? data?.description || "" : "",
    incentiveType,
    discountValueAr,
    discountValueEn,
    image: null,
    targetType: data?.targetType || "ALL",
    targetUserIds: data?.targetUserIds?.map(String) || [],
    storeId: data?.storeId ? String(data.storeId) : "",
    serviceId: data?.serviceId ? String(data.serviceId) : "",
    startAt: toDatetimeLocal(data?.startAt),
    endAt: toDatetimeLocal(data?.endAt),
    displayIntervalHours: data?.displayIntervalHours === null || data?.displayIntervalHours === undefined ? "24" : String(data.displayIntervalHours),
    clickTargetType: data?.clickTargetType ?? "GENERAL",
    clickStoreId: data?.clickStoreId ? String(data.clickStoreId) : "",
    clickCategoryId: data?.clickCategoryId ? String(data.clickCategoryId) : "",
    clickServiceId: data?.clickServiceId ? String(data.clickServiceId) : "",
    clickDeliveryId: data?.clickDeliveryId ? String(data.clickDeliveryId) : "",
    clickUrl: data?.clickUrl ?? "",
    deliveryId: data?.deliveryId ? String(data.deliveryId) : ""
  };
}

export default function CampaignCreateClient({ data }: { data?: CampaignData | null }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<CampaignFormState>(() => getInitialForm(data, locale));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEdit = Boolean(data?.id);

  const isOffer = form.type === "OFFER";
  const requiresDescription = form.type === "NOTIFICATION";
  const requiresStore = form.targetType === "STORE" || form.targetType === "SERVICE";
  const requiresService = form.targetType === "SERVICE";
  const requiresUsers = form.targetType === "SELECTED_USERS";

  const storesApiUrl = useMemo<endpointType>(() => ["stores"], []);
  const servicesApiUrl = useMemo<endpointType>(() => ["services"], []);
  const customersApiUrl = useMemo<endpointType>(() => ["customers"], []);
  const deliveryApiUrl = useMemo<endpointType>(() => ["delivery"], []);
  const serviceSearchFilters = useMemo(() => form.storeId ? [{ key: "storeId", value: form.storeId }] : [], [form.storeId]);
  const clickServiceSearchFilters = useMemo(() => form.clickStoreId ? [{ key: "storeId", value: form.clickStoreId }] : [], [form.clickStoreId]);

  const existingImageLabel = useMemo(() => data?.image ? String(data.image).split("/").pop() : "", [data?.image]);

  const updateForm = <K extends keyof CampaignFormState>(field: K, value: CampaignFormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: CampaignFormType) => {
    setForm(prev => {
      const isServiceToNotif = type === "NOTIFICATION" && prev.targetType === "SERVICE";
      const isDeliveryToOffer = type === "OFFER" && prev.targetType === "DELIVERY";
      
      return {
        ...prev,
        type,
        targetType: (isServiceToNotif || isDeliveryToOffer) ? "ALL" : prev.targetType
      };
    });
  };

  const handleTargetChange = (targetType: CampaignTargetType) => {
    setForm(prev => ({
      ...prev,
      targetType,
      storeId: targetType === "STORE" || targetType === "SERVICE" ? prev.storeId : "",
      serviceId: targetType === "SERVICE" ? prev.serviceId : "",
      targetUserIds: targetType === "SELECTED_USERS" ? prev.targetUserIds : [],
      deliveryId: targetType === "SPECIAL_DRIVER" ? prev.deliveryId : ""
    }));
  };

  const handleClickTargetChange = (type: string) => {
    setForm(prev => ({
      ...prev,
      clickTargetType: type,
      clickStoreId: "",
      clickCategoryId: "",
      clickServiceId: "",
      clickDeliveryId: "",
      clickUrl: ""
    }));
  };

  const buildPayload = () => {
    const body = new FormData();
    body.append("type", form.type);

    const trimmedTitleAr = form.titleAr.trim();
    const trimmedTitleEn = form.titleEn.trim();
    if (trimmedTitleAr || trimmedTitleEn || form.type === "NOTIFICATION") {
      body.append(
        "title",
        JSON.stringify({
          ar: trimmedTitleAr || trimmedTitleEn,
          en: trimmedTitleEn || trimmedTitleAr,
        })
      );
    }

    if (form.type === "NOTIFICATION") {
      if (form.descriptionAr || form.descriptionEn) {
        body.append("description", JSON.stringify({ ar: form.descriptionAr, en: form.descriptionEn }));
      }

      if (form.incentiveType === "freeDelivery") {
        const freeDeliveryText = { ar: "توصيل مجاني", en: "Free delivery" };
        body.append("featureText", JSON.stringify(freeDeliveryText));
        body.append("valueText", JSON.stringify(freeDeliveryText));
      } else if (form.incentiveType === "discount") {
        const arVal = form.discountValueAr.trim().startsWith("خصم")
          ? form.discountValueAr.trim()
          : `خصم ${form.discountValueAr.trim()}`;

        const enVal = form.discountValueEn.trim().toLowerCase().endsWith("discount")
          ? form.discountValueEn.trim()
          : `${form.discountValueEn.trim()} discount`;

        const discountText = { ar: arVal, en: enVal };
        body.append("featureText", JSON.stringify(discountText));
        body.append("valueText", JSON.stringify(discountText));
      }
    }

    if (form.image) body.append("image", form.image);
    body.append("targetType", form.targetType);

    if (requiresUsers) {
      const userIds = form.targetUserIds.map(Number).filter(Boolean);
      if (userIds.length > 0) {
        body.append("targetUserIds", JSON.stringify(userIds));
      }
    }

    if (requiresStore) body.append("storeId", form.storeId);
    if (requiresService) body.append("serviceId", form.serviceId);
    if (form.targetType === "SPECIAL_DRIVER" && form.deliveryId) body.append("deliveryId", form.deliveryId);

    if (form.startAt) body.append("startAt", toIsoDate(form.startAt));
    if (form.endAt) body.append("endAt", toIsoDate(form.endAt));
    if (form.displayIntervalHours !== "") body.append("displayIntervalHours", form.displayIntervalHours);

    return body;
  };

  const validate = () => {
    if (!isOffer && (!form.titleAr.trim() || !form.titleEn.trim())) return t("campaignTitleRequired");
    if (requiresDescription && (!form.descriptionAr.trim() || !form.descriptionEn.trim())) return t("campaignDescriptionRequired");
    if (!isOffer && form.incentiveType === "discount" && (!form.discountValueAr.trim() || !form.discountValueEn.trim())) return t("campaignDiscountValueRequired");
    if (isOffer && !form.image && !data?.image) return t("campaignImageRequired");
    if (requiresStore && !form.storeId) return t("campaignStoreRequired");
    if (requiresService && !form.serviceId) return t("campaignServiceRequired");
    if (requiresUsers && form.targetUserIds.length === 0) return t("campaignUsersRequired");
    if (form.clickTargetType === "SPECIAL_DRIVER" && !form.clickDeliveryId) return t("campaignDeliveryRequired");
    if (form.startAt && form.endAt && new Date(form.endAt).getTime() <= new Date(form.startAt).getTime()) return t("campaignEndAfterStartRequired");
    return "";
  };

  const handleSubmit = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      toast.error(validationMessage);
      return;
    }

    setIsSubmitting(true);
    let response;

    if (form.type === "NOTIFICATION") {
      // Sent as multipart whenever an image is attached (matches the backend's multipart
      // gotcha: once any field requires a file upload, every field arrives as a string —
      // FormData already stringifies everything, so this is naturally correct either way).
      const body = new FormData();
      body.append("title", JSON.stringify({ ar: form.titleAr, en: form.titleEn }));
      body.append("body", JSON.stringify({ ar: form.descriptionAr, en: form.descriptionEn }));
      body.append("targetType", form.targetType);
      const userIds = form.targetUserIds.map(Number).filter(Boolean);
      if (userIds.length > 0) {
        body.append("targetUserIds", JSON.stringify(userIds));
      }
      if (form.storeId) body.append("storeId", form.storeId);
      body.append("clickTargetType", form.clickTargetType);
      if (form.clickStoreId) body.append("clickStoreId", form.clickStoreId);
      if (form.clickCategoryId) body.append("clickCategoryId", form.clickCategoryId);
      if (form.clickServiceId) body.append("clickServiceId", form.clickServiceId);
      if (form.clickTargetType === "SPECIAL_DRIVER" && form.clickDeliveryId) {
        body.append("clickDeliveryId", form.clickDeliveryId);
      }
      if (form.clickTargetType === "URL" && form.clickUrl) {
        body.append("clickUrl", form.clickUrl);
      }
      if (form.image) body.append("image", form.image);

      response = await fetchHelper({
        endPoint: isEdit && data?.id ? ["adminNotifications", data.id] : ["adminNotifications"],
        method: isEdit ? "PATCH" : "POST",
        body,
        redirectOnUnauthorized: false
      });
    } else {
      response = await fetchHelper({
        endPoint: isEdit && data?.id ? ["campaigns", data.id] : ["campaigns"],
        method: isEdit ? "PATCH" : "POST",
        body: buildPayload(),
        redirectOnUnauthorized: false
      });
    }
    
    setIsSubmitting(false);

    if (response?.success) {
      const reachedCount = (response?.data as { reachedCount?: number } | null)?.reachedCount;
      toast.success(
        reachedCount !== undefined
          ? `${t("Success")} · ${t("reachedCustomers")}: ${reachedCount}`
          : t("Success")
      );
      router.push("/campaigns");
      router.refresh();
    } else {
      toast.error(response?.message || t("Something went wrong"));
    }
  };

  return (
    <Card className="overflow-hidden border-gray-200/80 bg-white dark:border-gray-800 dark:bg-slate-950">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl">{t("createCampaign")}</CardTitle>
            <CardDescription className="mt-2">{t("createCampaignDescription")}</CardDescription>
          </div>
          <Badge variant="info" className="rounded-full">
            {isEdit ? t("Edit") : t("connectedToApi")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-3 md:grid-cols-2">
          <button
            type="button"
            onClick={() => handleTypeChange("NOTIFICATION")}
            className={`rounded-2xl border p-5 text-start transition ${form.type === "NOTIFICATION" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
          >
            <Bell className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{t("campaignTypeValue.notification")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("notificationCampaignDescription")}</p>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("OFFER")}
            className={`rounded-2xl border p-5 text-start transition ${form.type === "OFFER" ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
          >
            <Gift className="mb-3 h-6 w-6 text-primary" />
            <h3 className="font-semibold">{t("campaignTypeValue.offer")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("offerCampaignDescription")}</p>
          </button>
        </div>

        {form.type === "NOTIFICATION" && !isEdit && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-200">
            <Send className="mt-0.5 h-4 w-4" />
            <p>{t("notificationSendsImmediatelyNote")}</p>
          </div>
        )}

        <div className="grid gap-5 rounded-2xl border bg-muted/20 p-5">
          <h3 className="font-semibold">{t("campaignContent")}</h3>
          {isOffer && (
            <p className="text-xs text-muted-foreground">
              {locale === "ar"
                ? "البوب-أب يعرض الصورة فقط للعميل (مع زر «اطلب دلوقتي» إذا تم ربطه بمطعم أو منتج أو خدمة توصيل). العنوان بالأسفل اسم داخلي اختياري للأدمن فقط."
                : "Popup offers show only the uploaded image to customers (plus an \"Order Now\" button when linked to a store, product, or driver). Title fields below are optional internal admin labels."}
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>{t("titleAr")} {isOffer ? `(${t("optional")})` : ""}</Label>
              <Input value={form.titleAr} onChange={event => updateForm("titleAr", event.target.value)} placeholder={t("campaignTitlePlaceholder")} />
            </div>
            <div className="grid gap-2">
              <Label>{t("titleEn")} {isOffer ? `(${t("optional")})` : ""}</Label>
              <Input value={form.titleEn} onChange={event => updateForm("titleEn", event.target.value)} placeholder={t("campaignTitlePlaceholder")} />
            </div>
            {!isOffer && (
              <>
                <div className="grid gap-2">
                  <Label>{t("descriptionAr")} {requiresDescription ? "*" : `(${t("optional")})`}</Label>
                  <Textarea value={form.descriptionAr} onChange={event => updateForm("descriptionAr", event.target.value)} placeholder={t("campaignDescriptionPlaceholder")} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("descriptionEn")} {requiresDescription ? "*" : `(${t("optional")})`}</Label>
                  <Textarea value={form.descriptionEn} onChange={event => updateForm("descriptionEn", event.target.value)} placeholder={t("campaignDescriptionPlaceholder")} />
                </div>
                <div className="grid gap-2">
                  <Label>{t("rewardType")}</Label>
                  <Select value={form.incentiveType} onValueChange={value => updateForm("incentiveType", value as IncentiveType)}>
                    <SelectTrigger><SelectValue placeholder={t("rewardType")} /></SelectTrigger>
                    <SelectContent>
                      {incentiveTypes.map(type => <SelectItem key={type} value={type}>{t(`campaignIncentiveType.${type}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.incentiveType === "discount" && (
                  <>
                    <div className="grid gap-2">
                      <Label>{t("valueAr")} *</Label>
                      <Input value={form.discountValueAr} onChange={event => updateForm("discountValueAr", event.target.value)} placeholder={t("campaignValuePlaceholder")} />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("valueEn")} *</Label>
                      <Input value={form.discountValueEn} onChange={event => updateForm("discountValueEn", event.target.value)} placeholder={t("campaignValuePlaceholder")} />
                    </div>
                  </>
                )}
              </>
            )}
            {(isOffer || form.type === "NOTIFICATION") && (
            <div className="grid gap-2">
              <Label>{isOffer ? `${t("Offer Image")} *` : t("Notification Image (optional)")}</Label>
              <div className="flex gap-2 items-center">
                <Input id="campaign-image-input" type="file" accept="image/*" onChange={event => updateForm("image", event.target.files?.[0] ?? null)} />
                {form.image && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      updateForm("image", null);
                      const input = document.getElementById("campaign-image-input") as HTMLInputElement;
                      if (input) input.value = "";
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {t("Remove")}
                  </Button>
                )}
              </div>
              {existingImageLabel && <p className="text-xs text-muted-foreground">{t("currentImage")}: {existingImageLabel}</p>}
            </div>
            )}
          </div>
        </div>

        <div className="grid gap-5 rounded-2xl border bg-muted/20 p-5">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t("targeting")}</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-3 items-end">
            <div className="grid gap-2">
              <Label>{t("targetType")}</Label>
              <Select 
                value={form.targetType} 
                onValueChange={value => handleTargetChange(value as CampaignTargetType)}
              >
                <SelectTrigger><SelectValue placeholder={t("targetType")} /></SelectTrigger>
                <SelectContent>
                  {(form.type === "NOTIFICATION" 
                    ? ["ALL", "CUSTOMER", "STORE", "DELIVERY", "SELECTED_USERS"] 
                    : ["ALL", "CUSTOMER", "STORE", "SERVICE", "SELECTED_USERS", "SPECIAL_DRIVER"]
                  ).map(type => (
                    <SelectItem key={type} value={type}>
                      {t(`campaignTargetType.${type}`) || t(type) || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.targetType !== "SPECIAL_DRIVER" && (
              <div className="grid gap-2">
                <Label>{t("store")} {requiresStore ? "*" : `(${t("optional")})`}</Label>
                <SelectPaginated
                  name="storeId"
                  apiUrl={storesApiUrl}
                  searchTermKey="name"
                  value={form.storeId}
                  disabled={!requiresStore}
                  onChange={value => updateForm("storeId", value ? String(value) : "")}
                  placeholder={t("store")}
                />
              </div>
            )}

            {form.targetType !== "SPECIAL_DRIVER" && (
              <div className="grid gap-2">
                <Label>{t("products")} {requiresService ? "*" : `(${t("optional")})`}</Label>
                <SelectPaginated
                  name="serviceId"
                  apiUrl={servicesApiUrl}
                  value={form.serviceId}
                  disabled={!requiresService || !form.storeId}
                  searchFilters={serviceSearchFilters}
                  labelFormat="serviceStore"
                  onChange={value => updateForm("serviceId", value ? String(value) : "")}
                  placeholder={t("products")}
                />
              </div>
            )}

            {form.targetType === "SPECIAL_DRIVER" && (
              <div className="grid gap-2">
                <Label>{t("Delivery")} *</Label>
                <Select
                  value={form.deliveryId}
                  onValueChange={value => updateForm("deliveryId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("Delivery") || "اختر نوع التوصيل"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESTAURANT">{t("RESTAURANT") || "مندوب مطاعم"}</SelectItem>
                    <SelectItem value="PURCHASE">{t("PURCHASE") || "مندوب مشتريات"}</SelectItem>
                    <SelectItem value="ONLINE">{t("ONLINE") || "مندوب أونلاين"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {requiresUsers && (
              <div className="grid gap-2 md:col-span-3">
                <Label>{t("selectedCustomers")} *</Label>
                <SelectPaginated
                  isMulti
                  name="targetUserIds"
                  apiUrl={customersApiUrl}
                  searchTermKey="name"
                  value={form.targetUserIds}
                  onChange={value => updateForm("targetUserIds", Array.isArray(value) ? value.map(item => String(item.value ?? item)) : [])}
                  placeholder={t("selectedCustomers")}
                />
              </div>
            )}
          </div>
        </div>

        {form.type === "NOTIFICATION" && (
          <div className="grid gap-5 rounded-2xl border bg-muted/20 p-5">
            <h3 className="font-semibold">{t("clickAction") || "Click Action"}</h3>
            <div className="grid gap-4 md:grid-cols-3 items-end">
              <div className="grid gap-2">
                <Label>{t("clickTargetTypeLabel")}</Label>
                <Select
                  value={form.clickTargetType}
                  onValueChange={value => handleClickTargetChange(value)}
                >
                  <SelectTrigger><SelectValue placeholder={t("clickTargetType") || "Select Type"} /></SelectTrigger>
                  <SelectContent>
                    {["GENERAL", "STORE", "CATEGORY", "SERVICE", "SPECIAL_DRIVER", "URL"].map(type => (
                      <SelectItem key={type} value={type}>
                        {t(`clickTargetType.${type}`) || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.clickTargetType === "STORE" && (
                <div className="grid gap-2">
                  <Label>{t("store")} *</Label>
                  <SelectPaginated
                    name="clickStoreId"
                    apiUrl={storesApiUrl}
                    searchTermKey="name"
                    value={form.clickStoreId}
                    onChange={value => updateForm("clickStoreId", value ? String(value) : "")}
                    placeholder={t("store")}
                  />
                </div>
              )}

              {form.clickTargetType === "CATEGORY" && (
                <div className="grid gap-2">
                  <Label>{t("category")} *</Label>
                  <SelectPaginated
                    name="clickCategoryId"
                    apiUrl={["categories"]}
                    value={form.clickCategoryId}
                    onChange={value => updateForm("clickCategoryId", value ? String(value) : "")}
                    placeholder={t("category")}
                  />
                </div>
              )}

              {form.clickTargetType === "SERVICE" && (
                <>
                  <div className="grid gap-2">
                    <Label>{t("store")} *</Label>
                    <SelectPaginated
                      name="clickStoreId"
                      apiUrl={storesApiUrl}
                      searchTermKey="name"
                      value={form.clickStoreId}
                      onChange={value => {
                        setForm(prev => ({
                          ...prev,
                          clickStoreId: value ? String(value) : "",
                          clickServiceId: ""
                        }));
                      }}
                      placeholder={t("store")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("products")} *</Label>
                    <SelectPaginated
                      name="clickServiceId"
                      apiUrl={servicesApiUrl}
                      value={form.clickServiceId}
                      disabled={!form.clickStoreId}
                      searchFilters={clickServiceSearchFilters}
                      labelFormat="serviceStore"
                      onChange={value => updateForm("clickServiceId", value ? String(value) : "")}
                      placeholder={t("products")}
                    />
                  </div>
                </>
              )}

              {form.clickTargetType === "SPECIAL_DRIVER" && (
                <div className="grid gap-2">
                  <Label>{t("Delivery")} *</Label>
                  <Select
                    value={form.clickDeliveryId}
                    onValueChange={value => updateForm("clickDeliveryId", value)}
                  >
                    <SelectTrigger><SelectValue placeholder={t("Delivery") || "Select Delivery Type"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RESTAURANT">{t("RESTAURANT") || "مندوب مطاعم"}</SelectItem>
                      <SelectItem value="PURCHASE">{t("PURCHASE") || "مندوب مشتريات"}</SelectItem>
                      <SelectItem value="ONLINE">{t("ONLINE") || "مندوب أونلاين"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.clickTargetType === "URL" && (
                <div className="grid gap-2 md:col-span-2">
                  <Label>{t("url")} *</Label>
                  <Input
                    value={form.clickUrl}
                    onChange={event => updateForm("clickUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {isOffer && (
          <div className="grid gap-5 rounded-2xl border bg-muted/20 p-5">
            <h3 className="font-semibold">{t("campaignTiming")}</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>{t("appearanceInterval")}</Label>
                <Select value={form.displayIntervalHours} onValueChange={value => updateForm("displayIntervalHours", value)}>
                  <SelectTrigger><SelectValue placeholder={t("appearanceInterval")} /></SelectTrigger>
                  <SelectContent>
                    {intervalOptions.map(interval => <SelectItem key={interval} value={interval}>{interval === "0" ? t("showEveryFetch") : `${interval} ${t("hours")}`}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("startDate")} ({t("optional")})</Label>
                <Input type="datetime-local" value={form.startAt} onChange={event => updateForm("startAt", event.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t("endDate")} ({t("optional")})</Label>
                <Input type="datetime-local" value={form.endAt} onChange={event => updateForm("endAt", event.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" className="min-w-[180px]" disabled={isSubmitting} onClick={handleSubmit}>
            <Save className="h-4 w-4" />
            {isSubmitting ? t("Loading") : t("Save Changes")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
