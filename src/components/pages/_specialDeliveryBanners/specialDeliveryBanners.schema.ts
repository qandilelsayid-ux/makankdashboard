import { z } from "zod";
import { StringReq } from "@/validations/String.schema";
import { selectNotReq } from "@/validations/Select.schema";
import { noSchema } from "@/validations/String.schema";

export const SpecialDeliveryBannersSchema = (t: TFunction) => {
  return z.object({
    nameAr: StringReq(t),
    nameEn: StringReq(t),
    cityId: selectNotReq(),
    storeId: selectNotReq(),
    customerCategoryId: selectNotReq(),
    targetType: noSchema(),
    categoryId: selectNotReq(),
    serviceId: selectNotReq(),
    zoneIds: noSchema(),
    specialDelivery: noSchema(),
    clickUrl: noSchema(),
    startDate: noSchema(),
    endDate: noSchema(),
    order: noSchema(),
    image: noSchema()
  }).superRefine((data, ctx) => {
    const isSpecialDelivery = Array.isArray(data.specialDelivery)
      ? data.specialDelivery.includes("true")
      : Boolean(data.specialDelivery);
    const targetType = isSpecialDelivery ? "SPECIAL_DRIVER" : data.targetType;

    if (targetType === "EXTERNAL_URL") {
      if (!data.clickUrl) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("Required"), path: ["clickUrl"] });
      } else if (!data.clickUrl.startsWith("http://") && !data.clickUrl.startsWith("https://")) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("clickUrl must be http or https"), path: ["clickUrl"] });
      }
    }

    if (["STORE", "CATEGORY", "SERVICE", "ZONE"].includes(targetType as string)) {
      if (!data.storeId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("Required"), path: ["storeId"] });
      }
    }
    if (["CATEGORY", "SERVICE"].includes(targetType as string)) {
      if (!data.categoryId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("Required"), path: ["categoryId"] });
      }
    }
    if (targetType === "SERVICE") {
      if (!data.serviceId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("Required"), path: ["serviceId"] });
      }
    }
    if (targetType === "ZONE") {
      if (!data.zoneIds || (Array.isArray(data.zoneIds) && data.zoneIds.length === 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: t("Required"), path: ["zoneIds"] });
      }
    }
  });
};

export type SpecialDeliveryBannersType = z.infer<
  ReturnType<typeof SpecialDeliveryBannersSchema>
>;
