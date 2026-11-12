import { useState, useEffect, useCallback } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiClient } from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n";

type AppClosurePreset = {
  id: "maintenance" | "friday_prayer" | "high_demand" | "custom";
  labelAr: string;
  labelEn: string;
  titleAr: string;
  titleEn: string;
  messageAr: string;
  messageEn: string;
};

const APP_CLOSURE_PRESETS: AppClosurePreset[] = [
  {
    id: "maintenance",
    labelAr: "أعمال صيانة وتحديث",
    labelEn: "Maintenance & Updates",
    titleAr: "التطبيق مغلق للصيانة",
    titleEn: "Under Maintenance",
    messageAr: "التطبيق مغلق حالياً لأعمال الصيانة والتحديث، سنعود قريباً!",
    messageEn: "The app is currently under maintenance, we will be back soon!",
  },
  {
    id: "friday_prayer",
    labelAr: "صلاة الجمعة / وقت الصلاة",
    labelEn: "Friday Prayer / Prayer Time",
    titleAr: "مغلق مؤقتاً لصلاة الجمعة",
    titleEn: "Closed for Friday Prayer",
    messageAr: "التطبيق متوقف مؤقتاً لوقت صلاة الجمعة، سنعود فور انتهاء الصلاة.",
    messageEn: "The app is temporarily paused for Friday prayer. We will resume right after prayer.",
  },
  {
    id: "high_demand",
    labelAr: "ضغط طلبات / مشغولون حالياً",
    labelEn: "Busy / High Demand",
    titleAr: "مشغولون حالياً لضغط الطلبات",
    titleEn: "Busy Due to High Demand",
    messageAr: "نعتذر عن استقبال الطلبات مؤقتاً بسبب ضغط الطلبات الحالي، سنعود قريباً.",
    messageEn: "Orders are temporarily paused due to high demand. Please check back shortly.",
  },
  {
    id: "custom",
    labelAr: "رسالة مخصصة...",
    labelEn: "Custom Message...",
    titleAr: "",
    titleEn: "",
    messageAr: "",
    messageEn: "",
  },
];

export function AppStatusToggle() {
  const locale = useLocale();

  const [isMaintenance, setIsMaintenance] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [nextValue, setNextValue] = useState(false);

  const [presetId, setPresetId] = useState<AppClosurePreset["id"]>("maintenance");
  const [titleAr, setTitleAr] = useState(APP_CLOSURE_PRESETS[0].titleAr);
  const [titleEn, setTitleEn] = useState(APP_CLOSURE_PRESETS[0].titleEn);
  const [messageAr, setMessageAr] = useState(APP_CLOSURE_PRESETS[0].messageAr);
  const [messageEn, setMessageEn] = useState(APP_CLOSURE_PRESETS[0].messageEn);

  // 1) On mount — GET current app status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/settings/app-status");
      const data = res?.data?.data ?? res?.data ?? {};
      setIsMaintenance(Boolean(data.isMaintenance));
    } catch {
      // silent fail — don't break the dashboard
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const applyPreset = (id: AppClosurePreset["id"]) => {
    setPresetId(id);
    const preset = APP_CLOSURE_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    if (id !== "custom") {
      setTitleAr(preset.titleAr);
      setTitleEn(preset.titleEn);
      setMessageAr(preset.messageAr);
      setMessageEn(preset.messageEn);
    } else {
      setTitleAr("");
      setTitleEn("");
      setMessageAr("");
      setMessageEn("");
    }
  };

  // 2) Ask for confirmation before toggling
  const handleToggleRequest = (checked: boolean) => {
    const closing = !checked;
    setNextValue(closing);
    if (closing) {
      applyPreset("maintenance");
    }
    setShowConfirm(true);
  };

  // 3) Confirmed — send PATCH
  const confirmToggle = async () => {
    if (nextValue && !messageAr.trim() && !messageEn.trim()) {
      toast.error(
        locale === "ar"
          ? "برجاء إدخال رسالة الإغلاق أو اختيار سبب جاهز"
          : "Please enter a closure message or choose a preset"
      );
      return;
    }

    const effectiveTitleAr = titleAr.trim() || titleEn.trim() || "التطبيق مغلق حالياً";
    const effectiveTitleEn = titleEn.trim() || titleAr.trim() || "App Temporarily Closed";
    const effectiveMessageAr = messageAr.trim() || messageEn.trim();
    const effectiveMessageEn = messageEn.trim() || messageAr.trim();

    setShowConfirm(false);
    setIsPending(true);
    try {
      await apiClient.patch("/api/settings/app-status", {
        isMaintenance: nextValue,
        ...(nextValue
          ? {
              titleAr: effectiveTitleAr,
              titleEn: effectiveTitleEn,
              messageAr: effectiveMessageAr,
              messageEn: effectiveMessageEn,
            }
          : {}),
      });
      setIsMaintenance(nextValue);
      toast.success(
        nextValue
          ? locale === "ar"
            ? "🔴 تم إغلاق التطبيق بالرسالة المحددة"
            : "🔴 App closed with selected message"
          : locale === "ar"
          ? "🟢 تم فتح التطبيق بنجاح"
          : "🟢 App is now open"
      );
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (locale === "ar" ? "فشل تحديث حالة التطبيق" : "Failed to update app status")
      );
    } finally {
      setIsPending(false);
    }
  };

  const statusLabel = isMaintenance
    ? locale === "ar"
      ? "مغلق للصيانة"
      : "Maintenance"
    : locale === "ar"
    ? "مفتوح"
    : "Open";

  const tooltipLabel = isLoading
    ? locale === "ar"
      ? "جاري التحقق من الحالة..."
      : "Checking status..."
    : isMaintenance
    ? locale === "ar"
      ? "التطبيق مغلق — اضغط لفتحه"
      : "App closed — click to open"
    : locale === "ar"
    ? "التطبيق مفتوح — اضغط للإغلاق للصيانة"
    : "App open — click to close for maintenance";

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 select-none">
              {/* Icon */}
              {isLoading || isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : isMaintenance ? (
                <ShieldAlert className="h-4 w-4 text-rose-500" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              )}

              {/* Status label – hidden on small screens */}
              <span
                className={`hidden sm:inline text-[11px] font-bold leading-none ${
                  isMaintenance ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {isLoading ? "..." : statusLabel}
              </span>

              {/* Switch: checked = app is OPEN (not maintenance) */}
              <Switch
                checked={!isMaintenance}
                onCheckedChange={handleToggleRequest}
                disabled={isLoading || isPending}
                aria-label="Toggle App Maintenance Mode"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs max-w-48 text-center">
            {tooltipLabel}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {nextValue ? (
                <>
                  <ShieldAlert className="h-5 w-5 text-rose-500" />
                  {locale === "ar" ? "تأكيد إغلاق التطبيق" : "Confirm App Closure"}
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  {locale === "ar" ? "تأكيد فتح التطبيق" : "Confirm App Opening"}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-1">
              {nextValue
                ? locale === "ar"
                  ? "اختر سبب الإغلاق أو اكتب رسالة مخصصة تظهر للعملاء حتى تعيد فتح التطبيق:"
                  : "Select a preset reason or write a custom message displayed to customers until you reopen the app:"
                : locale === "ar"
                ? "هل أنت متأكد من فتح التطبيق مجدداً؟ سيتمكن جميع المستخدمين من الدخول."
                : "Are you sure you want to reopen the app? All users will be able to access it."}
            </DialogDescription>
          </DialogHeader>

          {nextValue && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">
                  {locale === "ar" ? "سبب الإغلاق" : "Closure Reason"}
                </Label>
                <RadioGroup
                  value={presetId}
                  onValueChange={(val) =>
                    applyPreset(val as AppClosurePreset["id"])
                  }
                  className="grid gap-2"
                >
                  {APP_CLOSURE_PRESETS.map((preset) => (
                    <label
                      key={preset.id}
                      htmlFor={`app-closure-${preset.id}`}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer text-sm transition-colors ${
                        presetId === preset.id
                          ? "border-primary bg-primary/5 font-medium"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <RadioGroupItem
                        value={preset.id}
                        id={`app-closure-${preset.id}`}
                      />
                      <span>
                        {locale === "ar" ? preset.labelAr : preset.labelEn}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="app-closure-title-ar" className="text-xs">
                    {locale === "ar" ? "العنوان (عربي)" : "Title (Arabic)"}
                  </Label>
                  <Input
                    id="app-closure-title-ar"
                    value={titleAr}
                    onChange={(e) => setTitleAr(e.target.value)}
                    placeholder="مثال: مغلق مؤقتاً لصلاة الجمعة"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="app-closure-msg-ar" className="text-xs">
                    {locale === "ar" ? "الرسالة (عربي)" : "Message (Arabic)"}
                  </Label>
                  <Textarea
                    id="app-closure-msg-ar"
                    rows={2}
                    value={messageAr}
                    onChange={(e) => setMessageAr(e.target.value)}
                    placeholder="اكتب الرسالة التي ستظهر للعميل..."
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="app-closure-title-en" className="text-xs">
                    {locale === "ar"
                      ? "العنوان (إنجليزي - اختياري)"
                      : "Title (English - optional)"}
                  </Label>
                  <Input
                    id="app-closure-title-en"
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="Optional English title"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="app-closure-msg-en" className="text-xs">
                    {locale === "ar"
                      ? "الرسالة (إنجليزي - اختياري)"
                      : "Message (English - optional)"}
                  </Label>
                  <Textarea
                    id="app-closure-msg-en"
                    rows={2}
                    value={messageEn}
                    onChange={(e) => setMessageEn(e.target.value)}
                    placeholder="Optional English message..."
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm">
                {locale === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </DialogClose>
            <Button
              size="sm"
              onClick={confirmToggle}
              className={
                nextValue
                  ? "bg-rose-600 hover:bg-rose-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {nextValue
                ? locale === "ar"
                  ? "نعم، أغلق التطبيق"
                  : "Yes, Close App"
                : locale === "ar"
                ? "نعم، افتح التطبيق"
                : "Yes, Open App"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
