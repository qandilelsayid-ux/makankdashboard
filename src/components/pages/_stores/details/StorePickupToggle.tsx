"use client";

import { fetchHelper } from "@/api/fetch";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";

interface StorePickupToggleProps {
  storeId: number;
  initialEnabled?: boolean;
}

export function StorePickupToggle({
  storeId,
  initialEnabled = false
}: StorePickupToggleProps) {
  const t = useTranslations();
  const [enabled, setEnabled] = useState<boolean>(initialEnabled);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const handleToggle = async (checked: boolean) => {
    setIsToggling(true);
    const res = await fetchHelper({
      endPoint: ["stores", storeId, "storePickupToggle"],
      method: "PATCH",
      body: { enabled: checked }
    });

    if (res?.success) {
      setEnabled(checked);
      toast.success(
        checked ? t("storePickupEnabled") : t("storePickupDisabled")
      );
    } else {
      toast.error(res?.result?.message ?? t("error"));
    }
    setIsToggling(false);
  };

  return (
    <div className="flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-1.5 hover:bg-muted/50 transition-colors">
      {isToggling ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Store className={`h-4 w-4 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
      )}
      <Label
        htmlFor="store-pickup-toggle"
        className="text-sm font-medium cursor-pointer flex flex-col items-start gap-0.5"
      >
        <span>{t("storePickupLabel")}</span>
      </Label>
      <Switch
        id="store-pickup-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isToggling}
      />
    </div>
  );
}
