
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";

export const CitiesInputs = (t?: any) => {
  const tr = (key: string, fallback: string) => {
    if (!t) return fallback;
    const res = t(key);
    return res === key || !res ? fallback : res;
  };

  const inputs: FormInput[] = [
    { name: "name", type: "text", multiLang: true, cardId: 'lang', required: true },
    {
      name: "active",
      type: "checkbox",
      cardId: 'lang',
      width: 6,
      label: "",
      inputClassName: "button-checkbox",
      options: [{ label: tr("Active", "نشط"), value: "true" }]
    },
    {
      name: "customDeliveryActive",
      type: "checkbox",
      cardId: 'lang',
      width: 6,
      label: "",
      inputClassName: "button-checkbox",
      options: [{ label: tr("customDeliveryActive", "خدمة المندوب الخاص مفعلة"), value: "true" }]
    },
    {
      name: "radius",
      type: "number",
      cardId: 'lang',
      width: 3,
      required: false,
      label: tr("Radius", "نصف القطر (كم)")
    },
    {
      name: "toleranceRadius",
      type: "number",
      cardId: 'lang',
      width: 3,
      required: false,
      label: tr("Tolerance Radius", "نصف قطر هامش السماح (كم)")
    },
    {
      name: "coordinates",
      type: "map-zone",
      cardId: 'mapCard',
      width: 6,
      required: true,
      label: tr("Coordinates", "الحدود الجغرافية للمدينة")
    }
  ];
  return inputs;
};
