
import useFormErrorLang from "@/components/common/Form/hooks/useFormErrorLang";
import { extractFormDefaultInputs } from "@/utils/extractFormDefaultInputs";
import { extractFormNameInputs } from "@/utils/extractFormNameInputs";
import { useFormAction } from "@/utils/FormActions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { useForm, useWatch } from "react-hook-form";
import { CouponsInputs } from "./coupons.inputs";
import { CouponsSchema, type CouponsType } from "./coupons.schema";
;

export default function useCouponsLogic({ data }: { data?: CouponsType }) {
	const t = useTranslations();
  const formAction = useFormAction();
	const defaultInputs = CouponsInputs(data?.type as any);
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
	} = useForm<CouponsType>({
		mode: "onSubmit",
		resolver: zodResolver(CouponsSchema(t)),
		defaultValues: {
			...(extractFormDefaultInputs(defaultInputs, { ...data }) as CouponsType),
			isHidden: (data as any)?.isHidden ? ["true"] : [],
		} as CouponsType,
	});

	const couponType = useWatch({ control, name: "type" });
	const inputs = CouponsInputs(couponType as any);

	const onSubmit = async (formData: CouponsType) => {
		const parseToIso = (val: any) => {
			if (!val) return undefined;
			const d = new Date(val);
			return isNaN(d.getTime()) ? undefined : d.toISOString();
		};

		const normalizedData = {
			usageCount: 0,
			...formData,
			startDate: parseToIso(formData.startDate),
			endDate: parseToIso(formData.endDate),
			type: formData.type,
			userIds: formData.type === "USER_WISE" ? formData.userIds : undefined,
			storeIds: formData.type === "STORE_WISE" ? formData.storeIds : undefined,
			zoneIds: formData.zoneIds,
		};
		// Checkbox -> boolean; always sent so un-ticking really un-hides it.
		const isHidden = Array.isArray(formData.isHidden) && formData.isHidden.includes("true");

		Object.keys(normalizedData).forEach(key => {
			const value = normalizedData[key as keyof typeof normalizedData];
			if (value === undefined || value === null || value === "") {
				delete normalizedData[key as keyof typeof normalizedData];
			}
			if (Array.isArray(value) && value.length === 0 && (key !== "zoneIds" || !(data as any)?.id)) {
				delete normalizedData[key as keyof typeof normalizedData];
			}
		});

		await formAction({
			data,
			formData: { ...extractFormNameInputs({ inputs, data: normalizedData }), isHidden },
			endpoint: ['coupons'],
			customReset: () => reset(extractFormDefaultInputs(inputs, undefined) as any),
			t,
		});
	};

	const formSubmit = handleSubmit(onSubmit);
	const { lang } = useFormErrorLang({
		errors,
		name: ['name']
	})
	return {
		lang,
		control,
		inputs,
		formSubmit,
		t
	};
}
