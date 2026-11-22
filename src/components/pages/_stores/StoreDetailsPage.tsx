import { stores } from "@/pages/dashboard/stores/types";
import ResetPeriodButton from "@/components/pages/_dashboard/ResetPeriodButton";
import { StoreAbout } from "./details/StoreAbout";
import { StoreCommotionButton } from "./details/StoreCommotionButton";
import { ApplyTemplateButton } from "./details/ApplyTemplateButton";
import { StoreApprovalAction } from "./StoreApprovalAction";
import { StoreHero } from "./details/StoreHero";
import { StoreSidebar } from "./details/StoreSidebar";
import { StoreStats } from "./details/StoreStats";
import { StoreTabs } from "./details/StoreTabs";
import { StoreManagedByAdminToggle } from "./details/StoreManagedByAdminToggle";
import { StoreDiscountButton } from "./details/StoreDiscountButton";
import { StorePickupToggle } from "./details/StorePickupToggle";
import { StorePrepTimeButton } from "./details/StorePrepTimeButton";
import { StoreReportDialog } from "./details/StoreReportDialog";
import { StoreSettleWalletButton } from "./details/StoreSettleWalletButton";
import { StoreSettleFortuneDiscountButton } from "./details/StoreSettleFortuneDiscountButton";
import { useTranslations } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";

interface StoreDetailsPageProps {
  data: stores;
  branches: ApiResponse<any[]>;
  categories: ApiResponse<any[]>;
  orders: ApiResponse<any[]>;
  services: ApiResponse<any[]>;
  appliedTemplates: ApiResponse<any[]>;
  bundles: ApiResponse<any[]>;
}

export default function StoreDetailsPage({
  data,
  branches,
  categories,
  orders,
  services,
  appliedTemplates,
  bundles
}: StoreDetailsPageProps) {
  const t = useTranslations();
  const currentCommission = Number((data as any)?.commission ?? (data as any)?.commotion ?? 0);
  const currentCommissionType = ((data as any)?.commissionType === "FIXED" ? "FIXED" : "PERCENTAGE") as
    | "PERCENTAGE"
    | "FIXED";
  const commissionLabel =
    currentCommissionType === "PERCENTAGE" ? `${currentCommission}%` : String(currentCommission);

  const currentDiscount = Number((data as any)?.discountValue ?? (data as any)?.discount ?? 0);
  const currentDiscountType = ((data as any)?.discountType === "FIXED" ? "FIXED" : "PERCENTAGE") as
    | "PERCENTAGE"
    | "FIXED";
  const discountLabel =
    currentDiscountType === "PERCENTAGE" ? `${currentDiscount}%` : String(currentDiscount);
  const hasDiscount = currentDiscount > 0;

  const walletBalance =
    ((data as any)?.branches || []).reduce(
      (acc: number, b: any) => acc + Number(b?.Wallet?.currentBalance || 0),
      0
    ) || 0;

  const accumulatedDiscount =
    ((data as any)?.branches || []).reduce(
      (acc: number, b: any) => acc + Number(b?.Wallet?.accumulatedFortuneDiscount || 0),
      0
    ) || 0;
  const pendingPlatformSubsidy = accumulatedDiscount / 2;

  const isPendingApproval = (data as any)?.isStoreAccepted === false;

  return (
    <div className="flex flex-col gap-8 pb-20">
      {isPendingApproval && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {t("storePendingReviewBanner")}
          </div>
          <StoreApprovalAction storeId={Number(data.id)} />
        </div>
      )}

      {/* Hero + commission action in one strip */}
      <div className="space-y-3">
        <StoreHero data={data} />
        {/* Info badges — commission & discount */}
        <div className="flex flex-wrap items-center gap-2 px-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border">
            <span>{t("Store Commission")}:</span>
            <span className="text-foreground font-semibold">{commissionLabel}</span>
            <span className="text-xs">({t(currentCommissionType)})</span>
          </div>
          {hasDiscount && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-orange-500/10 dark:bg-orange-500/20 px-3 py-1.5 rounded-lg border border-orange-400/40">
              <span>{t("Store Discount")}:</span>
              <span className="text-orange-600 dark:text-orange-400 font-semibold">{discountLabel}</span>
              <span className="text-xs">({t(currentDiscountType)})</span>
            </div>
          )}
          {accumulatedDiscount > 0 && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-400/40">
              <span>{t("Unsettled Fortune Discounts") || "خصومات معلقة"}:</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">{accumulatedDiscount.toFixed(2)} {t("EGP") || "ج.م"}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">(دعم المنصة 50%: {pendingPlatformSubsidy.toFixed(2)} ج.م)</span>
            </div>
          )}
        </div>

        {/* Action buttons — scrollable row on mobile */}
        <div className="flex items-center gap-2 px-1 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <StoreManagedByAdminToggle
              storeId={Number(data.id)}
              initialEnabled={(data as any).managedByAdmin}
            />
            <StorePickupToggle
              storeId={Number(data.id)}
              initialEnabled={(data as any).pickupEnabled}
            />
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-nowrap">
            <StoreDiscountButton
              storeId={Number(data.id)}
              initialDiscountType={currentDiscountType}
              initialDiscountValue={currentDiscount}
            />
            <ApplyTemplateButton storeId={Number(data.id)} />
            <StorePrepTimeButton
              storeId={Number(data.id)}
              initialPrepTime={Number((data as any)?.prepTimeMinutes ?? 0)}
              initialDeliveryMin={Number((data as any)?.deliveryTimeMinMinutes ?? 0)}
              initialDeliveryMax={Number((data as any)?.deliveryTimeMaxMinutes ?? 0)}
              initialMinOrderAmount={Number((data as any)?.minOrderAmount ?? 0)}
            />
            <StoreCommotionButton
              storeId={Number(data.id)}
              initialValue={currentCommission}
              initialType={currentCommissionType}
            />
            <ResetPeriodButton
              endPoint={["storeResetPeriod"]}
              label={t("Reset Store Period") || "تصفير فترة المتجر"}
              variant="secondary"
            />
            <StoreSettleWalletButton
              storeId={Number(data.id)}
              currentBalance={walletBalance}
              storeName={typeof data.name === "string" ? data.name : (data.name as any)?.ar ?? ""}
              isPartner={(data as any).isPartner}
            />
            <StoreSettleFortuneDiscountButton
              storeId={Number(data.id)}
              accumulatedDiscounts={accumulatedDiscount}
              storeName={typeof data.name === "string" ? data.name : (data.name as any)?.ar ?? ""}
            />
            <StoreReportDialog
              store={data}
              storeId={Number(data.id)}
            />
          </div>
        </div>
      </div>

      {/* Two-column: main content left, sidebar right */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <StoreStats data={data} />
          <StoreAbout data={data} />
        </div>

        {(data?.lat && data?.lng) && (
          <div className="lg:col-span-1">
            <StoreSidebar data={data} />
          </div>
        )}
      </div>

      {/* Full-width data tabs */}
      <StoreTabs
        branches={branches}
        categories={categories}
        orders={orders}
        services={services}
        appliedTemplates={appliedTemplates}
        bundles={bundles}
        storeId={Number(data.id)}
      />
    </div>
  );
}
