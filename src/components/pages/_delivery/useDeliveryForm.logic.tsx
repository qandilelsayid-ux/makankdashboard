"use client";

import { extractFormDefaultInputs } from "@/utils/extractFormDefaultInputs";
import { extractFormNameInputs } from "@/utils/extractFormNameInputs";
import { useFormAction } from "@/utils/FormActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { DeliveryInputs } from "./delivery.inputs";
import { DeliverySchema, type DeliveryType } from "./delivery.schema";

export default function useDeliveryLogic({ data }: { data?: DeliveryType }) {
  const t = useTranslations();
  const formAction = useFormAction();
  const isEdit = Boolean(data);
  const inputs = DeliveryInputs({ isEdit });
  const {
    control,

    handleSubmit,
    reset
  } = useForm<DeliveryType>({
    mode: "onSubmit",
    resolver: zodResolver(DeliverySchema(t)),
    defaultValues: extractFormDefaultInputs(inputs, data) as DeliveryType
  });

  const onSubmit = async (formData: DeliveryType) => {
    await formAction({
      data,
      formData: (() => {
        const extracted: any = extractFormNameInputs({ inputs, data: formData });
        if (isEdit || !extracted || extracted instanceof FormData) return extracted;
        const cityId = Number((formData as any).cityId);
        return { ...extracted, cityId: cityId > 0 ? cityId : undefined };
      })(),
      endpoint: isEdit ? ["delivery"] : ["deliveryRegister"],
      method: isEdit ? "PUT" : "POST",
      customReset: () => reset(extractFormDefaultInputs(inputs, undefined) as any),

      t
    });
  };

  const formSubmit = handleSubmit(onSubmit);

  return {
    control,
    inputs,
    formSubmit,
    t
  };
}
