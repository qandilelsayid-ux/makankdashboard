'use client'
import DateCol from "@/components/common/table/columns/date.column";
import IconHeader from "@/components/common/table/columns/icon-header";
import LocaleViewColumn from "@/components/common/table/columns/locale-view.column";
import { ImageCell } from "@/components/common/table/columns/img-cell";
import StatusCol from "@/components/common/table/columns/status.column";
import { type ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "@/lib/i18n";

export default function BannersColumns(): ColumnDef<Record<string, unknown>>[] {
  const t = useTranslations();

  const columns = [
    {
      accessorKey: "name",
      header: () => <IconHeader key="name" columnKey="Name" />,
      cell: ({ row }) => {
        const en = row.original.name?.en as string;
        const ar = row.original.name?.ar as string;
        return (
          <LocaleViewColumn value={{ en, ar }} />
        );
      }
    },
    {
      accessorKey: "image",
      header: () => <IconHeader columnKey="Image" />,
      cell: ({ getValue }) => {
        const image = getValue() as string;
        return (
          <div className="flex items-center justify-center w-full h-12 overflow-hidden">
            <ImageCell cell={image} />
          </div>
        );
      }
    },
    {
      accessorKey: "active",
      header: () => <IconHeader columnKey="Active" />,
      cell: ({ getValue }) => <StatusCol value={getValue() as string} />
    },
    {
      accessorKey: "isCurrentlyActive",
      header: () => <IconHeader columnKey="Currently Active" />,
      cell: ({ getValue }) => <StatusCol value={getValue() as string} />
    },
    {
      accessorKey: "targetType",
      header: () => <IconHeader columnKey="Target Type" />,
      cell: ({ getValue }) => {
        const targetType = String(getValue() || "GENERAL");

        return (
          <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200">
            {t(targetType)}
          </span>
        );
      }
    },
    {
      id: "city",
      header: () => <IconHeader columnKey="City" />,
      cell: ({ row }) => {
        const city = row.original.City as any;
        const cityName = city?.name
          ? typeof city.name === "object"
            ? city.name.ar || city.name.en
            : city.name
          : null;
        return cityName ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/40 bg-sky-50 dark:bg-sky-950/20 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
            📍 {cityName}
          </span>
        ) : (
          <span className="text-muted-foreground text-xs">{t("All Cities") || "جميع المدن"}</span>
        );
      }
    },
    {
      accessorKey: "order",
      header: () => <IconHeader columnKey="Order" />,
      cell: ({ getValue }) => <span>{String(getValue() ?? "—")}</span>
    },
    {
      accessorKey: "clickCount",
      header: () => <IconHeader columnKey="Clicks" />,
      cell: ({ getValue }) => <span>{Number(getValue() ?? 0).toLocaleString()}</span>
    },
    {
      accessorKey: "createdAt",
      header: () => <IconHeader columnKey="CreatedAt" />,
      cell: ({ getValue }) =>
        <DateCol date={getValue() as string} />
    },
    {
      accessorKey: "endDate",
      header: () => <IconHeader columnKey="End Date" />,
      cell: ({ getValue }) => {
        const endDate = getValue() as string | null | undefined;

        return endDate ? <DateCol date={endDate} /> : <span className="text-gray-400">—</span>;
      }
    },
  ];
  return columns;
}
