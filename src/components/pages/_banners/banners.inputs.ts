
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";

export const BannersInputs = ({
  selectedStore,
  selectedCategory,
  selectedTargetType,
  isSpecialDelivery,
  onStoreChange,
  onCategoryChange,
  t
}: {
  selectedStore?: string | number | null;
  selectedCategory?: string | number | null;
  selectedTargetType?: string | null;
  isSpecialDelivery?: boolean;
  onStoreChange?: () => void;
  onCategoryChange?: () => void;
  t?: any;
} = {}) => {
  const tr = (key: string, fallback: string) => {
    if (!t) return fallback;
    const res = t(key);
    return res === key || !res ? fallback : res;
  };
  const targetType = isSpecialDelivery ? "SPECIAL_DRIVER" : selectedTargetType || "GENERAL";
  const needsStore = ["STORE", "CATEGORY", "SERVICE", "ZONE"].includes(targetType);
  const needsCategory = ["CATEGORY", "SERVICE"].includes(targetType);
  const needsService = targetType === "SERVICE";
  const needsZones = targetType === "ZONE";

  const inputs: FormInput[] = [
    { name: "name", type: "text", multiLang: true, cardId: 'lang', required: true },
    {
      name: "targetType",
      type: "select",
      cardId: "targeting",
      width: 3,
      defaultValue: "GENERAL",
      disabled: isSpecialDelivery,
      options: [
        { label: tr("GENERAL", "عام"), value: "GENERAL" },
        { label: tr("CUSTOMER_CATEGORY", "فئة عملاء"), value: "CUSTOMER_CATEGORY" },
        { label: tr("STORE", "محل"), value: "STORE" },
        { label: tr("CATEGORY", "فئة"), value: "CATEGORY" },
        { label: tr("SERVICE", "منتج"), value: "SERVICE" },
        { label: tr("ZONE", "منطقة"), value: "ZONE" },
        { label: tr("EXTERNAL_URL", "رابط خارجي"), value: "EXTERNAL_URL" }
      ]
    },
    {
      name: "clickUrl",
      type: "text",
      cardId: "targeting",
      width: 3,
      disabled: isSpecialDelivery || targetType !== "EXTERNAL_URL"
    },
    {
      name: "customerCategoryId",
      type: "selectPaginated",
      apiUrl: ['customerCategories'],
      cardId: 'targeting',
      width: 3,
      disabled: isSpecialDelivery || targetType !== "CUSTOMER_CATEGORY",
    },
    {
      name: "cityId",
      type: "selectPaginated",
      apiUrl: ["cities"],
      cardId: "targeting",
      width: 3,
      label: tr("City", "المدينة")
    },
    {
      name: "storeId",
      type: "selectPaginated",
      apiUrl: ['stores'],
      cardId: 'targeting',
      width: 3,
      disabled: isSpecialDelivery || !needsStore,
      onChange: onStoreChange
    },
    {
      name: "categoryId",
      type: "selectPaginated",
      apiUrl: ["storeCategories"],
      searchFilters: selectedStore ? [{ key: "storeId", value: Number(selectedStore) }] : [],
      cardId: 'targeting',
      width: 3,
      disabled: isSpecialDelivery || !needsCategory || !selectedStore,
      onChange: onCategoryChange
    },
    {
      name: "serviceId",
      type: "selectPaginated",
      apiUrl: ['services'],
      cardId: 'targeting',
      width: 3,
      disabled: isSpecialDelivery || !needsService || !selectedStore || !selectedCategory,
      searchFilters: selectedCategory ? [{ key: "categoryId", value: selectedCategory }] : []
    },
    {
      name: "zoneIds",
      type: "selectPaginated",
      apiUrl: selectedStore ? ["banners", "store", Number(selectedStore), "bannerStoreZones"] : [],
      cardId: 'targeting',
      width: 3,
      isMulti: true,
      disabled: isSpecialDelivery || !needsZones || !selectedStore
    },
    {
      name: "specialDelivery",
      type: "checkbox",
      cardId: 'targeting',
      width: 3,
      label: "",
      inputClassName: "button-checkbox",
      options: [{ label: tr("Special Delivery", "مندوب خاص"), value: "true" }]
    },
    { name: "image", type: "img", required: true, cardId: 'media', width: 3 },
    { name: "order", type: "number", cardId: 'media', width: 3 },
    { name: "startDate", type: "time", cardId: 'media', width: 3 },
    { name: "endDate", type: "time", cardId: 'media', width: 3 }
  ];
  return inputs;
};
