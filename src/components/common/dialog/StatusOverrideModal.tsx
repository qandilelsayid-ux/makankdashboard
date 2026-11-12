import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";

interface StatusOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { statusReason?: string; busyMinutes?: number }) => Promise<void>;
  status: string;
}

export default function StatusOverrideModal({
  isOpen,
  onClose,
  onConfirm,
  status
}: StatusOverrideModalProps) {
  const t = useTranslations();
  const [reasonType, setReasonType] = useState<string>("high_demand");
  const [customReason, setCustomReason] = useState<string>("");
  const [busyMinutes, setBusyMinutes] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReasonType("high_demand");
      setCustomReason("");
      setBusyMinutes(30);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let statusReason = "";
    if (reasonType === "high_demand") {
      statusReason = t("High demand of orders") || "ضغط طلبات";
    } else if (reasonType === "friday_prayer") {
      statusReason = "صلاة الجمعة / وقت الصلاة";
    } else if (reasonType === "power_outage") {
      statusReason = t("Power outage") || "انقطاع كهرباء";
    } else if (reasonType === "out_of_stock") {
      statusReason = t("Out of stock") || "نفاد خامات";
    } else {
      statusReason = customReason.trim() || t("Temporary suspension") || "إيقاف مؤقت";
    }

    try {
      await onConfirm({
        statusReason,
        ...(status === "BUSY" ? { busyMinutes: Number(busyMinutes) } : {})
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = status === "BUSY";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] rounded-lg shadow-xl text-gray-900 dark:text-gray-100 bg-white dark:bg-zinc-900" id="status-override-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {isBusy ? t("Specify Busy Details") || "تحديد تفاصيل حالة مشغول" : t("Specify Closure Details") || "تحديد تفاصيل الإيقاف مؤقتاً"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            {t("StatusDetailsDescription") || "يرجى تحديد سبب الإيقاف المؤقت أو تغيير حالة النشاط ليظهر للعملاء بشكل واضح."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {isBusy && (
            <div className="space-y-2">
              <Label htmlFor="busy-minutes" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t("Busy Duration (minutes)") || "مدة الانشغال (بالدقائق)"}
              </Label>
              <Input
                id="busy-minutes"
                type="number"
                min="1"
                required
                value={busyMinutes}
                onChange={(e) => setBusyMinutes(Number(e.target.value))}
                placeholder="30"
                className="w-full text-gray-900 dark:text-gray-100 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {t("Suspension Reason") || "سبب الإيقاف/الحالة"}
            </Label>
            <RadioGroup
              value={reasonType}
              onValueChange={setReasonType}
              className="flex flex-col gap-3"
            >
              <div className="flex items-center space-x-2 space-x-reverse gap-2">
                <RadioGroupItem value="high_demand" id="r-high_demand" />
                <Label htmlFor="r-high_demand" className="cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200">
                  {t("High demand of orders") || "ضغط طلبات"}
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse gap-2">
                <RadioGroupItem value="friday_prayer" id="r-friday_prayer" />
                <Label htmlFor="r-friday_prayer" className="cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200">
                  صلاة الجمعة / وقت الصلاة
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse gap-2">
                <RadioGroupItem value="power_outage" id="r-power_outage" />
                <Label htmlFor="r-power_outage" className="cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200">
                  {t("Power outage") || "انقطاع كهرباء"}
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse gap-2">
                <RadioGroupItem value="out_of_stock" id="r-out_of_stock" />
                <Label htmlFor="r-out_of_stock" className="cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200">
                  {t("Out of stock") || "نفاد خامات"}
                </Label>
              </div>

              <div className="flex items-center space-x-2 space-x-reverse gap-2">
                <RadioGroupItem value="custom" id="r-custom" />
                <Label htmlFor="r-custom" className="cursor-pointer font-medium text-sm text-gray-800 dark:text-gray-200">
                  {t("Other reason") || "سبب آخر..."}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {reasonType === "custom" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Label htmlFor="custom-reason" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {t("Write your reason") || "اكتب السبب بالتفصيل"}
              </Label>
              <Textarea
                id="custom-reason"
                required
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t("WriteReasonPlaceholder") || "أدخل تفاصيل السبب هنا (مثلاً: أعمال صيانة سنوية)"}
                className="w-full min-h-[80px] text-gray-900 dark:text-gray-100 bg-white dark:bg-zinc-800 border-gray-300 dark:border-zinc-700"
              />
            </div>
          )}

          <DialogFooter className="flex-row-reverse justify-end gap-2 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              {isSubmitting ? t("Saving...") || "جاري الحفظ..." : t("Save") || "حفظ"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={onClose}
              className="min-w-[100px]"
            >
              {t("Cancel") || "إلغاء"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
