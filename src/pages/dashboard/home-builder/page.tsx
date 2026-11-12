import CustomHeader from "@/components/layouts/header/CustomHeader";
import { useTranslations } from "@/lib/i18n";
import HomeBuilderClient from "./HomeBuilderClient";

export default function HomeBuilderPage(): JSX.Element {
  const t = useTranslations();

  return (
    <>
      <CustomHeader />
      <div className="grid gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("homeBuilder")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("homeBuilderDesc")}
          </p>
        </div>
        <HomeBuilderClient />
      </div>
    </>
  );
}
