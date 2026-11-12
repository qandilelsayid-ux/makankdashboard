import OrdersColumns from "@/pages/dashboard/orders/OrdersColumns";
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";
import TableBasic from "@/components/common/table/TableBasic";
import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import BulkAssignOrdersAction from "./BulkAssignOrdersAction";
import SingleOrderDeleteAction from "./SingleOrderDeleteAction";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useSearchParams, usePathname } from "@/lib/navigation";
import { useNavigate } from "react-router-dom";

type OrdersViewTabsProps = {
  tableTitle: string;
  filters?: FormInput[];
  endPoint?: (string | number)[];
};

const getDefaultFilters = (t: ReturnType<typeof useTranslations>): FormInput[] => [
  {
    name: "type",
    type: "select",
    options: [
      { label: t("DELIVERY"), value: "DELIVERY" },
      { label: t("PICKUP"), value: "PICKUP" },
      { label: t("CUSTOM_DELIVERY"), value: "CUSTOM_DELIVERY" }
    ]
  },
  {
    name: "category",
    type: "select",
    options: [
      { label: t("NORMAL"), value: "NORMAL" },
      { label: t("SCHEDULED"), value: "SCHEDULED" }
    ]
  },
  {
    name: "branchId",
    type: "selectPaginated",
    apiUrl: ["branches"],
    labelFormat: "storeBranch"
  },
  {
    name: "deliveryId",
    type: "selectPaginated",
    apiUrl: ["delivery"]
  },
  {
    name: "userId",
    type: "selectPaginated",
    apiUrl: ["users"]
  },
  {
    name: "cityId",
    type: "selectPaginated",
    apiUrl: ["cities"]
  },
  {
    name: "zoneId",
    type: "selectPaginated",
    apiUrl: ["zones"]
  },
  {
    name: "fromDate",
    type: "date"
  },
  {
    name: "toDate",
    type: "date"
  }
];

export default function OrdersViewTabs({
  tableTitle,
  filters,
  endPoint = ["orders"]
}: OrdersViewTabsProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const navigate = useNavigate();
  const pathname = usePathname();
  const columns = OrdersColumns();
  const resolvedFilters = filters ?? getDefaultFilters(t);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Build params from URL search params.
  const params: Record<string, unknown> = {
    page: 1,
    limit: 15
  };
  searchParams.forEach((value, key) => { params[key] = value; });

  // Guard against heavy limits (> 20) to ensure high performance and prevent server timeouts
  if (params.limit && Number(params.limit) > 20) {
    params.limit = 20;
  }

  const queryKey = [endPoint.join("/"), JSON.stringify(params)];
  const { data: response } = useApiQuery({ queryKey, endPoint, params, staleTime: 0 });

  // Fetch active cities to display dynamic city selector boxes/tabs
  const { data: citiesResponse } = useApiQuery({
    queryKey: ["orders-active-cities-tabs"],
    endPoint: ["cities"],
    params: { limit: 50, active: true },
    staleTime: 60000
  });
  const cities: Record<string, any>[] = Array.isArray(citiesResponse?.data) ? citiesResponse.data : [];
  const currentCityId = params.cityId ? String(params.cityId) : "";

  const handleSelectCity = (cityId?: number | string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (cityId) {
      nextParams.set("cityId", String(cityId));
    } else {
      nextParams.delete("cityId");
    }
    nextParams.set("page", "1");
    navigate(`${pathname}?${nextParams.toString()}`);
  };

  const orders: Record<string, unknown>[] = Array.isArray(response?.data) ? response.data : [];
  const total = response?.total ?? orders.length;

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleVisibleOrdersSelection = (orderIds: string[]) => {
    setSelectedOrderIds(prev => {
      const allVisibleSelected = orderIds.every(id => prev.includes(id));
      if (allVisibleSelected) {
        return prev.filter(id => !orderIds.includes(id));
      }

      return Array.from(new Set([...prev, ...orderIds]));
    });
  };

  return (
    <div className="space-y-4">
      <BulkAssignOrdersAction
        selectedOrderIds={selectedOrderIds}
        onClearSelection={() => setSelectedOrderIds([])}
      />

      {cities.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-2 bg-card rounded-xl border border-border shadow-sm">
          <div className="text-xs font-semibold text-muted-foreground px-2 flex items-center gap-1.5">
            <span>🏙️</span>
            <span>{t("City") || "المدينة"}:</span>
          </div>
          <button
            type="button"
            onClick={() => handleSelectCity()}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !currentCityId
                ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40"
            }`}
          >
            {t("All Cities") || "جميع المدن"}
          </button>
          {cities.map((city) => {
            const isSelected = String(city.id) === currentCityId;
            const cityName =
              typeof city.name === "object"
                ? city.name?.ar || city.name?.en || ""
                : String(city.name || "");
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleSelectCity(city.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted border border-border/40"
                }`}
              >
                <span>📍</span>
                <span>{cityName}</span>
              </button>
            );
          })}
        </div>
      )}

      <TableBasic
        data={orders}
        hideCreateNew
        columns={columns}
        pagination={{
          total: total ?? orders?.length
        }}
        tableActions={{
          onInfo: true,
          fixedActions: true,
          renderRowActions: row => <SingleOrderDeleteAction orderId={row.id as number | string} />
        }}
        cardHeader={tableTitle}
        filters={resolvedFilters}
        rowSelection={{
          selectedIds: selectedOrderIds,
          onToggle: toggleOrderSelection,
          onToggleAll: toggleVisibleOrdersSelection,
          getRowId: row => String(row.id)
        }}
      />
    </div>
  );
}
