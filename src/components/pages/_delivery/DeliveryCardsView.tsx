import { APIDelete } from "@/api/global/apiDelete";
import ToggleStatus from "@/components/common/table/tableActions/ToggleStatus";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Link } from "@/lib/navigation";
import { IdCard, Mail, MapPin, PackageCheck, PackageX, Phone, Trash2, UserRound, View } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { usePathname, useRouter } from "@/lib/navigation";
import { getEnv } from "@/lib/env";
import { useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { fetchHelper } from "@/api/fetch";

type DeliveryCardItem = Record<string, any>;

const imgUrl = getEnv("VITE_API_URL");

function getDeliveryDetails(delivery: DeliveryCardItem) {
  return delivery.DeliveryDetails?.[0] ?? {};
}

function getActiveOrdersCount(delivery: DeliveryCardItem) {
  const possibleCount =
    delivery.activeOrdersCount ??
    delivery.currentOrdersCount ??
    delivery.ordersCount ??
    delivery.activeOrderCount ??
    delivery.currentOrderCount ??
    delivery.assignedOrdersCount;

  if (typeof possibleCount === "number") return possibleCount;
  if (typeof possibleCount === "string") return Number(possibleCount) || 0;

  const possibleOrders =
    delivery.activeOrders ??
    delivery.currentOrders ??
    delivery.assignedOrders ??
    delivery.Orders ??
    delivery.orders;

  return Array.isArray(possibleOrders) ? possibleOrders.length : 0;
}

function DeleteDeliveryButton({ id }: { id: string }) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const res = await APIDelete(["delivery"], pathname, id);

    if (res.success) {
      toast.success(t("Deleted"), {
        description: t("Item has been deleted successfully")
      });
      router.refresh();
      setOpen(false);
    } else {
      toast.error(t("Error"), {
        description: t(`${res.message}`)
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          {t("Delete")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("Confirm Delete")}</DialogTitle>
          <DialogDescription>
            {t("Are you sure you want to delete this item? This action cannot be undone")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            {t("Cancel")}
          </Button>
          <Button type="button" variant="destructive" disabled={loading} onClick={handleDelete}>
            {loading ? t("Deleting") : t("Delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function DeliveryCardsView({ deliveries }: { deliveries: DeliveryCardItem[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const cityLabel = (c: any): string =>
    !c ? "" : typeof c.name === "string" ? c.name : c.name?.[locale] ?? c.name?.ar ?? c.name?.en ?? "";

  const { data: profileQuery } = useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchHelper({ endPoint: ["profile"] }),
    staleTime: 60_000,
    retry: false
  });
  const roleVal =
    profileQuery?.data?.data?.user?.Role?.name ||
    profileQuery?.data?.data?.user?.Role?.roleKey ||
    profileQuery?.data?.data?.user?.roleKey ||
    profileQuery?.data?.data?.user?.roleId ||
    profileQuery?.data?.user?.Role?.name ||
    profileQuery?.data?.user?.Role?.roleKey ||
    profileQuery?.data?.user?.roleKey ||
    profileQuery?.data?.user?.roleId;
  const getRoleString = (val: any): string => {
    if (!val) return "";
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      return val.en || val.ar || "";
    }
    return String(val);
  };
  const currentRole = getRoleString(roleVal).toLowerCase();
  const isAdmin = currentRole === "admin";

  if (!deliveries?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center text-muted-foreground">
          {t("No Data Available")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {deliveries.map(delivery => {
        const details = getDeliveryDetails(delivery);
        const forceAvailable = Boolean(delivery.isAvailable);
        const isOnShift = Boolean(delivery.isOnShift ?? details.availableNow);
        const isActiveStatus = Boolean(delivery.isActive ?? delivery.active ?? details.active ?? true);
        const activeOrdersCount = getActiveOrdersCount(delivery);
        const hasActiveOrders = activeOrdersCount > 0;
        const avatar = delivery.avatar ?? delivery.image;

        return (
          <Card
            key={delivery.id}
            className="flex flex-col h-full overflow-hidden border-gray-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-slate-950"
          >
            <CardContent className="flex flex-col flex-1 gap-5 p-5">
              <div className="flex flex-col items-center gap-4 text-center">
                <Avatar className="h-20 w-20 border border-border shadow-sm">
                  {avatar ? (
                    <AvatarImage src={`${imgUrl}${avatar}`} alt={delivery.name} />
                  ) : null}
                  <AvatarFallback>
                    <UserRound className="h-8 w-8 text-muted-foreground" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1 flex flex-col items-center gap-2 w-full">
                  <h3 className="truncate text-xl font-bold text-foreground" dir="auto">
                    {delivery.name || t("Unknown")}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <Badge variant={delivery.isVerified ?? delivery.verified ? "success" : "muted"} className="rounded-full">
                      {delivery.isVerified ?? delivery.verified ? t("Verified") : t("Not Verified")}
                    </Badge>
                    <Badge variant={isOnShift ? "success" : "muted"} className="rounded-full">
                      {isOnShift ? t("Working Today") : t("Not Working")}
                    </Badge>
                  </div>

                  <div className="mt-1 grid gap-1.5 text-sm text-muted-foreground w-full">
                    <span className="flex items-center justify-center gap-2">
                      <IdCard className="h-4 w-4 shrink-0" />
                      <span className="truncate" dir="auto">{delivery.id || "-"}</span>
                    </span>
                    <span className="flex items-center justify-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate" dir="auto">{delivery.email || "-"}</span>
                    </span>
                    <span className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span dir="ltr">{delivery.phone || "-"}</span>
                    </span>
                    <span className="flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span className="truncate" dir="auto">
                        {cityLabel(delivery.City) || (locale === "ar" ? "بدون مدينة" : "No city")}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-5">
                <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{t("Account Status")}</p>
                      <p className="text-xs text-muted-foreground">{t("Active Status")}</p>
                    </div>
                    <ToggleStatus
                      id={delivery.id as string | number}
                      body={{ active: !isActiveStatus }}
                      isActive={isActiveStatus}
                      endpoint={["delivery"]}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{t("Forced Availability")}</p>
                      <p className="text-xs text-muted-foreground">{t("Always Available")}</p>
                    </div>
                    <ToggleStatus
                      id={delivery.id as string | number}
                      body={{ forceAvailable: !forceAvailable }}
                      isActive={forceAvailable}
                      endpoint={["delivery"]}
                    />
                  </div>

                  {isAdmin && (
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold">{t("Verified Status")}</p>
                        <p className="text-xs text-muted-foreground">
                          {(delivery.isVerified ?? delivery.verified) ? t("Verified") : t("Unverified")}
                        </p>
                      </div>
                      <ToggleStatus
                        id={delivery.id as string | number}
                        body={{ verified: !(delivery.isVerified ?? delivery.verified) }}
                        isActive={Boolean(delivery.isVerified ?? delivery.verified)}
                        endpoint={["delivery"]}
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{t("Has Active Orders")}</p>
                      <p className="text-xs text-muted-foreground">
                        {hasActiveOrders
                          ? `${activeOrdersCount} ${t("Orders")}`
                          : t("No active orders")}
                      </p>
                    </div>
                    <Badge
                      variant={hasActiveOrders ? "default" : "secondary"}
                      className={
                        hasActiveOrders
                          ? "gap-2 rounded-full bg-orange-500/15 text-orange-400 hover:bg-orange-500/20"
                          : "gap-2 rounded-full"
                      }
                    >
                      {hasActiveOrders ? (
                        <PackageCheck className="h-4 w-4" />
                      ) : (
                        <PackageX className="h-4 w-4" />
                      )}
                      {hasActiveOrders ? t("With orders") : t("No orders")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button asChild className="w-full">
                    <Link href={`/delivery/${delivery.id}`}>
                      <View className="h-4 w-4 mr-2" />
                      {t("Details")}
                    </Link>
                  </Button>
                  <DeleteDeliveryButton id={String(delivery.id)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
