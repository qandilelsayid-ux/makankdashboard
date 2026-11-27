import CustomHeader from "@/components/layouts/header/CustomHeader";
import { BookingItemsPage as Content } from "@/components/pages/_bookings/BookingPages";

export default function Page(): JSX.Element {
  return (
    <>
      <CustomHeader />
      <Content />
    </>
  );
}
