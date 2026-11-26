import { CheckCircle2, Clock, Package, Truck, User, XCircle } from "lucide-react";

export type ShippingOrderStatus =
  | "PENDING"
  | "ASSIGNED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "CANCELLED";

export type ShippingType = "GOVERNORATE" | "VILLAGE";
export type PaymentType = "CASH_ON_PICKUP" | "CASH_ON_DELIVERY";

export interface CityRef {
  id: number;
  name: string | { ar?: string; en?: string };
}

export interface ShippingCenter {
  id: number;
  governorateId: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  Governorate?: { id: number; nameAr: string; nameEn: string };
}

export interface ShippingGovernorate {
  id: number;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  isPickupOrigin?: boolean;
  Centers?: ShippingCenter[];
  centers?: ShippingCenter[];
}

export interface ShippingVillage {
  id: number;
  cityId?: number | null;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  isPickupOrigin?: boolean;
  City?: CityRef | null;
}

export interface ShippingOption {
  id: number;
  cityId?: number | null;
  shippingType: ShippingType;
  nameAr: string;
  nameEn: string;
  cargoDescriptionAr?: string | null;
  cargoDescriptionEn?: string | null;
  minWeightKg: number;
  maxWeightKg?: number | null;
  weightLabel?: string | null;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
  City?: CityRef | null;
}

export interface ShippingRoute {
  id: number;
  cityId?: number | null;
  shippingType: ShippingType;
  fromGovernorate: string;
  toGovernorate: string;
  fromCenter?: string | null;
  toCenter?: string | null;
  price: number;
  estimatedDelivery?: string | null;
  cargoDescription?: string | null;
  maxWeightKg?: number | null;
  extraPricePerKg?: number | null;
  isActive: boolean;
  City?: CityRef | null;
}

export interface ShippingOrder {
  id: number;
  orderNumber: string;
  customerId: number;
  cityId?: number | null;
  shippingType: ShippingType;
  senderName: string;
  senderPhone: string;
  pickupGovernorate: string;
  pickupCenter?: string | null;
  pickupAddress: string;
  pickupLat?: number | null;
  pickupLng?: number | null;
  receiverName: string;
  receiverPhone: string;
  deliveryGovernorate: string;
  deliveryCenter?: string | null;
  deliveryAddress: string;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  packageDescription: string;
  packageCategory?: string | null;
  packageSize?: string | null;
  packageWeightKg?: number | null;
  shippingOptionId?: number | null;
  shippingOptionName?: string | null;
  cargoType?: string | null;
  images?: string[];
  notes?: string | null;
  routePrice?: number;
  optionExtraPrice?: number;
  deliveryPrice: number;
  paymentType: PaymentType;
  status: ShippingOrderStatus;
  deliveryBoyId?: number | null;
  createdAt: string;
  Customer?: { id: number; name: string; phone: string };
  DeliveryBoy?: { id: number; name: string; phone: string; image?: string };
  City?: CityRef | null;
  ShippingOption?: ShippingOption | null;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  image?: string;
}

export const statusMap: Record<
  ShippingOrderStatus,
  { label: string; color: string; icon: typeof Clock }
> = {
  PENDING: {
    label: "قيد الانتظار",
    color: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    icon: Clock,
  },
  ASSIGNED: {
    label: "تم تعيين مندوب",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    icon: User,
  },
  PICKED_UP: {
    label: "تم الاستلام",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    icon: Package,
  },
  IN_TRANSIT: {
    label: "جاري التوصيل",
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "تم التسليم",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "ملغي",
    color: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    icon: XCircle,
  },
};

export function formatCityLabel(city?: CityRef | null): string {
  if (!city) return "عام (كل المدن)";
  if (typeof city.name === "string") return city.name;
  return city.name?.ar || city.name?.en || `#${city.id}`;
}

export function shippingTypeLabel(type?: ShippingType): string {
  return type === "VILLAGE" ? "شحن قرى" : "شحن محافظات";
}

export function formatOptionWeight(opt: Pick<ShippingOption, "minWeightKg" | "maxWeightKg" | "weightLabel">): string {
  if (opt.weightLabel?.trim()) return opt.weightLabel;
  if (opt.maxWeightKg != null && opt.maxWeightKg > 0) {
    return opt.minWeightKg > 0
      ? `${opt.minWeightKg} - ${opt.maxWeightKg} كجم`
      : `حتى ${opt.maxWeightKg} كجم`;
  }
  return opt.minWeightKg > 0 ? `من ${opt.minWeightKg} كجم` : "وزن مفتوح";
}
