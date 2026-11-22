
  import { SelectReq } from "@/validations/Select.schema";
import { EmailReq, StringReq } from "@/validations/String.schema";
import { z } from "zod";
  
  
  
  import { noSchema } from "@/validations/String.schema";
  export const UsersSchema = (t:TFunction, isEdit: boolean) => {
    return z.object({
    name:StringReq(t),
email:EmailReq(t),
phone: StringReq(t).refine((val) => /^\+200?1[0125]\d{8}$/.test(val), {
  message: t("enterValidEgyptianPhone")
}),
password:isEdit ? noSchema() : StringReq(t,6),
roleId:SelectReq(t),
managedCityId: z.union([z.number(), z.string()]).optional().nullable()
})
  };

  export type UsersType = z.infer<
	ReturnType<typeof UsersSchema>
  >;
  
  