
  import { z } from "zod";
  
  
  import { StringReq } from "@/validations/String.schema";
  import {StringNotReq } from "@/validations/String.schema";
  
  
  import { noSchema } from "@/validations/String.schema"
  export const DeliverySchema = (t:TFunction) => {
    return z.object({
    name:StringReq(t),
email:StringNotReq(),
phone:noSchema(),
password:noSchema(),
cityId: z.union([z.number(), z.string()]).optional().nullable()
})
  };

  export type DeliveryType = z.infer<
	ReturnType<typeof DeliverySchema>
  >;
  
  