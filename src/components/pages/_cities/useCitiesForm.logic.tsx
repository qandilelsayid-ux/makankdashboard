"use client";

import useFormErrorLang from "@/components/common/Form/hooks/useFormErrorLang";
import { extractFormDefaultInputs } from "@/utils/extractFormDefaultInputs";
import { extractFormNameInputs } from "@/utils/extractFormNameInputs";
import { useFormAction } from "@/utils/FormActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CitiesInputs } from "./cities.inputs";
import { CitiesSchema, type CitiesType } from "./cities.schema";

export default function useCitiesLogic({ data }: { data?: CitiesType }) {
  const t = useTranslations();
  const formAction = useFormAction();
  const inputs = CitiesInputs(t);
  
  const defaultValues = extractFormDefaultInputs(inputs, data) as any;
  if (data) {
    defaultValues.active = (data as any).active !== false ? ["true"] : [];
    defaultValues.customDeliveryActive = (data as any).customDeliveryActive !== false ? ["true"] : [];
    defaultValues.coordinates = (data as any).coordinates ?? [];
    defaultValues.radius = (data as any).radius ?? "";
    defaultValues.toleranceRadius = (data as any).toleranceRadius ?? "";
  } else {
    defaultValues.active = ["true"];
    defaultValues.customDeliveryActive = ["true"];
    defaultValues.coordinates = [];
  }

  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<CitiesType>({
    mode: "onSubmit",
    resolver: zodResolver(CitiesSchema(t)),
    defaultValues
  });

  const onSubmit = async (formData: CitiesType) => {
    if (!formData.coordinates || formData.coordinates.length <= 2) {
      toast.error(t("Please draw the city boundary on the map"));
      return;
    }

    const payload = extractFormNameInputs({ inputs, data: formData }) as any;
    payload.active = Array.isArray(formData.active) && formData.active.includes("true");
    payload.customDeliveryActive = Array.isArray((formData as any).customDeliveryActive) && (formData as any).customDeliveryActive.includes("true");
    
    // Automatically calculate centroid lat/lng from coordinates as center fallback
    if (formData.coordinates && formData.coordinates.length > 0) {
      const sumLat = formData.coordinates.reduce((sum, pt) => sum + pt.lat, 0);
      const sumLng = formData.coordinates.reduce((sum, pt) => sum + pt.lng, 0);
      payload.lat = sumLat / formData.coordinates.length;
      payload.lng = sumLng / formData.coordinates.length;
    }

    if (formData.radius !== undefined && formData.radius !== null && (formData.radius as any) !== "") {
      payload.radius = Number(formData.radius);
    } else {
      delete payload.radius;
    }
    if (formData.toleranceRadius !== undefined && formData.toleranceRadius !== null && (formData.toleranceRadius as any) !== "") {
      payload.toleranceRadius = Number(formData.toleranceRadius);
    } else {
      delete payload.toleranceRadius;
    }

    await formAction({
      data,
      formData: payload,
      endpoint: ["cities"],
      t
    });
  };

  const formSubmit = handleSubmit(onSubmit);
  const { lang } = useFormErrorLang({
    errors,
    name: ["name"]
  });
  return {
    lang,
    control,
    inputs,
    formSubmit,
    t
  };
}
