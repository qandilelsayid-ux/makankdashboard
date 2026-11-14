export const links = ({ permissions, pendingReservationsCount }: { permissions: Permission; pendingReservationsCount?: number }): NavItem[] => {
  return (
    [

      permissions?.statistics?.get && {
        title: "Dashboard",
        url: "/dashboard"
      },
      permissions?.statistics?.get && {
        title: "financialOverview",
        url: "/dashboard/financial-overview"
      },
      (permissions?.statistics?.get || permissions?.analytics?.get) && {
        title: "activityAnalytics",
        url: "/analytics"
      },
      permissions?.logs?.get && {
        title: "activityLogs",
        url: "/logs"
      },
      permissions?.Stores?.get && {
        title: "stores",
        url: "/stores"
      },
      (permissions?.Stores?.get || permissions?.stores?.get) && {
        title: "Kiosk",
        url: "/kiosk"
      },
      permissions?.Stores?.get && {
        title: "storePricingAndAnnouncements",
        url: "/stores/pricing-announcements"
      },
      (permissions?.["store-templates"]?.get || permissions?.storeTemplates?.get) && {
        title: "storeTemplates",
        url: "/store-templates"
      },
      permissions?.Schedule?.get && {
        title: "schedule",
        url: "/schedule"
      },
      permissions?.Branches?.get && {
        title: "branches",
        url: "/branches"
      },

      permissions?.Service?.get && {
        title: "services",
        url: "/services"
      },

      permissions?.Service?.get && {
        title: "Offers",
        url: "/offers"
      },

      (permissions?.Banners?.get ||
        permissions?.banners?.get ||
        permissions?.["special-delivery-banners"]?.get ||
        permissions?.specialDeliveryBanners?.get ||
        permissions?.Rating?.get ||
        permissions?.rating?.get ||
        permissions?.Coupons?.get ||
        permissions?.coupons?.get ||
        permissions?.Service?.get ||
        permissions?.services?.get ||
        permissions?.["Social Media"]?.get ||
        permissions?.socialMedia?.get ||
        permissions?.["store-categories"]?.get ||
        permissions?.campaigns?.get ||
        permissions?.["variation-templates"]?.get ||
        permissions?.["fortune-wheel"]?.get) && {
        title: "content",
        items: [
          (permissions?.Banners?.get || permissions?.banners?.get) && {
            title: "homeBuilder",
            url: "/home-builder"
          },
          (permissions?.Banners?.get || permissions?.banners?.get) && {
            title: "banners",
            url: "/banners"
          },
          (permissions?.["special-delivery-banners"]?.get || permissions?.specialDeliveryBanners?.get || permissions?.Banners?.get || permissions?.banners?.get) && {
            title: "specialDeliveryBanners",
            url: "/special-delivery-banners"
          },
          (permissions?.Banners?.get || permissions?.banners?.get || permissions?.["fortune-wheel"]?.get) && {
            title: "fortuneWheel",
            url: "/banners/fortune-wheel"
          },
          permissions?.campaigns?.get && {
            title: "campaignsCenter",
            url: "/campaigns"
          },
          (permissions?.Rating?.get || permissions?.rating?.get) && {
            title: "rating",
            url: "/rating"
          },
          (permissions?.Coupons?.get || permissions?.coupons?.get) && {
            title: "coupons",
            url: "/coupons"
          },
          (permissions?.["variation-templates"]?.get || permissions?.variationTemplate?.get) && {
            title: "variationTemplate",
            url: "/variationTemplate"
          },
          (permissions?.["Social Media"]?.get || permissions?.socialMedia?.get) && {
            title: "socialMedia",
            url: "/socialMedia"
          }
        ].filter(Boolean)
      },

      (permissions?.Roles?.get ||
        permissions?.Permissions?.get ||
        permissions?.Users?.get ||
        permissions?.Employees?.get ||
        permissions?.Customers?.get ||
        permissions?.delivery?.get ||
        permissions?.specialists?.get) && {
        title: "users & access",
        items: [
          permissions?.Roles?.get && {
            title: "roles",
            url: "/roles"
          },
          permissions?.Permissions?.get && {
            title: "permissions",
            url: "/permissions"
          },
          permissions?.delivery?.get && {
            title: "delivery",
            url: "/delivery"
          },
          (permissions?.["driver-points"]?.get || permissions?.["Driver Points & Levels"]?.get) && {
            title: "driverPoints",
            url: "/driver-points"
          },
          permissions?.Users?.get && {
            title: "users",
            url: "/users"
          },
          permissions?.Employees?.get && {
            title: "employees",
            url: "/employees"
          },
          permissions?.Customers?.get && {
            title: "customers",
            url: "/customers"
          },
          (permissions?.notification?.get || permissions?.notifications?.get || permissions?.["system-notifications"]?.get || permissions?.Roles?.get) && {
            title: "notifications",
            url: "/notifications"
          }
        ].filter(Boolean)
      },

      (permissions?.Cities?.get || permissions?.cities?.get || permissions?.Zones?.get || permissions?.zones?.get) && {
        title: "locations",
        items: [
          (permissions?.Cities?.get || permissions?.cities?.get) && {
            title: "cities",
            url: "/cities"
          },
          (permissions?.Zones?.get || permissions?.zones?.get) && {
            title: "zones",
            url: "/zones"
          }
        ].filter(Boolean)
      },

      (permissions?.Orders?.get || permissions?.orders?.get || permissions?.Complaints?.get || permissions?.complaints?.get) && {
        title: "orders & support",
        items: [
          (permissions?.Orders?.get || permissions?.orders?.get) && {
            title: "orders",
            url: "/orders"
          },
          (permissions?.Orders?.get || permissions?.orders?.get) && {
            title: "archivedOrders",
            url: "/orders/archived"
          },
          (permissions?.Orders?.get || permissions?.orders?.get || permissions?.Stores?.get) && {
            title: "tableReservations",
            url: "/table-reservations",
            info: (pendingReservationsCount && pendingReservationsCount > 0) ? (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
                {pendingReservationsCount}
              </span>
            ) : undefined
          },
          (permissions?.Orders?.get || permissions?.orders?.get) && {
            title: "governorateShipping",
            url: "/governorate-shipping"
          },
          (permissions?.Complaints?.get || permissions?.complaints?.get) && {
            title: "complaint",
            url: "/complaint"
          }
        ].filter(Boolean)
      },

      (permissions?.withdraw?.get ||
        permissions?.fund?.get ||
        permissions?.transactions?.get ||
        permissions?.wallet?.get ||
        permissions?.delivery?.get ||
        permissions?.Stores?.get ||
        permissions?.accounting?.get) && {
        title: "accounting",
        items: [
          permissions?.withdraw?.get && {
            title: "withdraw",
            url: "/withdraw"
          },
          permissions?.fund?.get && {
            title: "fund",
            url: "/fund"
          },
          permissions?.transactions?.get && {
            title: "transactions",
            url: "/transactions"
          },
          permissions?.wallet?.get && {
            title: "wallet",
            url: "/wallet"
          },
          (permissions?.delivery?.get || permissions?.withdraw?.get) && {
            title: "Driver Withdrawals",
            url: "/delivery/withdrawals"
          },
          (permissions?.delivery?.get || permissions?.withdraw?.get) && {
            title: "Cash Settlements",
            url: "/delivery/cash-settlements"
          },
          (permissions?.Stores?.get || permissions?.accounting?.get || permissions?.withdraw?.get) && {
            title: "Partner Settlements",
            url: "/partner-settlements"
          }
        ].filter(Boolean)
      },
      (permissions?.loyalty?.get || permissions?.["Loyalty Points"]?.get) && {
        title: "loyaltyPoints",
        url: "/loyalty"
      },
      (permissions?.["service-schedules"]?.get || permissions?.["Service Schedules"]?.get || permissions?.settings?.get || permissions?.Settings?.get) && {
        title: "serviceSchedules",
        url: "/service-schedules"
      },
      (permissions?.settings?.get || permissions?.Settings?.get) && {
        title: "settings",
        url: "/settings"
      }
    ]
      .map(item => {
        if (!item || !("items" in item)) {
          return item;
        }

        if (!item?.items?.length) {
          return undefined;
        }

        return item;
      })
      .filter(Boolean) as NavItem[]
  ).filter(Boolean) as NavItem[]; // Filter out any undefined values
};
