
  import { z } from "zod";
import { StringReq } from "@/validations/String.schema";
import { PriceSchema } from "@/validations/Number.schema";
import { noSchema } from "@/validations/String.schema";
import { dateSchema } from "@/validations/Date.schema";

export const CouponsSchema = (t: TFunction) => {
  return z.object({
    titleAr: StringReq(t),
    titleEn: StringReq(t),
    code: StringReq(t),
    type: noSchema(),
    discountType: noSchema(),
    discountValue: PriceSchema(t, 0),
    maxUsage: PriceSchema(t, 0),
    startDate: dateSchema(t),
    endDate: dateSchema(t),
    minDiscountValue: PriceSchema(t, 0),
    minOrderAmount: PriceSchema(t, 0),
    maxDiscountValue: PriceSchema(t, 0),
    userIds: noSchema(),
    storeIds: noSchema(),
    zoneIds: noSchema(),
    isHidden: z.array(z.string()).optional(),
  });
};

  export type CouponsType = z.infer<
	ReturnType<typeof CouponsSchema>
  >;
  
  
