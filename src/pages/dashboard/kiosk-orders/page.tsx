import CustomHeader from "@/components/layouts/header/CustomHeader";
import CategoryFilter from "@/components/common/category/CategoryFilter";
import OrdersViewTabs from "@/components/pages/_orders/OrdersViewTabs";
import { getTranslations } from "@/lib/i18n";

export default async function page(): Promise<JSX.Element> {
  const t = await getTranslations();

  return (
    <>
      <CustomHeader />
      <CategoryFilter className="flex-1 flex-wrap" />
      <OrdersViewTabs
        tableTitle={t("kioskOrders") || "طلبات الكشك"}
        endPoint={["orders"]}
        defaultParams={{ onlyKiosk: true }}
        refetchInterval={30_000}
      />
    </>
  );
}
