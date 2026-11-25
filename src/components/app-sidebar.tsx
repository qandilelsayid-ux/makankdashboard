import { fetchHelper } from "@/api/fetch";
import getPermissions from "@/api/permissions";
import { SidebarBrandHeader } from "@/components/sidebar-brand-header";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from "@/components/ui/sidebar";
import SideBarItems from "./layouts/sidebar/SideBarItems";
import SidebarFooterContent from "./layouts/sidebar/SidebarFooterContent";
import { links } from "./layouts/sidebar/sidebar-data";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const FALLBACK_SIDEBAR_PERMISSIONS = {
  statistics: { get: true },
  Stores: { get: true },
  "customer-categories": { get: true },
  customerCategories: { get: true },
  "store-templates": { get: true },
  storeTemplates: { get: true },
  Schedule: { get: true },
  Branches: { get: true },
  Rating: { get: true },
  Banners: { get: true },
  Categories: { get: true },
  Service: { get: true },
  Coupons: { get: true },
  "Social Media": { get: true },
  Roles: { get: true },
  Permissions: { get: true },
  Users: { get: true },
  Customers: { get: true },
  delivery: { get: true },
  specialists: { get: true },
  Cities: { get: true },
  Zones: { get: true },
  Orders: { get: true },
  Complaints: { get: true },
  withdraw: { get: true },
  fund: { get: true },
  transactions: { get: true },
  wallet: { get: true },
  loyalty: { get: true },
  settings: { get: true }
} as unknown as Permission;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const permissionsQuery = useQuery({
    queryKey: ["myPermissions"],
    queryFn: getPermissions,
    staleTime: 60_000,
    retry: false
  });

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchHelper({ endPoint: ["profile"] }),
    staleTime: 60_000,
    retry: false
  });

  const pendingReservationsQuery = useQuery({
    queryKey: ["tableReservationsPendingCount"],
    queryFn: () => fetchHelper({ endPoint: ["tableReservations", "tableReservationsPendingCount"] }),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false
  });
  const pendingReservationsCount = (pendingReservationsQuery.data as any)?.data?.pendingCount ?? 0;

  // Mart / Kiosk orders waiting for the admin. Counted on the server from the
  // DB (not from a loaded page), so refetching never double-counts an order.
  const martKioskPendingQuery = useQuery({
    queryKey: ["martKioskPendingCount"],
    // Silent: a backend that doesn't have this count yet must not toast every 30s.
    queryFn: () => fetchHelper({ endPoint: ["orders", "martKioskPending"], redirectOnUnauthorized: false, silent: true }),
    staleTime: 30_000,
    refetchInterval: 30_000,
    retry: false
  });
  const martKiosk = (martKioskPendingQuery.data as any)?.data ?? {};
  const counts = {
    pendingReservationsCount,
    martPendingCount: Number(martKiosk.mart) || 0,
    kioskPendingCount: Number(martKiosk.kiosk) || 0
  };

  const filterLink = useMemo(() => {
    const profile = profileQuery.data?.data?.user;
    const isSuperAdmin =
      (profile?.roleKey === "Admin" || profile?.Role?.roleKey === "Admin") &&
      (profile?.Role?.default === true || profile?.default === true);

    if (isSuperAdmin) {
      if (permissionsQuery.data && Object.keys(permissionsQuery.data).length > 0) {
        // The super admin bypasses permission checks on the API, so always show
        // newer pages even before their permission rows are seeded in the DB.
        return links({
          permissions: { ...permissionsQuery.data, loyalty: { get: true } } as unknown as Permission,
          ...counts
        });
      }
      return links({ permissions: FALLBACK_SIDEBAR_PERMISSIONS, ...counts });
    }

    if (permissionsQuery.data) {
      return links({ permissions: permissionsQuery.data, ...counts });
    }

    return [];
  }, [permissionsQuery.data, profileQuery.data, pendingReservationsCount, counts.martPendingCount, counts.kioskPendingCount]);
  const profile = profileQuery.data?.data?.user;

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarBrandHeader />
      </SidebarHeader>
      <SidebarContent>
        <SideBarItems links={filterLink} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent
          email={profile?.email ?? ""}
          name={profile?.name ?? ""}
          image={profile?.image ?? ""}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
