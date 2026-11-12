import { PriceAmount } from "@/components/PriceAmount";
import ActiveCol from "@/components/common/table/columns/Ative.column";
import DateCol from "@/components/common/table/columns/date.column";
import IconHeader from "@/components/common/table/columns/icon-header";
import TableStatusBadge from "@/components/common/table/tableHelperComponents/TableStatusBadge";
import AssignOrderDeliveryDialog from "@/components/pages/_orders/AssignOrderDeliveryDialog";
import OrderDelaySelect from "@/components/pages/_orders/OrderDelaySelect";
import { OrderCustomerCell } from "@/components/pages/_orders/OrderCustomerCell";
import { OrderServicesCell } from "@/components/pages/_orders/OrderServicesCell";
import OrderStatusSelect from "@/components/pages/_orders/OrderStatusSelect";
import AdminNoteDialog from "@/components/pages/_orders/AdminNoteDialog";
import { Badge } from "@/components/ui/badge";
import { Gift, CalendarClock } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

const getNestedValue = (source: Record<string, any>, paths: string[]) => {
  for (const path of paths) {
    const value = path.split(".").reduce<any>((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }

  return undefined;
};

const parseDateValue = (value: unknown) => {
  if (!value) return null;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMinutes = (date: Date | null, minutes?: number) => {
  if (!date || !minutes) return null;
  return new Date(date.getTime() + minutes * 60 * 1000);
};

const getEstimatedArrivalDate = (order: Record<string, any>) => {
  const explicitArrival = parseDateValue(
    getNestedValue(order, [
      "estimatedArrivalAt",
      "arrivalAt",
      "expectedArrivalAt",
      "expectedDeliveryAt",
      "invoice.estimatedArrivalAt",
      "invoice.expectedDeliveryAt"
    ])
  );
  if (explicitArrival) return explicitArrival;

  const baseDate = parseDateValue(order.date || order.createdAt);
  const estimatedMinutes =
    Number(order.estimatedArrivalMinutes || order.invoice?.estimatedArrivalMinutes) || 0;

  return addMinutes(baseDate, estimatedMinutes);
};

const getDeliveryPickupDate = (order: Record<string, any>) =>
  parseDateValue(
    getNestedValue(order, [
      "deliveryAcceptedAt",
      "deliveryAssignedAt",
      "assignedAt",
      "acceptedAt",
      "pickedUpAt",
      "pickupAt",
      "receivedAt",
      "Delivery.acceptedAt",
      "Delivery.assignedAt",
      "Delivery.pickedUpAt"
    ])
  );

const getDeliveredDate = (order: Record<string, any>) =>
  parseDateValue(
    getNestedValue(order, [
      "deliveredAt",
      "deliveryTime",
      "completedAt",
      "finishedAt",
      "Delivery.deliveredAt",
      "Delivery.completedAt"
    ])
  );

const getDeliveryPerformance = (order: Record<string, any>) => {
  const pickupDate = getDeliveryPickupDate(order);
  const deliveredDate = getDeliveredDate(order);
  const estimatedMinutes =
    Number(order.estimatedArrivalMinutes || order.invoice?.estimatedArrivalMinutes) || 0;

  if (!pickupDate || !deliveredDate || !estimatedMinutes) return "PENDING_DELIVERY_TIME";

  const actualMinutes = Math.round((deliveredDate.getTime() - pickupDate.getTime()) / 60000);
  if (actualMinutes <= estimatedMinutes) return "ON_TIME_DELIVERY";
  if (actualMinutes <= estimatedMinutes + 10) return "NEAR_DELAY_DELIVERY";
  return "DELAYED_DELIVERY";
};

const DeliveryPerformanceBadge = ({ status }: { status: string }) => {
  const t = useTranslations();
  const styles: Record<string, string> = {
    ON_TIME_DELIVERY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-500",
    NEAR_DELAY_DELIVERY: "border-orange-500/30 bg-orange-500/15 text-orange-400",
    DELAYED_DELIVERY: "border-red-500/30 bg-red-500/15 text-red-400",
    PENDING_DELIVERY_TIME: "border-orange-500/30 bg-orange-500/15 text-orange-400"
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {t(status)}
    </Badge>
  );
};

const getLocalizedName = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.ar || value.en || "";
};

const getOrderTotalDiscount = (order: Record<string, any>): number => {
  if (!order) return 0;
  
  const summary = order?.invoice?.summary;
  if (summary?.totalDiscount != null && Number(summary.totalDiscount) > 0) {
    return Number(summary.totalDiscount);
  }

  const explicitCoupon = Number(
    order?.discountAmount ?? 
    order?.discountValue ?? 
    summary?.couponDiscount ?? 
    summary?.discountValue ?? 
    0
  );
  const fortuneDiscount = Number(summary?.fortuneDiscount ?? 0);

  let itemDiscounts = Number(summary?.itemDiscount ?? 0);
  if (itemDiscounts === 0 && Array.isArray(order?.OrderItems)) {
    itemDiscounts = order.OrderItems.reduce((acc: number, item: any) => {
      const originalPrice = Number(item?.Service?.price ?? item?.service?.price ?? 0);
      const itemPrice = Number(
        item?.priceAfterDiscount ??
        item?.price ??
        item?.Service?.priceAfterDiscount ??
        item?.service?.priceAfterDiscount ??
        originalPrice
      );
      const diff = originalPrice > itemPrice ? originalPrice - itemPrice : 0;
      const count = Number(item?.count ?? item?.quantity ?? 1);
      return acc + diff * count;
    }, 0);
  }

  return explicitCoupon + fortuneDiscount + itemDiscounts;
};

export default function OrdersColumns(): any {
  const t = useTranslations();
  const columns = [
    {
      accessorKey: "id",
      header: () => <IconHeader columnKey="ID" />,
      cell: ({ row, getValue }) => {
        const id = getValue() as string;
        const dailyNum = row.original?.storeDailyOrderNumber ?? row.original?.invoice?.storeDailyOrderNumber;
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-sm font-semibold">#{id}</span>
            {dailyNum ? (
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit whitespace-nowrap">
                فاتورة #{dailyNum}
              </span>
            ) : null}
          </div>
        );
      }
    },
    {
      id: "customer",
      header: () => <IconHeader columnKey="Customer" />,
      cell: ({ row }) => <OrderCustomerCell customer={row?.original?.Customer} />
    },
    {
      accessorKey: "invoice.store.name",
      header: () => <IconHeader columnKey="Store Name" />,
      cell: ({ row }) => {
        const branch =
          row?.original?.Branch ||
          row?.original?.branch ||
          row?.original?.invoice?.branch ||
          row?.original?.invoice?.Branch;
        const store =
          row?.original?.invoice?.store ||
          branch?.Store ||
          branch?.store ||
          row?.original?.Store ||
          row?.original?.store;
        const storeName = getLocalizedName(
          store?.name ||
          branch?.Store?.name ||
          branch?.store?.name ||
          row?.original?.storeName
        );
        const rawBranchName =
          branch?.name && typeof branch.name === "object"
            ? getLocalizedName(branch.name)
            : typeof branch?.name === "string"
            ? branch.name
            : "";
        const branchName =
          rawBranchName ||
          getLocalizedName(
            row?.original?.branchName || row?.original?.invoice?.branch?.name
          );
        const value =
          branchName && storeName && branchName !== storeName
            ? `${storeName} (${branchName})`
            : storeName || branchName || "-";

        return <span>{value}</span>;
      }
    },
    {
      id: "city",
      header: () => <IconHeader columnKey="City" />,
      cell: ({ row }) => {
        const order = row?.original;
        const cityName = getLocalizedName(
          order?.Zone?.City?.name ||
          order?.CustomerSelectedZone?.City?.name ||
          order?.Branch?.Store?.city?.name ||
          order?.Branch?.Store?.City?.name ||
          order?.invoice?.store?.city?.name ||
          order?.Stations?.[0]?.Zone?.City?.name
        );
        return cityName ? (
          <Badge variant="outline" className="gap-1 border-primary/40 text-primary font-medium">
            <span>📍</span>
            <span>{cityName}</span>
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
    },
    {
      accessorKey: "type",
      header: () => <IconHeader columnKey="Order Type" />,
      cell: ({ getValue }) => {
        const orderType = String(getValue() || "DELIVERY");
        return <Badge variant="outline">{t(orderType)}</Badge>;
      }
    },
    {
      accessorKey: "customDeliveryKind",
      header: () => <IconHeader columnKey="Delivery Service" />,
      cell: ({ row, getValue }) => {
        if (row.original.type !== "CUSTOM_DELIVERY") return <span className="text-muted-foreground">—</span>;
        const kind = (getValue() as string) || "PURCHASE";
        return (
          <Badge variant="outline" className="gap-1 border-sky-400 text-sky-600 dark:text-sky-400">
            {t(kind)}
          </Badge>
        );
      }
    },
    {
      accessorKey: "isGift",
      header: () => <IconHeader columnKey="Gift Order" />,
      cell: ({ getValue }) => {
        const isGift = Boolean(getValue());
        return isGift ? (
          <Badge variant="outline" className="gap-1 border-pink-400 text-pink-500">
            <Gift className="h-3.5 w-3.5" />
            {t("Gift")}
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
    },
    {
      id: "services",
      header: () => <IconHeader columnKey="Services" />,
      cell: ({ row }) => <OrderServicesCell items={row?.original?.OrderItems} />
    },
    {
      accessorKey: "summary.total",
      header: () => <IconHeader columnKey="Invoice > Total" />,
      cell: ({ row }) => <PriceAmount value={row?.original?.invoice?.summary?.total} />
    },
    {
      accessorKey: "price",
      header: () => <IconHeader columnKey="Price" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      accessorKey: "note",
      header: () => <IconHeader columnKey="Note" />,
      cell: ({ getValue }) => <span>{(getValue() as string) || "-"}</span>
    },
    {
      id: "estimatedArrival",
      header: () => <IconHeader columnKey="Order Arrival" />,
      cell: ({ row }) => {
        const orderDate = row.original.createdAt || row.original.date;
        return orderDate ? <DateCol date={orderDate} /> : <span>-</span>;
      }
    },

    {
      accessorKey: "totalPriceAfterDiscount",
      header: () => <IconHeader columnKey="TotalPriceAfterDiscount" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      id: "combinedDiscount",
      header: () => <IconHeader columnKey="Combined Discount" />,
      cell: ({ row }) => {
        const totalDiscount = getOrderTotalDiscount(row?.original);
        return <PriceAmount value={totalDiscount} />;
      }
    },
    {
      accessorKey: "paidWithWallet",
      header: () => <IconHeader columnKey="PaidWithWallet" />,
      cell: ({ getValue }) => <ActiveCol value={getValue() as boolean} />
    },
    {
      accessorKey: "adminCommission",
      header: () => <IconHeader columnKey="AdminCommission" />,
      cell: ({ row, getValue }) => {
        const order = row?.original;
        const rawAdminCommission = Number(getValue() ?? order?.adminCommission ?? order?.invoice?.summary?.adminCommission ?? 0);
        const storeCommission = Number(order?.storeCommission ?? order?.invoice?.summary?.storeCommission ?? 0);
        const globalCommission = Number(order?.globalCommission ?? order?.invoice?.summary?.globalCommission ?? 0);
        const totalDiscount = getOrderTotalDiscount(order);
        const excessStoreCommission = Math.max(0, storeCommission - totalDiscount);
        const effectiveAdminCommission = globalCommission + excessStoreCommission;
        
        const val = (storeCommission > 0 && totalDiscount >= storeCommission)
          ? effectiveAdminCommission
          : rawAdminCommission;
        return <PriceAmount value={val} />;
      }
    },
    {
      accessorKey: "globalCommission",
      header: () => <IconHeader columnKey="Platform Fee" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      accessorKey: "storeCommission",
      header: () => <IconHeader columnKey="Store Commission" />,
      cell: ({ row, getValue }) => {
        const order = row?.original;
        const rawStoreCommission = Number(getValue() ?? order?.storeCommission ?? order?.invoice?.summary?.storeCommission ?? 0);
        
        if (order?.invoice?.summary?.excessStoreCommission !== undefined) {
          return <PriceAmount value={Number(order.invoice.summary.excessStoreCommission)} />;
        }
        
        const totalDiscount = getOrderTotalDiscount(order);
        const effectiveStoreCommission = Math.max(0, rawStoreCommission - totalDiscount);
        return <PriceAmount value={effectiveStoreCommission} />;
      }
    },
    {
      accessorKey: "shipping",
      header: () => <IconHeader columnKey="Shipping" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      accessorKey: "tip",
      header: () => <IconHeader columnKey="Tip" />,
      cell: ({ row, getValue }) => {
        const tip = Number(getValue() ?? row.original?.invoice?.tip ?? 0);
        return tip > 0 ? (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
            <span>+</span>
            <PriceAmount value={tip} />
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      }
    },
    {
      accessorKey: "tax",
      header: () => <IconHeader columnKey="Tax" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      accessorKey: "paymentStatus",
      header: () => <IconHeader columnKey="PaymentStatus" />,
      cell: ({ getValue }) => {
        const paymentStatus = getValue() as string;
        return <TableStatusBadge status={paymentStatus} />;
      }
    },
    {
      accessorKey: "status",
      header: () => <IconHeader columnKey="Status" />,
      cell: ({ row, getValue }) => {
        const status = getValue() as string;

        return (
          <div className="flex flex-col items-center gap-3 min-w-[200px]">
            <TableStatusBadge status={status} />
            <div className="">
              <OrderStatusSelect orderId={row?.original?.id} status={status} compact />
            </div>
          </div>
        );
      }
    },
    {
      id: "assignDelivery",
      header: () => <IconHeader columnKey="Assign Delivery" />,
      cell: ({ row }) => {
        const deliveryId = row?.original?.Delivery?.User?.id;
        return (
          <AssignOrderDeliveryDialog
            orderId={row?.original?.id}
            currentDeliveryId={deliveryId}
            triggerLabel={t("Assign")}
            triggerVariant="outline"
            triggerSize="sm"
            disabled={['DELIVERED', 'CANCELLED', 'REJECTED'].includes(row.original.status)}
          />
        );
      }
    },
    {
      accessorKey: "Delivery.User.name",
      header: () => <IconHeader columnKey="Delivery Name" />,
      cell: ({ row }) => {
        const value = row?.original?.Delivery?.User?.name;
        if (!value) return <span>-</span>;
        const driverId = row?.original?.Delivery?.User?.id;
        const kind = row?.original?.customDeliveryKind as string | null;
        const orderType = row?.original?.type as string | null;

        const KIND_STYLES: Record<string, string> = {
          ONLINE: "border-sky-400 text-sky-600 dark:text-sky-400",
          PURCHASE: "border-amber-400 text-amber-600 dark:text-amber-400",
          RESTAURANT: "border-orange-400 text-orange-600 dark:text-orange-400",
          PHARMACY: "border-emerald-500 text-emerald-600 dark:text-emerald-400"
        };
        const KIND_LABEL: Record<string, string> = {
          ONLINE: "مندوب أونلاين",
          PURCHASE: "مندوب مشتريات",
          RESTAURANT: "مندوب مطاعم",
          PHARMACY: "مندوب صيدلية"
        };

        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {value} {driverId && <span className="text-xs text-muted-foreground font-normal font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">#{driverId}</span>}
            </span>
            {kind ? (
              <Badge variant="outline" className={`text-xs w-fit ${KIND_STYLES[kind] ?? ""}`}>
                {KIND_LABEL[kind] ?? kind}
              </Badge>
            ) : orderType ? (
              <Badge variant="secondary" className="text-xs w-fit font-normal">
                {t(orderType) || orderType}
              </Badge>
            ) : null}
          </div>
        );
      }
    },
    {
      id: "delayAction",
      header: () => <IconHeader columnKey="Delay Action" />,
      cell: ({ row }) => (
        <OrderDelaySelect orderId={row?.original?.id} compact />
      )
    },
    {
      id: "adminNote",
      header: () => <IconHeader columnKey="Admin Note" />,
      cell: ({ row }) => {
        const status = row?.original?.status;
        const isDisabled = status === "DELIVERED";
        const note = row?.original?.adminNote;
        return (
          <div className="flex flex-col gap-2 min-w-[150px]">
            {note && (
              <span className="text-sm text-muted-foreground whitespace-pre-wrap">
                {note}
              </span>
            )}
            <AdminNoteDialog
              orderId={row?.original?.id}
              initialNote={note}
              disabled={isDisabled}
            />
          </div>
        );
      }
    }
  ];

  return columns;
}
