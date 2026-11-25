import CustomHeader from "@/components/layouts/header/CustomHeader";
import { getTranslations } from "@/lib/i18n";
import TableReservationsClient from "./TableReservationsClient";

export default async function TableReservationsPage(): Promise<JSX.Element> {
  const t = await getTranslations();

  return (
    <>
      <CustomHeader />
      <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🍽️</span>
            <span>{t("tableReservations") || "حجوزات الطاولات والأكل المسبق"}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("tableReservationsIntro") || "متابعة وإدارة حجوزات الطاولات وطلبات الأكل المسبقة للعملاء بالمطاعم"}
          </p>
        </div>
        <TableReservationsClient />
      </div>
    </>
  );
}
