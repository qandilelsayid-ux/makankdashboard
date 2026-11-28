
import type { FormInput } from "@/components/common/Form/CustomFormTypes.types";

export const DeliveryInputs = ({isEdit}:{
  isEdit:boolean
}) => {
  const inputs: FormInput[] = [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "phone", type: "tel", required: true },
    { name: "password", type: "password", required: true,isHidden: isEdit },
    // Driver city: a city admin only sees / assigns its own city's drivers.
    { name: "cityId", type: "selectPaginated", apiUrl: ["cities"], required: false, isHidden: isEdit, toolTip: "driverCityIdTooltip" },
  ];
  return inputs;
};
