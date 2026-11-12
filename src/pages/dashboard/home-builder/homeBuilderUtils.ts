import { getEnv } from "@/lib/env";

export type HomeSectionType =
  | "CATEGORIES"
  | "MAIN_BANNERS"
  | "STORES"
  | "PRODUCTS"
  | "BANNER"
  | "TABLE_RESERVATION"
  | "FORTUNE_WHEEL"
  | "COUPONS";

export type HomeBannerActionType =
  | "NONE"
  | "STORE"
  | "CATEGORY"
  | "PRODUCT"
  | "URL";

export interface LocalizedText {
  ar?: string;
  en?: string;
}

export interface HomeSectionBannerItem {
  id?: number;
  image: string;
  actionType: HomeBannerActionType;
  targetStoreId?: number | null;
  targetCategoryId?: number | null;
  targetServiceId?: number | null;
  externalUrl?: string | null;
  sortOrder?: number;
}

export interface AdminHomeSection {
  id: number;
  key: string;
  type: HomeSectionType;
  title: LocalizedText;
  subtitle?: LocalizedText | null;
  cityId?: number | null;
  City?: { id: number; name?: LocalizedText } | null;
  sortOrder: number;
  isActive: boolean;
  isBuiltIn: boolean;
  headerBannerImage?: string | null;
  Stores?: Array<{
    id: number;
    storeId: number;
    sortOrder: number;
    Store?: {
      id: number;
      name?: LocalizedText;
      logo?: string | null;
      cityId?: number | null;
    } | null;
  }>;
  Products?: Array<{
    id: number;
    serviceId: number;
    sortOrder: number;
    Service?: {
      id: number;
      name?: LocalizedText;
      image?: string | null;
      price?: number;
      priceAfterDiscount?: number | null;
      Store?: { id: number; name?: LocalizedText; cityId?: number | null } | null;
    } | null;
  }>;
  Banners?: HomeSectionBannerItem[];
}

export function getLocalizedText(val: unknown, locale = "ar"): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    const obj = val as Record<string, string | undefined>;
    return obj[locale] || obj.ar || obj.en || "";
  }
  return String(val);
}

export function resolveDashboardImageUrl(path?: string | null): string {
  if (!path) return "";
  const trimmed = String(path).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const imgBase = getEnv("VITE_API_IMG_URL") || "";
  return `${imgBase}${trimmed}`;
}

export function moveArrayItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const nextIdx = index + delta;
  if (nextIdx < 0 || nextIdx >= list.length) return list;
  const copy = [...list];
  const [moved] = copy.splice(index, 1);
  copy.splice(nextIdx, 0, moved);
  return copy;
}

export const SECTION_TYPE_META: Record<
  HomeSectionType,
  { ar: string; en: string; colorClass: string }
> = {
  CATEGORIES: {
    ar: "الفئات",
    en: "Categories",
    colorClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  },
  MAIN_BANNERS: {
    ar: "البانرات الرئيسية",
    en: "Main Banners",
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
  STORES: {
    ar: "قسم مطاعم مختارة",
    en: "Curated Stores",
    colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  PRODUCTS: {
    ar: "قسم منتجات ووجبات",
    en: "Curated Products",
    colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  BANNER: {
    ar: "صورة / بانر إعلاني",
    en: "Showcase Banner",
    colorClass: "bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300",
  },
  TABLE_RESERVATION: {
    ar: "حجز طاولة (مشروط)",
    en: "Table Reservation",
    colorClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300",
  },
  FORTUNE_WHEEL: {
    ar: "عجلة الحظ (مشروط)",
    en: "Fortune Wheel",
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  },
  COUPONS: {
    ar: "الكوبونات والنقاط (مشروط)",
    en: "Coupons & Loyalty",
    colorClass: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
  },
};
