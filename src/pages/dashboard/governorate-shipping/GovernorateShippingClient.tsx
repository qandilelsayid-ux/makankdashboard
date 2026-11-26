"use client";

import { fetchHelper } from "@/api/fetch";
import CitySelector from "@/components/shared/CitySelector";
import { OrdersTab } from "@/components/pages/_governorate-shipping/OrdersTab";
import { RoutesTab } from "@/components/pages/_governorate-shipping/RoutesTab";
import { ShippingOptionsTab } from "@/components/pages/_governorate-shipping/ShippingOptionsTab";
import {
  GovernoratesCentersTab,
  VillagesTab,
} from "@/components/pages/_governorate-shipping/LocationsTabs";
import {
  formatCityLabel,
  ShippingGovernorate,
  ShippingVillage,
} from "@/components/pages/_governorate-shipping/types";
import { apiClient } from "@/lib/axios";
import { useCityStore } from "@/store/cityStore";
import { useQuery } from "@tanstack/react-query";
import { Boxes, Building2, MapPin, Package, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";

type TabId = "orders" | "routes" | "options" | "villages" | "governorates";

export default function GovernorateShippingClient(): JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const selectedCityId = useCityStore((s) => s.selectedCityId);

  // Detect logged-in user (Super Admin vs City Admin with managedCityId)
  const { data: meUser } = useQuery({
    queryKey: ["shippingMeUser"],
    queryFn: async () => {
      const res = await apiClient.get("/api/users/me");
      return res?.data?.data?.user ?? res?.data?.data ?? null;
    },
    staleTime: 60_000,
  });

  const managedCityId = meUser?.managedCityId ? Number(meUser.managedCityId) : null;
  const isCityAdmin = Boolean(managedCityId && managedCityId > 0);
  const effectiveCityId = isCityAdmin ? managedCityId : selectedCityId;

  // Cities list (for Super Admin city selector & city labels)
  const { data: citiesRes } = useQuery({
    queryKey: ["shippingCitiesList"],
    queryFn: async () =>
      fetchHelper({
        endPoint: ["cities"],
        method: "GET",
        params: { limit: 500 },
      }),
    staleTime: 60_000,
  });

  const citiesList = useMemo(
    () => (Array.isArray(citiesRes?.data) ? citiesRes.data : []),
    [citiesRes],
  );

  const currentCityObj = useMemo(
    () => citiesList.find((c: any) => Number(c.id) === Number(effectiveCityId)),
    [citiesList, effectiveCityId],
  );

  // Shared Governorates & Centers
  const {
    data: govsRes,
    isLoading: isGovsLoading,
    refetch: refetchGovs,
  } = useQuery({
    queryKey: ["governorateShippingGovernorates"],
    queryFn: async () =>
      fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingGovs"],
        method: "GET",
        params: { includeInactive: "true" },
      }),
  });

  const govsList: ShippingGovernorate[] = useMemo(
    () => (Array.isArray(govsRes?.data) ? govsRes.data : []),
    [govsRes],
  );

  // City-scoped Villages
  const {
    data: villagesRes,
    isLoading: isVillagesLoading,
    refetch: refetchVillages,
  } = useQuery({
    queryKey: ["governorateShippingVillages", effectiveCityId],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (effectiveCityId) params.cityId = String(effectiveCityId);
      return fetchHelper({
        endPoint: ["governorateShipping", "govShippingAdmin", "govShippingVillages"],
        method: "GET",
        params,
      });
    },
  });

  const villagesList: ShippingVillage[] = useMemo(
    () => (Array.isArray(villagesRes?.data) ? villagesRes.data : []),
    [villagesRes],
  );

  const tabs: Array<{ id: TabId; label: string; icon: typeof Package }> = [
    { id: "orders", label: "طلبات الشحن", icon: Package },
    { id: "routes", label: "المسارات والأسعار", icon: Truck },
    { id: "options", label: "الحمولة والأوزان", icon: Boxes },
    { id: "villages", label: "قرى ومناطق المدينة", icon: MapPin },
    { id: "governorates", label: "المحافظات ومراكزها", icon: Building2 },
  ];

  return (
    <div className="space-y-6">
      {/* City Admin / Super Admin Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-2.5 text-xs">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-foreground">
              {isCityAdmin
                ? `إدارة شحن مدينة: ${formatCityLabel(currentCityObj)}`
                : effectiveCityId
                  ? `عرض إدارة شحن مدينة: ${formatCityLabel(currentCityObj)}`
                  : "عرض جميع المدن (سوبر أدمن)"}
            </div>
            <p className="text-muted-foreground mt-0.5">
              {isCityAdmin
                ? "قرى مدينتك وأوبشنات الحمولة ومساراتك وطلباتك معزولة لمدينتك فقط، والمحافظات ومراكزها متاحة للتوصيل لأي مكان."
                : "اختر مدينة من القائمة لإدارة قراها وأوبشنات الحمولة والوزن ومساراتها، أو اعرض الكل."}
            </p>
          </div>
        </div>

        {!isCityAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-muted-foreground">فلتر المدينة:</span>
            <CitySelector className="w-[200px]" />
          </div>
        )}
      </div>

      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-800 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "orders" && <OrdersTab effectiveCityId={effectiveCityId} />}

      {activeTab === "routes" && (
        <RoutesTab
          effectiveCityId={effectiveCityId}
          isCityAdmin={isCityAdmin}
          govsList={govsList}
          villagesList={villagesList}
          citiesList={citiesList}
        />
      )}

      {activeTab === "options" && (
        <ShippingOptionsTab
          effectiveCityId={effectiveCityId}
          isCityAdmin={isCityAdmin}
          citiesList={citiesList}
        />
      )}

      {activeTab === "villages" && (
        <VillagesTab
          effectiveCityId={effectiveCityId}
          isCityAdmin={isCityAdmin}
          villagesList={villagesList}
          isLoading={isVillagesLoading}
          citiesList={citiesList}
          refetchVillages={() => refetchVillages()}
        />
      )}

      {activeTab === "governorates" && (
        <GovernoratesCentersTab
          govsList={govsList}
          isLoading={isGovsLoading}
          isCityAdmin={isCityAdmin}
          refetchGovs={() => refetchGovs()}
        />
      )}
    </div>
  );
}
