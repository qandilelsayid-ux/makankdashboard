'use client'
import { PriceAmount } from "@/components/PriceAmount";
import DateCol from "@/components/common/table/columns/date.column";
import IconHeader from "@/components/common/table/columns/icon-header";
import LocaleViewColumn from "@/components/common/table/columns/locale-view.column";
import TextCol from "@/components/common/table/columns/text.column";
import { Badge } from "@/components/ui/badge";
import { useLocale, useTranslations } from "@/lib/i18n";
import { type ColumnDef } from "@tanstack/react-table";

const getLocalizedName = (value: unknown, locale: string) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const localizedValue = value as Record<string, unknown>;
    return String(localizedValue[locale] || localizedValue.en || localizedValue.ar || "");
  }
  return String(value);
};

export default function CouponsColumns(): ColumnDef<Record<string, unknown>>[] {
  const t = useTranslations();
  const locale = useLocale();
  const columns = [
    {
      accessorKey: "title",
      header: () => <IconHeader key="title" columnKey="title" />,
      cell: ({ row }) => {
        const en = row.original.title?.en as string;
        const ar = row.original.title?.ar as string;
        return (
          <LocaleViewColumn value={{ en, ar }} />
        );
      }
    },
    {
      accessorKey: "code",
      header: () => <IconHeader columnKey="code" />,
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-1.5">
          <TextCol text={getValue() as string} />
          {(row.original as any)?.isHidden && (
            <Badge variant="secondary" className="text-[10px]">{t("hiddenCouponBadge")}</Badge>
          )}
        </div>
      )
    },
    {
      accessorKey: "type",
      header: () => <IconHeader columnKey="type" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "discountType",
      header: () => <IconHeader columnKey="discountType" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "discountValue",
      header: () => <IconHeader columnKey="discountValue" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "maxUsage",
      header: () => <IconHeader columnKey="maxUsage" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "usageCount",
      header: () => <IconHeader columnKey="usageCount" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "minOrderAmount",
      header: () => <IconHeader columnKey="minOrderAmount" />,
      cell: ({ getValue }) => <PriceAmount value={getValue() as number} />
    },
    {
      accessorKey: "startDate",
      header: () => <IconHeader columnKey="startDate" />,
      cell: ({ getValue }) => <DateCol date={getValue()} />
    },
    {
      accessorKey: "endDate",
      header: () => <IconHeader columnKey="endDate" />,
      cell: ({ getValue }) => <DateCol date={getValue()} />
    },
    {
      accessorKey: "minDiscountValue",
      header: () => <IconHeader columnKey="minDiscountValue" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      accessorKey: "maxDiscountValue",
      header: () => <IconHeader columnKey="maxDiscountValue" />,
      cell: ({ getValue }) => <TextCol text={getValue() as string} />
    },
    {
      id: "couponZones",
      header: () => <IconHeader columnKey="zoneIds" />,
      cell: ({ row }) => {
        const couponZones = (row.original.CouponZones || row.original.ZoneCoupons || []) as Array<{
          Zone?: { name?: unknown };
          zoneId?: number;
        }>;

        if (couponZones.length === 0) {
          return <Badge variant="outline">{t("Global coupon")}</Badge>;
        }

        return (
          <div className="flex flex-wrap gap-1">
            {couponZones.slice(0, 2).map((item, index) => (
              <Badge key={`${item.zoneId ?? index}`} variant="secondary">
                {getLocalizedName(item.Zone?.name, locale) || `#${item.zoneId}`}
              </Badge>
            ))}
            {couponZones.length > 2 && (
              <Badge variant="outline">+{couponZones.length - 2}</Badge>
            )}
          </div>
        );
      }
    },
    {
      accessorKey: "createdAt",
      header: () => <IconHeader columnKey="createdAt" />,
      cell: ({ getValue }) => <DateCol date={getValue()} />
    }
  ];

  return columns;
}
