import CustomHeader from "@/components/layouts/header/CustomHeader";
import { getTranslations } from "@/lib/i18n";
import { ShoppingCart } from "lucide-react";
import MartClient from "./MartClient";

export default async function MartPage(): Promise<JSX.Element> {
  const t = await getTranslations();

  return (
    <>
      <CustomHeader />
      <div className="grid grid-cols-1 gap-6 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-emerald-600" />
            <span>{t("mart") || "مكانك مارت (Makanak Mart)"}</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            إدارة هايبرماركت مكانك مارت للتوصيل السريع لكل مدينة، وضبط الأقسام الكبرى والفئات والمنتجات وعروض الفلاش سيل والبنرات
          </p>
        </div>
        <MartClient />
      </div>
    </>
  );
}
