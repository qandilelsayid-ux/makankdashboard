export type PermissionAction = "get" | "post" | "put" | "patch" | "delete";

export const routePermissionMap: Record<string, string> = {
  banners: "Banners",
  "special-delivery-banners": "special-delivery-banners",
  branches: "Branches",
  category: "Categories",
  categories: "Categories",
  cities: "Cities",
  complaint: "Complaints",
  coupons: "Coupons",
  customers: "Customers",
  delivery: "deliveryAll",
  modules: "Modules",
  permissions: "Permissions",
  roles: "Roles",
  schedule: "Schedule",
  services: "Service",
  offers: "Service",
  socialMedia: "Social Media",
  "social-media": "Social Media",
  stores: "Stores",
  transactions: "transactions",
  users: "Users",
  employees: "Employees",
  withdraw: "withdraw",
  zones: "Zones",
  languages: "Languages",
  profile: "Profile",
  addresses: "Addresses",
  subcategories: "SubCategories",
  settings: "settings",
  "system-notifications": "System Notifications",
  fund: "fund",
  orders: "Orders",
  servicerating: "Service Rating",
  storerating: "Store Rating",
  statistics: "statistics",
  notification: "notification",
  specialists: "specialists",
  wallet: "wallet",
  "store-categories": "store-categories",
  "store-block": "block store",
  "sub-categories": "Sub Categories",
  "store-commission": "Store Commission",
  rating: "Rating",
  "booking-categories": "booking-categories",
  "booking-places": "booking-places",
  "booking-items": "booking-items",
  "booking-fields": "booking-fields",
  "booking-slots": "booking-slots",
  "booking-banners": "booking-banners",
  "booking-payment-settings": "booking-payment-settings",
  "booking-reviews": "bookings",
  bookings: "bookings"
};

export function resolvePermissionKeyFromPath(pathname: string): string | undefined {
  const segments = pathname.split("/").filter(Boolean);
  const routeSegment = segments[1];
  return routeSegment ? routePermissionMap[routeSegment] : undefined;
}

