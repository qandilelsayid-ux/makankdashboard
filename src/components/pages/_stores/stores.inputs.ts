
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";

export const StoresInputs = ({ isEdit, isAdmin, isSuperAdmin, t }: {
  isEdit: boolean;
  isAdmin?: boolean;
  // Store service fee is saved for the super admin only (the backend strips it
  // for everyone else), so the fields are shown to the super admin only.
  isSuperAdmin?: boolean;
  t?: (key: string) => string;
}) => {
  const inputs: FormInput[] = [
    { name: "name", type: "text", multiLang: true, cardId: 'lang', required: true, width: 6 },
    { name: "templateId", type: "selectPaginated", apiUrl: ['storeTemplates'], cardId: 'info', required: true, width: 3 },
    { name: "logo", type: "img", cardId: 'info', width: 3 },
    { name: "cover", type: "img", cardId: 'info', width: 3 },
    { name: "storeOrder", type: "number", cardId: 'info', width: 3, min: 0 },

    { name: "prepTimeMinutes", type: "number", cardId: 'operations', width: 3, min: 0 },
    { name: "deliveryTimeMinMinutes", type: "number", cardId: 'operations', width: 3, min: 0 },
    { name: "deliveryTimeMaxMinutes", type: "number", cardId: 'operations', width: 3, min: 0 },
    { name: "minOrderAmount", type: "number", cardId: 'operations', width: 3, min: 0 },
    {
      name: "hasTableReservation",
      type: "select" as const,
      cardId: 'operations',
      width: 3,
      options: [
        { label: t ? t("hasTableReservationDisabled") : "معطل", value: "false" },
        { label: t ? t("hasTableReservationEnabled") : "مفعل", value: "true" }
      ],
      label: t ? t("hasTableReservation") : "حجز الطاولات",
      toolTip: t ? t("hasTableReservationTooltip") : "إتاحة حجز طاولة وأكل مسبق للمطعم من تطبيق العملاء",
    },
    {
      name: "tableReservationFee",
      type: "number" as const,
      cardId: 'operations',
      width: 3,
      min: 0,
      label: t ? t("tableReservationFee") : "رسوم حجز الطاولة (ج.م)",
      placeholder: t ? t("tableReservationFeePlaceholder") : "0",
      toolTip: t ? t("tableReservationFeeTooltip") : "رسوم إضافية لحجز الطاولة تضاف لإجمالي الطلب (0 إذا كان مجاني)",
    },
    { name: "announcement", type: "textarea", cardId: 'operations', width: 12, placeholder: "اكتب هنا رسالة أو تنبيه يظهر للعملاء في تطبيق الموبايل (اختياري)" },

    {
      name: 'map',
      type: 'map' as const,
      width: 6,
      cardId: 'location',
      required: true,
    },
    { name: "address", type: "text" as const, cardId: 'location', required: true, width: 6 },
    { name: "UserName", type: "text" as const, cardId: 'user', required: true, width: 6 },
    { name: "userEmail", type: "email" as const, cardId: 'user', required: true, width: 6 },
    { name: "userPhone", type: "tel" as const, cardId: 'user', required: !isEdit, width: 3 },
    { name: "userPass", type: "password" as const, cardId: 'user', required: !isEdit, width: 3 }
  ];
  return inputs;
};
