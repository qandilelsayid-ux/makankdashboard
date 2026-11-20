import { fetchHelper } from "@/api/fetch";
import SelectPaginated from "@/components/common/Inputs/select/SelectPaginatedInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLocale, useTranslations } from "@/lib/i18n";
import { useRouter } from "@/lib/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type CommissionType = "PERCENTAGE" | "FIXED";
// STORE = the whole store (the store commission). The others set a commission
// for part of the catalog that replaces the store commission there.
type Scope = "STORE" | "CATEGORY" | "PRODUCTS" | "DISCOUNTED";

interface CustomCommissionRow {
  id: number;
  name: Record<string, string> | string;
  price: number;
  priceAfterDiscount: number | null;
  hasDiscount: boolean;
  customCommission: number;
  customCommissionType: CommissionType;
  Category?: { id: number; name: Record<string, string> | string } | null;
}

interface StoreCommotionButtonProps {
  storeId: number;
  initialValue?: number;
  initialType?: CommissionType;
}

export function StoreCommotionButton({
  storeId,
  initialValue = 0,
  initialType = "PERCENTAGE"
}: StoreCommotionButtonProps) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<Scope>("STORE");
  const [value, setValue] = useState<number>(initialValue);
  const [commissionType, setCommissionType] = useState<CommissionType>(initialType);
  const [categoryId, setCategoryId] = useState<string>("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rows, setRows] = useState<CustomCommissionRow[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [removingId, setRemovingId] = useState<number | "all" | null>(null);

  const text = (v: unknown) =>
    typeof v === "string" ? v : (v as any)?.[locale] ?? (v as any)?.ar ?? (v as any)?.en ?? "";

  useEffect(() => {
    if (scope === "STORE") {
      setValue(initialValue);
      setCommissionType(initialType);
    }
  }, [initialValue, initialType, scope]);

  const loadRows = useCallback(async () => {
    setLoadingRows(true);
    const res = await fetchHelper({
      endPoint: ["stores", storeId, "storeCustomCommission"],
      isLocalized: false
    });
    setRows(res.success && Array.isArray(res.data) ? (res.data as CustomCommissionRow[]) : []);
    setLoadingRows(false);
  }, [storeId]);

  useEffect(() => {
    if (open) loadRows();
  }, [open, loadRows]);

  const normalizedValue = useMemo(() => {
    if (Number.isNaN(Number(value))) return 0;
    const positiveValue = Math.max(0, Number(value));
    return commissionType === "PERCENTAGE" ? Math.min(100, positiveValue) : positiveValue;
  }, [commissionType, value]);

  const resetScope = () => {
    setCategoryId("");
    setServiceIds([]);
  };

  const handleSave = async () => {
    if (scope === "CATEGORY" && !categoryId) {
      toast.error(t("chooseCommissionCategory"));
      return;
    }
    if (scope === "PRODUCTS" && serviceIds.length === 0) {
      toast.error(t("chooseCommissionProducts"));
      return;
    }
    setIsSaving(true);

    const res =
      scope === "STORE"
        ? await fetchHelper({
            endPoint: ["stores", storeId, "commission"],
            method: "PATCH",
            body: { commission: Number(normalizedValue), commissionType }
          })
        : await fetchHelper({
            endPoint: ["stores", storeId, "storeCustomCommission"],
            method: "PATCH",
            body: {
              commission: Number(normalizedValue),
              commissionType,
              ...(scope === "CATEGORY" ? { categoryId: Number(categoryId) } : {}),
              ...(scope === "PRODUCTS" ? { serviceIds: serviceIds.map(Number) } : {}),
              ...(scope === "DISCOUNTED" ? { onlyDiscounted: true } : {})
            }
          });

    if (res.success) {
      const applied = (res.data as any)?.appliedCount;
      toast.success(t("done"), {
        description:
          scope === "STORE"
            ? t("commotionUpdated")
            : t("customCommissionApplied").replace("{count}", String(applied ?? 0))
      });
      if (scope === "STORE") {
        setOpen(false);
        router.refresh();
      } else {
        // Stay open so several categories/products can be set in a row; the
        // store page itself doesn't show per-product commission.
        resetScope();
        loadRows();
      }
    } else {
      toast.error(t("error"), { description: res?.result?.message ?? t("error") });
    }

    setIsSaving(false);
  };

  const handleRemove = async (serviceId?: number) => {
    setRemovingId(serviceId ?? "all");
    const res = await fetchHelper({
      endPoint: ["stores", storeId, "storeCustomCommissionRemove"],
      method: "PATCH",
      body: serviceId ? { serviceIds: [serviceId] } : {}
    });
    if (res.success) {
      toast.success(t("customCommissionRemoved"));
      loadRows();
    } else {
      toast.error(t("error"), { description: res?.result?.message ?? t("error") });
    }
    setRemovingId(null);
  };

  const scopes: Scope[] = ["STORE", "CATEGORY", "PRODUCTS", "DISCOUNTED"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">{t("setCommotion")}</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("setCommotion")}</DialogTitle>
          <DialogDescription>{t("setCommotionDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>{t("commissionAppliesTo")}</Label>
            <RadioGroup
              value={scope}
              onValueChange={next => {
                setScope(next as Scope);
                resetScope();
              }}
              className="grid grid-cols-2 gap-2"
            >
              {scopes.map(s => (
                <Label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2.5 text-sm font-medium"
                >
                  <RadioGroupItem value={s} />
                  {t(`commissionScope_${s}`)}
                </Label>
              ))}
            </RadioGroup>
            {scope !== "STORE" && (
              <p className="text-xs text-muted-foreground">{t("customCommissionHint")}</p>
            )}
          </div>

          {scope === "CATEGORY" && (
            <div className="space-y-2">
              <Label>{t("Discount Category")}</Label>
              <SelectPaginated
                name="store-commission-category"
                value={categoryId}
                onChange={v => setCategoryId((v as string) ?? "")}
                apiUrl={["storeCategories"]}
                searchFilters={[{ key: "storeId", value: storeId }]}
                placeholder={t("chooseCommissionCategory")}
              />
            </div>
          )}

          {scope === "PRODUCTS" && (
            <div className="space-y-2">
              <Label>{t("commissionProducts")}</Label>
              <SelectPaginated
                isMulti
                name="store-commission-products"
                value={serviceIds}
                onChange={v => setServiceIds(Array.isArray(v) ? (v as any[]).map(String) : [])}
                apiUrl={["services"]}
                searchTermKey="name"
                searchFilters={[{ key: "storeId", value: storeId }]}
                placeholder={t("chooseCommissionProducts")}
              />
            </div>
          )}

          {scope === "DISCOUNTED" && (
            <p className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
              {t("commissionDiscountedHint")}
            </p>
          )}

          <RadioGroup
            value={commissionType}
            onValueChange={nextType => setCommissionType(nextType as CommissionType)}
            className="grid grid-cols-2 gap-3"
          >
            {(["PERCENTAGE", "FIXED"] as CommissionType[]).map(type => (
              <Label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm font-medium"
              >
                <RadioGroupItem value={type} />
                {t(type)}
              </Label>
            ))}
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="store-commission-value">{t("Store Commission")}</Label>
            <Input
              id="store-commission-value"
              type="number"
              min={0}
              max={commissionType === "PERCENTAGE" ? 100 : undefined}
              value={Number.isNaN(Number(value)) ? "" : value}
              onChange={e => {
                const nextValue = Number(e.target.value);
                setValue(Number.isNaN(nextValue) ? 0 : nextValue);
              }}
              placeholder={commissionType === "PERCENTAGE" ? "0 - 100" : "0"}
            />
          </div>
          {scope === "STORE" && (
            <p className="text-sm text-muted-foreground">
              {t("currentValue")}:{" "}
              <span className="font-medium text-foreground">
                {commissionType === "PERCENTAGE" ? `${normalizedValue}%` : normalizedValue}
              </span>
            </p>
          )}

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between gap-2">
              <Label>{t("productsWithCustomCommission")}</Label>
              {rows.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-destructive"
                  onClick={() => handleRemove()}
                  disabled={removingId !== null}
                >
                  {removingId === "all" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  {t("removeAllCustomCommission")}
                </Button>
              )}
            </div>
            {loadingRows ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : rows.length === 0 ? (
              <p className="text-xs text-muted-foreground">{t("noCustomCommission")}</p>
            ) : (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {rows.map(r => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{text(r.name)}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {text(r.Category?.name)}
                        {r.hasDiscount ? ` · ${t("hasDiscountLabel")}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <span className="font-medium">
                        {r.customCommissionType === "PERCENTAGE"
                          ? `${r.customCommission}%`
                          : r.customCommission}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleRemove(r.id)}
                        disabled={removingId !== null}
                        aria-label={t("removeAllCustomCommission")}
                      >
                        {removingId === r.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
