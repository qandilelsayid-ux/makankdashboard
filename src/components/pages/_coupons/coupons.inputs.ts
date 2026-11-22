
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";
import { CouponDiscountTypeOptions, CouponTypesOPtions } from "@/utils/options/typesOptions";
import { useTranslations } from "@/lib/i18n";

type CouponType =
  | "ALL_USERS"
  | "ALL_STORES"
  | "FIRST_ORDER"
  | "USER_WISE"
  | "STORE_WISE";

export const CouponsInputs = (couponType?: CouponType | null) => {
  const t = useTranslations();
  const showUserRestrictions = couponType === "USER_WISE";
  const showStoreRestrictions = couponType === "STORE_WISE";

  const inputs: FormInput[] = [
    { name: "title", type: "text", multiLang: true, cardId: 'lang', required: true },
    { name: "code", type: "text", cardId: 'basic', required: true },
    {
      // Hidden coupon: not shown in the app and no notification; it works only
      // for people who get the code (campaign, street promo…).
      name: "isHidden",
      type: "checkbox",
      cardId: 'basic',
      label: "",
      inputClassName: "button-checkbox",
      toolTip: t("hiddenCouponTooltip"),
      options: [{ label: t("hiddenCoupon"), value: "true" }],
    },
    { name: "type", type: "radioGroup", width: 6, cardId: 'discount', required: true, options: CouponTypesOPtions(t) },
    { name: "discountType", type: "radioGroup", cardId: 'discount', required: true, options: CouponDiscountTypeOptions(t) },
    { name: "discountValue", type: "number", cardId: 'discount', required: true },
    { name: "minDiscountValue", type: "number", cardId: 'discount', required: true },
    { name: "maxDiscountValue", type: "number", cardId: 'discount', required: true },
    { name: "maxUsage", type: "number", cardId: 'usage', required: true, toolTip: t("maxUsageTooltip") },
    { name: "minOrderAmount", type: "number", cardId: 'usage', required: true, toolTip: t("minOrderAmountTooltip") },
    { name: "startDate", type: "date", cardId: 'dates', required: true },
    { name: "endDate", type: "date", cardId: 'dates', required: true },
    { name: "userIds", isHidden: !showUserRestrictions, type: "selectPaginated", cardId: 'restrictions', apiUrl: ['customers'], isMulti: true, searchTermKey: "name" },
    { name: "storeIds", isHidden: !showStoreRestrictions, type: "selectPaginated", cardId: 'restrictions', apiUrl: ['stores'], isMulti: true },
    {
      name: "zoneIds",
      type: "selectPaginated",
      cardId: 'restrictions',
      apiUrl: ['zones'],
      isMulti: true,
      toolTip: t("couponZonesTooltip"),
    },
  ];
  return inputs;
};
