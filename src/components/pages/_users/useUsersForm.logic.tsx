"use client";

import { extractFormDefaultInputs } from "@/utils/extractFormDefaultInputs";
import { extractFormNameInputs } from "@/utils/extractFormNameInputs";
import { useFormAction } from "@/utils/FormActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { UsersInputs } from "./users.inputs";
import { UsersSchema, type UsersType } from "./users.schema";

export default function useUsersLogic({ data }: { data?: UsersType }) {
  const t = useTranslations();
  const formAction = useFormAction();
  // City admin: the new account always belongs to their city (the API forces
  // it), so the city picker is hidden for them.
  const { data: meUser } = useQuery({
    queryKey: ["meUser", "managedCity"],
    queryFn: async () => {
      const res = await apiClient.get("/api/users/me");
      return res?.data?.data?.user ?? res?.data?.data ?? null;
    },
    staleTime: 60_000,
  });
  const isCityAdmin = Number(meUser?.managedCityId) > 0;
  const inputs = UsersInputs({ isEdit: !!data, isCityAdmin });
  const {
    control,

    handleSubmit,
    reset
  } = useForm<UsersType>({
    mode: "onSubmit",
    resolver: zodResolver(UsersSchema(t, !!data)),
    defaultValues: extractFormDefaultInputs(inputs, data) as UsersType
  });

  const onSubmit = async (formData: UsersType) => {
    const extracted = extractFormNameInputs({ inputs, data: formData });
    const payload =
      typeof extracted === "object" && !(extracted instanceof FormData) && (extracted as any)?.roleId
        ? {
            ...extracted,
            roleId: Number((extracted as any).roleId),
            // Empty clears the city (back to every city).
            managedCityId: (formData as any).managedCityId ? Number((formData as any).managedCityId) : null
          }
        : extracted;

    await formAction({
      data,
      formData: payload,
      endpoint: ["users"],
      reset: reset,
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
