import { useEffect, useState } from "react";
import { fetchHelper } from "@/api/fetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  Copy,
  Moon,
  Package,
  Pill,
  Power,
  RefreshCw,
  Save,
  Sun,
} from "lucide-react";
import { toast } from "sonner";

interface DaySchedule {
  day: string;
  openingTime: string;
  closingTime: string;
  isOpen: boolean;
}

const WEEK_DAYS_DATA = [
  { key: "SUNDAY", nameAr: "الأحد", nameEn: "Sunday" },
  { key: "MONDAY", nameAr: "الإثنين", nameEn: "Monday" },
  { key: "TUESDAY", nameAr: "الثلاثاء", nameEn: "Tuesday" },
  { key: "WEDNESDAY", nameAr: "الأربعاء", nameEn: "Wednesday" },
  { key: "THURSDAY", nameAr: "الخميس", nameEn: "Thursday" },
  { key: "FRIDAY", nameAr: "الجمعة", nameEn: "Friday" },
  { key: "SATURDAY", nameAr: "السبت", nameEn: "Saturday" },
];

function isOvernightShift(open: string, close: string): boolean {
  if (!open || !close) return false;
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const openMinutes = oh * 60 + om;
  const closeMinutes = ch * 60 + cm;
  return closeMinutes < openMinutes;
}

interface ServiceTabProps {
  serviceType: "CUSTOM_DELIVERY" | "PHARMACY";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

function ServiceTabContent({ serviceType, title, subtitle, icon }: ServiceTabProps) {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [schedules, setSchedules] = useState<DaySchedule[]>([]);
  const [liveStatus, setLiveStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // "" = general schedule (all cities without their own hours).
  const [cityId, setCityId] = useState<string>("");
  const [cities, setCities] = useState<{ id: number; name: any }[]>([]);
  const [hasOwnSchedule, setHasOwnSchedule] = useState(false);

  useEffect(() => {
    fetchHelper({ endPoint: ["cities"], params: { limit: 200 }, redirectOnUnauthorized: false }).then((r: any) =>
      setCities(Array.isArray(r?.data) ? r.data : []),
    );
  }, []);
  const cityName = (n: any) => (typeof n === "string" ? n : n?.ar ?? n?.en ?? "");

  const loadData = async () => {
    setLoading(true);
    try {
      const [scheduleRes, availRes] = await Promise.all([
        fetchHelper({
          endPoint: ["serviceSchedules", serviceType],
          method: "GET",
          params: cityId ? { cityId } : undefined,
          redirectOnUnauthorized: false,
        }),
        fetchHelper({
          endPoint: ["serviceSchedules", "availability"],
          method: "GET",
          params: cityId ? { cityId } : undefined,
          redirectOnUnauthorized: false,
        }),
      ]);

      if (scheduleRes?.data) {
        setMasterEnabled(scheduleRes.data.masterEnabled !== false);
        setSchedules(scheduleRes.data.schedules || []);
        setHasOwnSchedule(Boolean(scheduleRes.data.hasOwnSchedule));
      }

      if (availRes?.data && availRes.data[serviceType]) {
        setLiveStatus(availRes.data[serviceType]);
      }
    } catch (e) {
      console.error(e);
      toast.error("فشل في تحميل المواعيد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [serviceType, cityId]);

  const useGeneralForCity = async () => {
    if (!cityId) return;
    setSaving(true);
    const res = await fetchHelper({
      endPoint: ["serviceSchedules", serviceType],
      method: "PUT",
      body: { cityId: Number(cityId), useGeneral: true, schedules: [] },
      redirectOnUnauthorized: false,
    });
    setSaving(false);
    if (res?.success) {
      toast.success("المدينة رجعت تمشي على المواعيد العامة");
      await loadData();
    } else {
      toast.error(res?.message || "فشل الحفظ");
    }
  };

  const updateDaySchedule = (dayKey: string, field: keyof DaySchedule, value: any) => {
    setSchedules((prev) =>
      prev.map((item) =>
        item.day === dayKey ? { ...item, [field]: value } : item,
      ),
    );
  };

  const applyToAllDays = (sourceDayKey: string) => {
    const source = schedules.find((s) => s.day === sourceDayKey);
    if (!source) return;

    setSchedules((prev) =>
      prev.map((item) => ({
        ...item,
        openingTime: source.openingTime,
        closingTime: source.closingTime,
        isOpen: source.isOpen,
      })),
    );

    toast.info(`تم نسخ مواعيد يوم ${WEEK_DAYS_DATA.find(d => d.key === sourceDayKey)?.nameAr} لجميع الأيام`);
  };

  const saveSchedules = async () => {
    setSaving(true);
    try {
      const res = await fetchHelper({
        endPoint: ["serviceSchedules", serviceType],
        method: "PUT",
        body: {
          masterEnabled,
          ...(cityId ? { cityId: Number(cityId) } : {}),
          schedules: schedules.map((s) => ({
            day: s.day,
            openingTime: s.openingTime,
            closingTime: s.closingTime,
            isOpen: s.isOpen,
          })),
        },
        redirectOnUnauthorized: false,
      });

      if (res?.success) {
        toast.success("تم حفظ المواعيد والإعدادات بنجاح");
        await loadData();
      } else {
        toast.error(res?.message || "فشل في حفظ المواعيد");
      }
    } catch (e: any) {
      toast.error(e?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>جاري تحميل المواعيد...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Per-city hours: pick a city to give it its own schedule. */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-muted/20 p-3">
        <span className="text-sm font-semibold">المواعيد لـ:</span>
        <select
          className="rounded-md border bg-background px-3 py-1.5 text-sm"
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
        >
          <option value="">كل المدن (المواعيد العامة)</option>
          {cities.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {cityName(c.name)}
            </option>
          ))}
        </select>
        {cityId && (
          <span className="text-xs text-muted-foreground">
            {hasOwnSchedule
              ? "المدينة دي ليها مواعيد خاصة بيها."
              : "المدينة دي ماشية على المواعيد العامة — لو حفظت هنا هيبقى ليها مواعيد خاصة."}
          </span>
        )}
        {cityId && hasOwnSchedule && (
          <button
            type="button"
            className="text-xs font-semibold text-red-600 hover:underline"
            disabled={saving}
            onClick={useGeneralForCity}
          >
            رجّعها للمواعيد العامة
          </button>
        )}
        <span className="w-full text-xs text-muted-foreground">
          زرار التشغيل والإيقاف هنا للأبلكيشن كله. لو عايز تقفل المندوب الخاص في مدينة واحدة بس، اقفل "المندوب الخاص" من صفحة المدينة.
        </span>
      </div>

      {/* Top Banner: Master Switch & Live Cairo Status */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Master Switch Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  مفتاح التشغيل الفوري (Master Switch)
                </CardTitle>
              </div>
              <Badge variant={masterEnabled ? "default" : "destructive"}>
                {masterEnabled ? "مفعلة" : "معطلة يدوياً"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              التحكم في إيقاف أو تشغيل الخدمة فورياً عند الطوارئ دون الحاجة لتغيير الجدول الأسبوعي.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <span className="text-sm font-medium">حالة تشغيل الخدمة العامة:</span>
                <p className="text-xs text-muted-foreground">
                  {masterEnabled
                    ? "الخدمة تعمل وفق مواعيد الجدول الأسبوعي المحدد بالأسفل"
                    : "الخدمة مغلقة فورياً على تطبيق العميل لحين إعادة تفعيلها"}
                </p>
              </div>
              <Switch
                checked={masterEnabled}
                onCheckedChange={setMasterEnabled}
                aria-label="Master Switch"
              />
            </div>
          </CardContent>
        </Card>

        {/* Live Cairo Status Card */}
        <Card className="border-2 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-base font-semibold">
                  الحالة اللحظية بتوقيت مصر (Live Status)
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                onClick={loadData}
                title="تحديث الحالة اللحظية"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription className="text-xs">
              الحالة الفعلية التي تظهر للعملاء في تطبيق الموبايل الآن
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {liveStatus ? (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">الحالة الآن:</span>
                  <Badge variant={liveStatus.isOpen ? "default" : "secondary"}>
                    {liveStatus.isOpen ? "مفتوحة لاستقبال الطلبات" : "مغلقة حالياً"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {liveStatus.message}
                </p>
                {liveStatus.nextOpeningTime && (
                  <p className="text-xs font-medium text-primary">
                    موعد الفتح القادم: {liveStatus.nextOpeningTime}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">جاري فحص الحالة...</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weekly Schedule Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-lg font-bold">{title} - جدول الأسبوع</CardTitle>
            <CardDescription className="text-xs">{subtitle}</CardDescription>
          </div>
          <Button
            onClick={saveSchedules}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            <span>حفظ المواعيد</span>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px] text-right">اليوم</TableHead>
                  <TableHead className="w-[120px] text-center">حالة اليوم</TableHead>
                  <TableHead className="w-[180px] text-right">وقت الفتح</TableHead>
                  <TableHead className="w-[180px] text-right">وقت الإغلاق</TableHead>
                  <TableHead className="text-right">نوع الشيفت</TableHead>
                  <TableHead className="w-[120px] text-center">نسخ لباقي الأيام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {WEEK_DAYS_DATA.map((dayMeta) => {
                  const schedule = schedules.find((s) => s.day === dayMeta.key) || {
                    day: dayMeta.key,
                    openingTime: "09:00",
                    closingTime: "23:00",
                    isOpen: true,
                  };

                  const isOvernight = isOvernightShift(
                    schedule.openingTime,
                    schedule.closingTime,
                  );

                  return (
                    <TableRow key={dayMeta.key} className={!schedule.isOpen ? "bg-muted/40 opacity-70" : ""}>
                      <TableCell className="font-semibold text-right">
                        {dayMeta.nameAr}
                        <span className="block text-xs text-muted-foreground font-normal">
                          {dayMeta.nameEn}
                        </span>
                      </TableCell>

                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Switch
                            checked={schedule.isOpen}
                            onCheckedChange={(checked) =>
                              updateDaySchedule(dayMeta.key, "isOpen", checked)
                            }
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {schedule.isOpen ? "يعمل" : "عطلة"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <Input
                          type="time"
                          value={schedule.openingTime}
                          disabled={!schedule.isOpen}
                          onChange={(e) =>
                            updateDaySchedule(dayMeta.key, "openingTime", e.target.value)
                          }
                          className="w-[140px]"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        <Input
                          type="time"
                          value={schedule.closingTime}
                          disabled={!schedule.isOpen}
                          onChange={(e) =>
                            updateDaySchedule(dayMeta.key, "closingTime", e.target.value)
                          }
                          className="w-[140px]"
                        />
                      </TableCell>

                      <TableCell className="text-right">
                        {!schedule.isOpen ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            عطلة رسمية للخدمة
                          </Badge>
                        ) : isOvernight ? (
                          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <Moon className="h-3.5 w-3.5" />
                            <span>شيفت ليلي (يمتد لليوم التالي)</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
                            <Sun className="h-3.5 w-3.5" />
                            <span>شيفت نهاري عادي</span>
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-xs"
                          onClick={() => applyToAllDays(dayMeta.key)}
                          title="نسخ هذه المواعيد لكل أيام الأسبوع"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span>تطبيق للكل</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Save Bar */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          onClick={saveSchedules}
          disabled={saving}
          className="gap-2 px-8"
        >
          {saving ? (
            <RefreshCw className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          <span>حفظ التعديلات</span>
        </Button>
      </div>
    </div>
  );
}

export default function ServiceSchedulesClient() {
  return (
    <Tabs defaultValue="CUSTOM_DELIVERY" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="CUSTOM_DELIVERY" className="gap-2">
          <Package className="h-4 w-4" />
          <span>الخدمات الخاصة (مندوب خاص)</span>
        </TabsTrigger>
        <TabsTrigger value="PHARMACY" className="gap-2">
          <Pill className="h-4 w-4" />
          <span>خدمة الصيدلية</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="CUSTOM_DELIVERY">
        <ServiceTabContent
          serviceType="CUSTOM_DELIVERY"
          title="مواعيد عمل الخدمات الخاصة"
          subtitle="حدد ساعات عمل المندوب الخاص وطلبات الشراء لكل يوم من أيام الأسبوع بتوقيت مصر"
          icon={<Package className="h-5 w-5 text-primary" />}
        />
      </TabsContent>

      <TabsContent value="PHARMACY">
        <ServiceTabContent
          serviceType="PHARMACY"
          title="مواعيد عمل خدمة الصيدلية"
          subtitle="حدد ساعات عمل خدمة توصيل الروشتة وعلاجات الصيدلية لكل يوم من أيام الأسبوع بتوقيت مصر"
          icon={<Pill className="h-5 w-5 text-primary" />}
        />
      </TabsContent>
    </Tabs>
  );
}
