import CustomHeader from "@/components/layouts/header/CustomHeader";
import { getTranslations } from "@/lib/i18n";
import GovernorateShippingClient from "./GovernorateShippingClient";

export default async function GovernorateShippingPage(): Promise<JSX.Element> {
  const t = await getTranslations();

  return (
    <>
      <CustomHeader />
      <div className="grid gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🚚</span>
            <span>{t("governorateShipping") || "شحن المحافظات"}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            متابعة وإدارة طلبات الشحن بين المحافظات وتعيين المناديب وضبط مصفوفة الأسعار
          </p>
        </div>
        <GovernorateShippingClient />
      </div>
    </>
  );
}
