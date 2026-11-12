
  import { z } from "zod";
  
  
  import { StringReq } from "@/validations/String.schema";
  
  
  
  
  export const CitiesSchema = (t:TFunction) => {
    return z.object({
      nameAr:StringReq(t), nameEn:StringReq(t),
      active: z.array(z.string()).optional(),
      customDeliveryActive: z.array(z.string()).optional(),
      radius: z.preprocess((val) => val === "" || val === undefined ? undefined : Number(val), z.number().min(0).optional()),
      toleranceRadius: z.preprocess((val) => val === "" || val === undefined ? undefined : Number(val), z.number().min(0).optional()),
      coordinates: z.array(z.object({ lat: z.number(), lng: z.number() }), { required_error: t("Required") })
    })
  };

  export type CitiesType = z.infer<
	ReturnType<typeof CitiesSchema>
  >;
  
  