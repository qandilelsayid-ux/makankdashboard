import { fetchData } from "@/api/global/fetchData";
import DateCol from "@/components/common/table/columns/date.column";
import TableStatusBadge from "@/components/common/table/tableHelperComponents/TableStatusBadge";
import AddressInfo from "@/components/pages/_orders/AddressInfo";
import AssignOrderDeliveryDialog from "@/components/pages/_orders/AssignOrderDeliveryDialog";
import ComplaintsList from "@/components/pages/_orders/ComplaintsList";
import CustomerInfo from "@/components/pages/_orders/CustomerInfo";
import DeliveryInfo from "@/components/pages/_orders/DeliveryInfo";
import InvoiceCustomDeliveryInfo from "@/components/pages/_orders/InvoiceCustomDeliveryInfo";
import NoteForDeliveryDialog from "@/components/pages/_orders/NoteForDeliveryDialog";
import OrderItemsList from "@/components/pages/_orders/OrderItemsList";
import OrderStatusSelect from "@/components/pages/_orders/OrderStatusSelect";
import CopyOrderButton from "@/components/pages/_orders/CopyOrderButton";
import VerifyPaymentAction from "@/components/pages/_orders/VerifyPaymentAction";
import StoreInfo from "@/components/pages/_orders/StoreInfo";
import PrintOrderButton from "@/components/pages/_orders/PrintOrderButton";
import { CalendarClock } from "lucide-react";
import { PriceAmount } from "@/components/PriceAmount";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getTranslations, getLocale } from "@/lib/i18n";
import Image from "@/lib/Image";
import { getEnv } from "@/lib/env";
import { ApiResponse } from "../types";

const getImageUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${getEnv("VITE_API_IMG_URL")}${path}`;
};

async function page({ params }: { params: Params }): Promise<JSX.Element> {
  const t = await getTranslations();
  const locale = await getLocale();
  const getLocalizedName = (nameObj: any) => {
    if (!nameObj) return "";
    if (typeof nameObj === "string") return nameObj;
    return nameObj.ar || nameObj.en || "";
  };
  const formatMoneyVal = (value: number | string | null | undefined) => {
    const numberValue = Number(value ?? 0);
    return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
      maximumFractionDigits: 2
    }).format(Number.isFinite(numberValue) ? numberValue : 0);
  };
  const id = (await params).id;

  const [response, profileResponse] = await Promise.all([
    fetchData(["orders", Number(id)]),
    fetchData(["profile"]).catch(() => null),
  ]);
  const data = response?.data as ApiResponse;
  if (!data)
    return <div className="p-8 text-center text-muted-foreground">{t("No Data Available")}</div>;

  const userProfile = (profileResponse?.data as any)?.user ?? (profileResponse as any)?.user;
  const isSuperAdmin = Boolean(
    (userProfile?.roleKey === "Admin" || userProfile?.Role?.roleKey === "Admin" || userProfile?.Role?.key === "Admin") &&
    (userProfile?.Role?.default === true || userProfile?.default === true)
  );
  const customDeliveryStations = (data as any)?.Stations ?? (data as any)?.stations ?? [];
  const hasCustomDeliveryInfo =
    data?.invoice?.customDelivery ||
    customDeliveryStations.length > 0 ||
    (data as any)?.customDeliveryProgress;
  const combinedDiscount = Number((data as any)?.discountValue ?? data?.discountAmount ?? 0);
  const totalPrice = (data as any)?.totalPrice ?? data?.totalPriceAfterDiscount;
  const rawTax = Number(data?.tax ?? data?.invoice?.summary?.tax ?? 0);
  const rawGlobalCommission = Number((data as any)?.globalCommission ?? (data as any)?.adminCommission ?? 0);
  const rawServiceFee = Number((data as any)?.serviceFee ?? (data as any)?.service_fee ?? 0);
  const calculatedDiff = Math.max(0, Number(totalPrice || 0) - Number(data?.shipping || 0) - Number(data?.price || 0) + combinedDiscount);

  // Use explicit tax/commission if present, or mathematical diff fallback
  const serviceFee = rawTax || rawGlobalCommission || rawServiceFee || calculatedDiff;
  const priceAfterDiscount = (data as any)?.priceAfterDiscount;
  const priceAfterTax = (data as any)?.priceAfterTax;
  const rewardId = (data as any)?.rewardId ?? (data as any)?.fortuneRewardId;
  const hasFreeDeliveryReward = Boolean(
    (data as any)?.freeDeliveryReward ||
    (data as any)?.isFreeDeliveryReward ||
    (data as any)?.rewardType === "FREE_DELIVERY"
  );

  // Detailed pricing breakdown
  let totalItemDiscounts = 0;
  if (Array.isArray(data?.OrderItems)) {
    for (const item of data.OrderItems) {
      const quantity = Number(item.quantity ?? 1);
      const originalBase = Number((item.Size as any)?.price ?? (item.Service as any)?.price ?? item.price ?? 0);
      const discountedBase = Number((item.Size as any)?.priceAfterDiscount ?? (item.Service as any)?.priceAfterDiscount ?? originalBase);

      if (originalBase > discountedBase) {
        totalItemDiscounts += (originalBase - discountedBase) * quantity;
      }
    }
  }

  const storeCommission = Number(data?.storeCommission ?? (data as any)?.financialBreakdown?.storeCommission ?? 0);
  const productsPriceWithCommission = Number(data?.price ?? 0);
  
  if (totalItemDiscounts === 0 && (data as any)?.financialBreakdown?.discountAmount) {
    totalItemDiscounts = Number((data as any)?.financialBreakdown?.discountAmount ?? 0);
  }

  // Original menu price of items = (Products price with commission - store commission + item discount)
  const originalProductsPrice = Math.max(0, productsPriceWithCommission - storeCommission + totalItemDiscounts);
  // Net earnings of the store (Option 1: discount absorbs platform store commission, restaurant receives full menu payout)
  const excessStoreCommission = Math.max(0, storeCommission - (totalItemDiscounts + combinedDiscount));
  const storeNetEarnings = Number(
    (data as any)?.financialBreakdown?.storeNetEarnings ??
    (data as any)?.financialBreakdown?.payToStoreAmount ??
    Math.max(0, productsPriceWithCommission - excessStoreCommission)
  );
  return (
    <>
      <div className="container mx-auto py-8 max-w-6xl px-4 lg:px-6 print:hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
              {t("Order Details")} #{data?.id}
            </h1>
            {Boolean((data as any)?.storeDailyOrderNumber || (data as any)?.invoice?.storeDailyOrderNumber) && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-2.5 py-0.5">
                فاتورة المتجر #{((data as any)?.storeDailyOrderNumber || (data as any)?.invoice?.storeDailyOrderNumber)}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1.5 flex items-center gap-1.5">
            {t("Created on")} <DateCol date={data?.createdAt} />
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          <PrintOrderButton />
          <CopyOrderButton orderId={data?.id} items={data?.OrderItems || []} orderData={data as any} />
          <div className="flex gap-2">
            <TableStatusBadge status={data?.status} />
            <TableStatusBadge status={data?.paymentStatus} />
            {(data as any)?.category === "SCHEDULED" && (
              <Badge variant="outline" className="gap-1 border-violet-400 text-violet-500">
                <CalendarClock className="h-3.5 w-3.5" />
                {t("Scheduled Order")}
              </Badge>
            )}
            {(data as any)?.customDeliveryKind && (
              <Badge variant="outline" className="gap-1 border-sky-400 text-sky-600 dark:text-sky-400">
                {t((data as any)?.customDeliveryKind) || (data as any)?.customDeliveryKind}
              </Badge>
            )}
            {(() => {
              const cityName = getLocalizedName(
                (data as any)?.Zone?.City?.name ||
                (data as any)?.CustomerSelectedZone?.City?.name ||
                (data as any)?.Branch?.Store?.city?.name ||
                (data as any)?.Branch?.Store?.City?.name ||
                (data as any)?.invoice?.store?.city?.name ||
                (data as any)?.Stations?.[0]?.Zone?.City?.name
              );
              return cityName ? (
                <Badge variant="outline" className="gap-1 border-primary/40 text-primary font-medium">
                  <span>📍</span>
                  <span>{cityName}</span>
                </Badge>
              ) : null;
            })()}
          </div>
          <OrderStatusSelect orderId={data?.id} status={data?.status} />
        </div>
      </div>

      {data?.status === "PENDING_PAYMENT" && (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 px-4 py-3 print:hidden">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {t("verifyPaymentDescription")}
          </span>
          <VerifyPaymentAction orderId={data?.id} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Main Column */}
        <div className="lg:col-span-8 print:col-span-12 space-y-8">
          {/* Order Items */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("Order Items")}
            </h2>
            {data?.OrderItems && data?.OrderItems.length > 0 ? (
              <OrderItemsList items={data?.OrderItems} storeCommission={data?.storeCommission} />
            ) : (
              <div className="text-center text-muted-foreground py-6 border border-dashed rounded-lg bg-muted/10">
                {t("No items in this order")}
              </div>
            )}
          </div>

          {/* Payment Summary */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 print:hidden">
              {t("Payment Details")}
            </h2>
            <div className="bg-muted/30 dark:bg-muted/10 border border-slate-200 dark:border-slate-800 rounded-lg p-5 space-y-3.5 text-sm print:hidden">
              {/* 1. Original Menu Price (if discount or store commission exists) */}
              {(totalItemDiscounts > 0 || storeCommission > 0) && originalProductsPrice > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>- {t("originalProductsPrice") || "سعر المنتجات الأصلي (المنيو)"}</span>
                  <span className="font-medium">
                    <PriceAmount value={originalProductsPrice} />
                  </span>
                </div>
              )}

              {/* 2. Store / Items Discount */}
              {totalItemDiscounts > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-500 font-medium">
                  <span>- {t("storeProductsDiscount") || "خصم المتجر على المنتجات"}</span>
                  <span>
                    - <PriceAmount value={totalItemDiscounts} />
                  </span>
                </div>
              )}

              {/* 3. Store Commission Added */}
              {storeCommission > 0 && (
                <div className="flex justify-between text-slate-700 dark:text-slate-300">
                  <span>- {t("storeCommissionAdded") || "عمولة المتجر المضافة"}</span>
                  <span className="font-medium">
                    + <PriceAmount value={storeCommission} />
                  </span>
                </div>
              )}

              {/* 4. Products Price with Commission (Collected from Customer for items) */}
              <div className="flex justify-between font-semibold text-slate-900 dark:text-slate-100">
                <span className="text-muted-foreground">- {t("productsPriceWithCommission") || "سعر المنتجات بالعمولة (المحصل للمنتجات)"}</span>
                <span className="font-medium">
                  <PriceAmount value={productsPriceWithCommission} />
                </span>
              </div>

              {/* 5. Net Store Earnings (Without Commission) - Only visible to Full Admin (Super Admin) */}
              {isSuperAdmin && (
                <div className="flex justify-between text-sky-700 dark:text-sky-400 bg-sky-50/50 dark:bg-sky-950/20 px-3 py-2 rounded-md border border-sky-100 dark:border-sky-900/30">
                  <span className="font-medium">- {t("storeNetEarnings") || "صافي مستحق المطعم (بدون عمولة)"}</span>
                  <span className="font-bold">
                    <PriceAmount value={storeNetEarnings} />
                  </span>
                </div>
              )}
              {priceAfterDiscount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Price After Discount")}</span>
                  <span className="font-medium">
                    <PriceAmount value={priceAfterDiscount} />
                  </span>
                </div>
              )}
              {priceAfterTax !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Price After Tax")}</span>
                  <span className="font-medium">
                    <PriceAmount value={priceAfterTax} />
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <div>
                  <span className="text-muted-foreground">- {t("Shipping")}</span>
                  {hasFreeDeliveryReward && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      {t("freeDeliveryRewardKeepsTip")}
                    </p>
                  )}
                </div>
                <div className="text-end">
                  {hasFreeDeliveryReward && (
                    <Badge variant="success" className="mb-1">{t("Free delivery reward")}</Badge>
                  )}
                  <div className="font-medium">
                    <PriceAmount value={data?.shipping} />
                  </div>
                </div>
              </div>
              {serviceFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Service Fee") || "رسوم الخدمة"}</span>
                  <span className="font-medium">
                    <PriceAmount value={serviceFee} />
                  </span>
                </div>
              )}
              {Number(data?.tip || (data as any)?.invoice?.tip || 0) > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-500 font-medium">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    - {t("Tip") || "إكرامية (تبس)"}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-500">
                    + <PriceAmount value={Number(data?.tip || (data as any)?.invoice?.tip)} />
                  </span>
                </div>
              )}
              {combinedDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-500 font-medium">
                  <div>
                    <span>- {t("Combined Discount")}</span>
                    <p className="text-xs font-normal text-muted-foreground">
                      {t("combinedDiscountHelper")}
                    </p>
                  </div>
                  <span>
                    - <PriceAmount value={combinedDiscount} />
                  </span>
                </div>
              )}
              {rawTax > 0 && rawGlobalCommission > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Platform Fee")}</span>
                  <span className="font-medium">
                    <PriceAmount value={rawGlobalCommission} />
                  </span>
                </div>
              )}

              <Separator className="my-3 bg-slate-200 dark:bg-slate-800" />
              <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-slate-50">
                <span>{t("Total")}</span>
                <span>
                  <PriceAmount value={totalPrice} />
                </span>
              </div>
              <Separator className="my-3 bg-slate-200 dark:bg-slate-800" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">- {t("Paid with Wallet")}</span>
                <Badge variant={data?.paidWithWallet ? "default" : "outline"} className="font-medium">
                  {data?.paidWithWallet ? t("Yes") : t("No")}
                </Badge>
              </div>
              {data?.adminCommission > 0 && (
                <div className="flex justify-between">
                  <div>
                    <span className="text-muted-foreground block">- {t("Admin Commission")}</span>
                    <span className="text-[11px] text-muted-foreground/70">
                      ({t("Platform Fee")} + {t("Store Commission")})
                    </span>
                  </div>
                  <span className="font-medium">
                    <PriceAmount value={data?.adminCommission} />
                  </span>
                </div>
              )}
              {data?.couponId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Coupon ID")}</span>
                  <span className="font-mono">#{data?.couponId}</span>
                </div>
              )}
              {rewardId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">- {t("Fortune Reward ID")}</span>
                  <Badge variant="outline" className="font-mono">
                    #{rewardId} · {t("reward applied")}
                  </Badge>
                </div>
              )}
              {(data?.transferNumer || data?.transferImage || (data as any)?.transferType) && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <h3 className="font-semibold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("Bank Transfer Verification")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {(data as any)?.transferType && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs block">{t("Transfer Type")}</span>
                        <Badge variant={
                          (data as any)?.transferType === "BANK_TRANSFER" ? "default" :
                          (data as any)?.transferType === "VODAFONE_CASH" ? "secondary" : "outline"
                        } className="font-medium">
                          {t((data as any)?.transferType) || (data as any)?.transferType}
                        </Badge>
                      </div>
                    )}
                    {(
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs block">{t("Reference Number")}</span>
                        <div className="font-mono text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-md select-all text-slate-800 dark:text-slate-200">
                          {data?.transferNumer ?? '-'}
                        </div>
                      </div>
                    )}
                    {(data as any)?.transferAccountNumber && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs block">{t("Bank Account / IBAN")}</span>
                        <div className="font-mono text-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-md select-all text-slate-800 dark:text-slate-200">
                          {(data as any)?.transferAccountNumber}
                        </div>
                      </div>
                    )}
                    {data?.transferImage && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs block">{t("Receipt Image")}</span>
                        <a
                          href={getImageUrl(data?.transferImage)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group block relative border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden bg-slate-50 dark:bg-slate-950/20 aspect-video hover:border-orange-500 dark:hover:border-orange-500 transition-colors cursor-zoom-in"
                        >
                          <Image
                            src={getImageUrl(data?.transferImage)}
                            alt="Bank Transfer Receipt"
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                            <span className="text-xs font-semibold text-white bg-black/70 px-2.5 py-1.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                              {t("View Full Receipt")}
                            </span>
                          </div>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Delivery Info */}
          {hasCustomDeliveryInfo && (
            <div className="space-y-4 print:hidden">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {t("Custom Delivery Info")}
              </h2>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50/50 dark:bg-slate-950/20">
                <InvoiceCustomDeliveryInfo
                  customDelivery={data?.invoice?.customDelivery}
                  stations={customDeliveryStations}
                  progress={(data as any)?.customDeliveryProgress}
                />
              </div>
            </div>
          )}

          {/* Complaints */}
          <div className="space-y-4 print:hidden">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {t("Complaints")}
            </h2>
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5">
              <ComplaintsList complaints={data?.Complaints} />
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 lg:border-l lg:pl-8 border-slate-200 dark:border-slate-800 space-y-6 print:hidden">
          {/* Customer Info */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t("Customer Info")}
            </div>
            <CustomerInfo customer={data?.Customer} />
          </div>

          {/* Store Info */}
          {(data?.Branch || data?.invoice?.store) && (
            <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("Store Info")}
              </div>
              <StoreInfo branch={data?.Branch} invoice={data?.invoice} />
            </div>
          )}

          {/* Delivery Info */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                {t("Delivery Info")}
              </div>
              <AssignOrderDeliveryDialog
                orderId={data?.id}
                currentDeliveryId={data?.Delivery?.User?.id}
                triggerLabel={t("Assign")}
                triggerVariant="outline"
                triggerSize="sm"
                disabled={['DELIVERED', 'CANCELLED', 'REJECTED'].includes(data?.status as string)}
              />
            </div>
            <DeliveryInfo delivery={data?.Delivery} deliveryKind={(data as any)?.customDeliveryKind} />

            {Number(data?.tip || (data as any)?.invoice?.tip || 0) > 0 && (
              <div className="flex items-center justify-between text-xs p-2.5 rounded-md bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                <span className="font-medium">{t("Delivery Tip") || "إكرامية المندوب (تبس)"}:</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  + <PriceAmount value={Number(data?.tip || (data as any)?.invoice?.tip)} />
                </span>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground">{t("Note for Delivery")}</div>
                <NoteForDeliveryDialog
                  orderId={data?.id}
                  initialNote={data?.noteForDelivery}
                  triggerVariant="ghost"
                />
              </div>
              {data?.noteForDelivery ? (
                <div className="text-sm p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/10 text-amber-900 dark:text-amber-200 border border-amber-100 dark:border-amber-900/30 whitespace-pre-wrap">
                  {data?.noteForDelivery}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  {t("No delivery notes added yet.")}
                </div>
              )}
            </div>
          </div>

          {/* Address Info */}
          <div className="pb-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t("Address Info")}
            </div>
            <AddressInfo
              address={data?.Address}
              zoneId={(data as any)?.customerSelectedZoneId}
              zoneLabel={t("customerSelectedZone")}
            />
          </div>

          {/* Order Properties */}
          <div className="space-y-4">
            <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {t("Order Details")}
            </div>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">{t("Date")}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  <DateCol date={data?.date} />
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">{t("Type")}</span>
                <Badge variant="outline" className="font-normal capitalize mt-0.5">
                  {t(data?.type) || data?.type}
                </Badge>
              </div>
              {(() => {
                const cityName = getLocalizedName(
                  (data as any)?.Zone?.City?.name ||
                  (data as any)?.CustomerSelectedZone?.City?.name ||
                  (data as any)?.Branch?.Store?.city?.name ||
                  (data as any)?.Branch?.Store?.City?.name ||
                  (data as any)?.invoice?.store?.city?.name ||
                  (data as any)?.Stations?.[0]?.Zone?.City?.name
                );
                return cityName ? (
                  <div>
                    <span className="text-muted-foreground block text-xs mb-0.5">{t("City") || "المدينة"}</span>
                    <Badge variant="outline" className="gap-1 border-primary/40 text-primary font-medium mt-0.5">
                      <span>📍</span>
                      <span>{cityName}</span>
                    </Badge>
                  </div>
                ) : null;
              })()}
              {/* Delivery kind — shown for all orders that have a driver */}
              {data?.Delivery?.User && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-0.5">{t("Delivery Service")}</span>
                  {(data as any)?.customDeliveryKind ? (
                    <Badge
                      variant="outline"
                      className={
                        (data as any).customDeliveryKind === "ONLINE"
                          ? "font-semibold border-sky-400 text-sky-600 dark:text-sky-400"
                          : (data as any).customDeliveryKind === "PURCHASE"
                          ? "font-semibold border-amber-400 text-amber-600 dark:text-amber-400"
                          : "font-semibold border-orange-400 text-orange-600 dark:text-orange-400"
                      }
                    >
                      {(data as any).customDeliveryKind === "ONLINE"
                        ? "مندوب أونلاين"
                        : (data as any).customDeliveryKind === "PURCHASE"
                        ? "مندوب مشتريات"
                        : "مندوب مطاعم"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="font-normal mt-0.5">
                      {t(data?.type) || data?.type}
                    </Badge>
                  )}
                </div>
              )}
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">{t("Payment Method")}</span>
                <Badge variant="secondary" className="font-normal capitalize mt-0.5">
                  {t(data?.paymentMethod) || data?.paymentMethod}
                </Badge>
              </div>
              {(data as any)?.scheduledAt && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-0.5">{t("Scheduled At")}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    <DateCol date={(data as any)?.scheduledAt} />
                  </span>
                </div>
              )}
              {data?.estimatedArrivalMinutes > 0 && (
                <div>
                  <span className="text-muted-foreground block text-xs mb-0.5">{t("Estimated Arrival")}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">
                    {data?.estimatedArrivalMinutes} {t("min")}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">{t("Can Deliver")}</span>
                <Badge variant={data?.canDeliver ? "default" : "destructive"} className="font-normal mt-0.5">
                  {data?.canDeliver ? t("Yes") : t("No")}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-0.5">{t("Rated")}</span>
                <Badge variant={data?.rated ? "default" : "outline"} className="font-normal mt-0.5">
                  {data?.rated ? t("Yes") : t("No")}
                </Badge>
              </div>
            </div>

            {data?.note && (
              <div className="pt-2">
                <span className="text-muted-foreground block text-xs mb-1">{t("Note")}</span>
                <div className="text-sm border border-slate-200 dark:border-slate-800 p-2.5 rounded bg-muted/20 text-slate-700 dark:text-slate-300">
                  {data?.note}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
      
      {/* Sibling div for Printing */}
      <div className="hidden print:block w-full max-w-sm mx-auto p-6 text-black bg-white font-mono text-xs leading-relaxed" dir="rtl">
        {/* CSS to hide headers, footers (localhost URLs) and page numbers */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              margin: 0;
            }
            body {
              margin: 0.8cm;
              background-color: white !important;
              color: black !important;
            }
          }
        ` }} />

        {/* Header */}
        <div className="text-center space-y-1 mb-4 pb-4 border-b-2 border-dotted border-black">
          <h1 className="text-2xl font-black tracking-wider uppercase mb-1">مـكـانـك</h1>
          <p className="text-[10px] text-gray-500 font-sans tracking-wide">منصة التوصيل الأولى</p>
          <div className="my-2 border-2 border-black py-1.5 px-3 inline-block rounded">
            {Boolean((data as any)?.storeDailyOrderNumber || (data as any)?.invoice?.storeDailyOrderNumber) ? (
              <>
                <h2 className="text-base font-black">فاتورة طلب #{((data as any)?.storeDailyOrderNumber || (data as any)?.invoice?.storeDailyOrderNumber)}</h2>
                <p className="text-[10px] text-gray-600 font-sans">رقم النظام: #{data?.id}</p>
              </>
            ) : (
              <h2 className="text-sm font-bold">فاتورة طلب #{data?.id}</h2>
            )}
          </div>
          <p className="text-[10px] font-sans">التاريخ: {new Date(data?.createdAt || "").toLocaleString("ar-EG")}</p>
        </div>

        {/* Store & Customer Details */}
        <div className="space-y-1.5 mb-4 pb-4 border-b border-dashed border-black text-xs">
          <p className="flex justify-between">
            <span className="font-bold">المتجر:</span>
            <span>{getLocalizedName(data?.invoice?.store?.name || (data?.Branch as any)?.Store?.name || (data as any)?.storeName) || "—"}</span>
          </p>
          {(data?.invoice?.store?.address || (data?.Branch as any)?.address) && (
            <p className="text-[10px] text-gray-600 text-left">{data?.invoice?.store?.address || (data?.Branch as any)?.address}</p>
          )}
          <div className="h-[1px] bg-gray-200 my-1"></div>
          <p><strong>العميل:</strong> {data?.Customer?.name || "—"}</p>
          <p><strong>الهاتف:</strong> {data?.Customer?.phone || "—"}</p>
          {(data as any)?.Zone?.name && (
            <p><strong>المنطقة:</strong> {getLocalizedName((data as any).Zone.name)}</p>
          )}
          <p className="leading-tight">
            <strong>العنوان:</strong> {(data?.Address as any)?.adress || (data?.Address as any)?.address || "—"} 
            {(data?.Address as any)?.title ? ` (${(data?.Address as any)?.title})` : ""}
          </p>
          {data?.note && (
            <div className="bg-gray-100 p-1.5 rounded mt-1 border-r-2 border-black">
              <strong>ملاحظة:</strong> {data.note}
            </div>
          )}
          <p className="flex justify-between pt-1">
            <span className="font-bold">طريقة الدفع:</span>
            <span className="border border-black px-1.5 rounded font-sans text-[10px]">{data?.paymentMethod || "—"}</span>
          </p>
        </div>

        {/* Order Items */}
        <div className="mb-4 pb-4 border-b border-dashed border-black">
          <h3 className="font-bold mb-2">الطلبات:</h3>
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-black font-bold">
                <th className="pb-1 text-right">الصنف</th>
                <th className="text-center pb-1 w-12">الكمية</th>
                <th className="text-left pb-1 w-20">السعر</th>
              </tr>
            </thead>
            <tbody>
              {data?.OrderItems?.map((item: any, idx: number) => {
                const categoryName = getLocalizedName(item?.Service?.Category?.name);
                return (
                  <tr key={idx} className="border-b border-dotted border-gray-300">
                    <td className="py-2 text-right">
                      {categoryName && (
                        <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">[{categoryName}]</div>
                      )}
                      <span className="font-bold">{getLocalizedName(item?.Service?.name) || item?.Service?.name || "—"}</span>
                      {item?.Size?.name && (
                        <div className="text-[10px] text-gray-500 font-sans">
                          · الحجم: {getLocalizedName(item.Size.name)}
                          {item.Size.price ? ` (+${formatMoneyVal(item.Size.price)} ج.م)` : ""}
                        </div>
                      )}
                      {item?.OrderItemAddons && item.OrderItemAddons.length > 0 && (
                        <div className="text-[10px] text-gray-500 font-sans leading-tight">
                          · إضافات: {item.OrderItemAddons.map((oia: any) => {
                            const addonName = getLocalizedName(oia?.Addon?.name);
                            const addonPrice = oia?.Addon?.price ? ` (+${formatMoneyVal(oia.Addon.price)} ج.م)` : "";
                            return `${addonName}${addonPrice}`;
                          }).filter(Boolean).join("، ")}
                        </div>
                      )}
                    </td>
                    <td className="text-center py-2 font-bold font-sans">{item.quantity}</td>
                    <td className="text-left py-2 font-sans">{formatMoneyVal(item.price * item.quantity)} ج.م</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>سعر المنتجات:</span>
            <span className="font-sans">{formatMoneyVal(data?.price || 0)} ج.م</span>
          </div>
          {combinedDiscount > 0 && (
            <div className="flex justify-between text-black">
              <span>الخصم:</span>
              <span className="font-sans">- {formatMoneyVal(combinedDiscount)} ج.م</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>رسوم التوصيل:</span>
            <span className="font-sans">{formatMoneyVal(data?.shipping || 0)} ج.م</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between">
              <span>رسوم الخدمة:</span>
              <span className="font-sans">{formatMoneyVal(serviceFee)} ج.م</span>
            </div>
          )}
          {Number(data?.tip || (data as any)?.invoice?.tip || 0) > 0 && (
            <div className="flex justify-between text-black">
              <span>إكرامية (تبس):</span>
              <span className="font-sans">+ {formatMoneyVal(Number(data?.tip || (data as any)?.invoice?.tip))} ج.م</span>
            </div>
          )}
          <div className="flex justify-between border-t border-double border-black pt-2 font-black text-sm">
            <span>الإجمالي النهائي:</span>
            <span className="font-sans">{formatMoneyVal(totalPrice || 0)} ج.م</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 pt-4 border-t-2 border-dotted border-black">
          <p className="font-bold">شكراً لتعاملكم معنا!</p>
          <p className="text-[9px] text-gray-400 mt-1 font-sans">Powered by Makanak App</p>
        </div>
      </div>
    </>
  );
}

export default page;
