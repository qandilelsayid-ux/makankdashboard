
export const endpoints = {
  adminLogin: "/api/authentication/login/Admin",
  resetPassword: "/api/authentication/reset-password",
  changePassword: "/api/users/me/change-password",
  myPermissions: "/api/users/me/permissions",
  forgetPassword: "/api/authentication/forget-password/ADMIN",
  modules: "/api/modules", // PAGE , FORM
  user: "/api/user",
  "my-profile": "/api/users/me",
  notifications: "/api/notification",
  readAllNotifications: "/api/notification/mark-read",
  logs: "/api/logs",
  userStatistics: "/api/users/statistics",
  permissions: "/api/permissions",
  systemPermissions: '/api/permissions/system',
  block: "/block",
  customers: "/api/customers", // PAGE , FORM
  banners: "/api/banners",
  bannerStatistics: "/statistics",
  bannerStoreZones: "/zones",
  specialDeliveryBanners: "/api/special-delivery-banners",
  specialDeliveryBannersStats: "/statistics",
  specialDeliveryBannersStoreZones: "/zones",
  campaigns: "/api/campaigns",
  campaignStatus: "/status",
  fortuneWheel: "/api/fortune-wheel",
  loyalty: "/api/loyalty",
  loyaltySettings: "/settings",
  loyaltyAdmin: "/admin",
  loyaltyRewards: "/rewards",
  loyaltyTransactions: "/transactions",
  loyaltyCustomers: "/customers",
  loyaltyAdjust: "/adjust",
  driverPoints: "/api/driver-points",
  driverPointsAdmin: "/admin",
  driverPointsSettings: "/settings",
  driverPointsLevels: "/levels",
  driverPointsLeaderboard: "/leaderboard",
  driverPointsDrivers: "/drivers",
  driverPointsTransactions: "/transactions",
  driverPointsReviews: "/reviews",
  driverPointsAdjust: "/adjust",
  driverPointsBonus: "/bonus",
  loyaltyMilestones: "/milestones",
  loyaltyMilestoneGrants: "/grants",
  fortuneWheelSettings: "/settings",
  toggleStatus: "/toggle-status",
  fund: "/api/fund",
  storeStatistics: "/api/statistics/store",
  commission: "/commission",
  userWallet: '/api/users/me/wallet',
  storeMeWallet: '/api/stores/me/wallet',
  coupons: "/api/coupons",
  subscriptionStatistics: "/api/subscription/statistics",
  studentSubscriptions: "/api/students/my/subscriptions",
  accountingStatistics: "/api/accounting/statistics",
  updatePassword: "/authentication/change-password",
  profile: "/api/users/me",
  users: "/api/users",
  stores: "/api/stores",
  store: "/store",
  storePartner: "/partner",
  partnerSettlements: "/api/stores/partner-settlements",
  deliverySchedule: "/api/deliveryData/schedule",
  rating: '/api/rating',
  roles: "/api/roles",
  role: '/api/roles',
  zones: "/api/zones",
  categories: "/api/categories",
  storeTemplatesCategories: "/api/store-templates/categories",
  activateUser: "/api/user/activate",
  schedule: "/api/schedule",
  variationTemplate: '/api/variation-templates',
  cities: "/api/cities", // FORM , PAGE
  ordersStatistics: "/api/orders/statistics", // DONE
  withdraw: "/api/withdraw",
  fox: '/PREPARING',
  unassign: '/unassign',
  adminNotifications: "/api/admin-notifications",
  "admin-notifications": "/api/admin-notifications",
  orders: "/api/orders",
  bulkDelete: "/bulk-delete",
  "bulk-delete": "/bulk-delete",
  resetWallet: "/reset-wallet",
  "reset-wallet": "/reset-wallet",
  settleWallet: "/settle-wallet",
  "settle-wallet": "/settle-wallet",
  settleFortuneDiscounts: "/settle-fortune-discounts",
  "settle-fortune-discounts": "/settle-fortune-discounts",
  customDelivery: "/custom-delivery",
  customDeliveryImages: "/images",
  advance: "/advance",
  finish: "/finish",
  ordersArchived: "/api/orders/archived",
  archived: "/archived",
  realize: "/realize",
  "admin-note": '/admin-note',
  transactions: "/api/transactions",
  transactionsStatistics: "/api/transactions/statistics",
  refreshToken: "/api/authentication/refresh-token",
  verifyAccount: '/api/authentication/verify',
  verifyResetPassword: "/api/authentication/verify-reset-password",
  logout: "/api/authentication/logout",
  resetAdminPassword: "/api/users/me/change-password", // renamed from "s" to be more descriptive
  //////////////////////////////////////////////
  socialMedia: "/api/social-media",
  allRoles: "/api/roles",
  keyvalue: "/api/keyvalue",
  statistics: "/api/statistics",
  financialOverview: "/api/statistics/financial-overview",
  services: "/api/services",
  status: "/status",
  deliveryRegister: "/api/delivery/register",
  deliveryAll: "/api/delivery/all",
  delivery: "/api/delivery",
  deliveryDashboard: "/dashboard",
  assign: "/assign",
  reply: "/reply",
  branches: "/api/branches",
  storeCategories: "/api/categories",
  subCategoryStore: "/api/categories",
  languages: "/api/languages",
  complaint: "/api/complaint",
  settings: "/api/settings",
  PENDING: "/PENDING",
  PREPARING: "/PREPARING",
  READY_PICKUP: "/READY_PICKUP",
  ON_THE_WAY: "/ON_THE_WAY",
  DELIVERED: "/DELIVERED",
  CANCELLED: "/CANCELLED",
  REJECTED: "/REJECTED",
  PAYMENT_FAILD: "/PAYMENT_FAILD",
  PENDING_PAYMENT: "/PENDING_PAYMENT",
  customerCategories: "/api/categories",
  customerCategoriesAssign: "/api/customer-categories/assign",
  storeTemplates: "/api/store-templates",
  templateCategories: "/categories",
  templateCategoryStores: "/stores",
  templateCategoryStoresOrder: "/order",
  templateStores: "/stores",
  templateStoresOrder: "/order",
  applyTemplate: "/apply-template",
  appliedTemplates: "/applied-templates",
  approval: "/approval",
  verifyPayment: "/verify-payment",
  resetPeriod: "/api/statistics/reset-period",
  storeResetPeriod: "/api/statistics/store/reset-period",
  employees: "/api/employees",
  deliveryWithdrawals: "/api/delivery/withdrawals",
  deliveryCashSettlements: "/api/delivery/cash-settlements",
  storeZonePricingToggle: "/zone-pricing/toggle",
  storeZonePrices: "/zone-prices",
  storeManagedByAdminToggle: "/managed-by-admin/toggle",
  storeDiscount: "/discount",
  storeDiscountRemove: "/discount/remove",
  onlineDelivery: "/api/orders",
  onlineDeliverySellerProfile: "/api/orders/online-delivery/seller-profile",
  bundles: "/api/bundles",
  deliveryPromotions: "/api/delivery-promotions",
  toggle: "/toggle",
  tableReservations: "/api/table-reservations",
  tableReservationsAdmin: "/admin",
  tableReservationsPendingCount: "/admin/pending-count",
  serviceSchedules: "/api/service-schedules",
  governorateShipping: "/api/governorate-shipping",
  govShippingAdmin: "/admin",
  govShippingOrders: "/orders",
  govShippingRoutes: "/routes",
  govShippingGovs: "/governorates",
  govShippingDrivers: "/drivers",
  govShippingAssignDriver: "/assign-driver",
  govShippingStatus: "/status",
  homeLayout: "/api/home/layout",
  homeAdminSections: "/api/home/admin/sections",
  homeAdminReorder: "/api/home/admin/sections/reorder",
  homeAdminUpload: "/api/home/admin/upload",
};
// addresses
// allPermissions
// banners
// branches
// categories
// complaint
// coupons
// customers
// favourite
// fund
// keyvalue
// languages
// modules
// notification
// orders
// roles
// schedule
// services
// settings
// socialMedia
// assignSpecialist: "/assign-specialist",
// specialists: "/api/specialists",

// sub-categories
// system-notifications
// users
// withdraw
// zones

export type endpointName = keyof typeof endpoints;

export type endpointType = (endpointName | number)[];

export const tags = {
  cart: "cart",
  "cart-items": "cart-items"
};

export type Tags = keyof typeof tags;
