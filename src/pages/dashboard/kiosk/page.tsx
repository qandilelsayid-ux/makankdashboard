import CustomHeader from "@/components/layouts/header/CustomHeader";
import { getTranslations } from "@/lib/i18n";
import KioskClient from "./KioskClient";

export default async function KioskPage(): Promise<JSX.Element> {
  const t = await getTranslations();

  return (
    <>
      <CustomHeader />
      <div className="grid gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🏪</span>
            <span>{t("kiosk") || "كشك مكانك (Makanak Kiosk)"}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة متجر الكشك الفوري لكل مدينة، وضبط الفئات الرئيسية والفرعية (Sub-categories) ومتابعة الطلبات
          </p>
        </div>
        <KioskClient />
      </div>
    </>
  );
}
