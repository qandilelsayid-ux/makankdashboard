"use client";

import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Loader2, User, Phone, Mail, CheckCircle2, ShieldCheck, Zap, Eye, EyeOff, KeyRound, Radio } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { apiClient } from "@/lib/axios";
import { queryClient } from "@/lib/queryClient";
import { toast } from "sonner";
import CitySelector from "@/components/shared/CitySelector";

export interface EditDriverModalProps {
  driver: {
    id: number;
    name: string;
    email: string;
    phone: string;
    image?: string | null;
    avatar?: string | null;
    verified?: boolean;
    isVerified?: boolean;
    active?: boolean;
    isActive?: boolean;
    isOnShift?: boolean;
    availableNow?: boolean;
    forceAvailable?: boolean;
    isAvailable?: boolean;
    cityId?: number | null;
    // Object from the API (typed as an array in some callers).
    DeliveryDetails?: any;
  };
  trigger?: React.ReactNode;
}

export default function EditDriverModal({ driver, trigger }: EditDriverModalProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = useTranslations();

  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(driver.name || "");
  const [phone, setPhone] = useState(driver.phone || "");
  const [email, setEmail] = useState(driver.email || "");
  const [isActive, setIsActive] = useState<boolean>(Boolean(driver.isActive ?? driver.active ?? true));
  const [isVerified, setIsVerified] = useState<boolean>(Boolean(driver.isVerified ?? driver.verified ?? false));
  const [forceAvailable, setForceAvailable] = useState<boolean>(Boolean(driver.isAvailable ?? driver.forceAvailable ?? false));
  // The city this driver works in (a city admin only sees its own drivers).
  const [cityId, setCityId] = useState<number | null>(
    (Array.isArray(driver.DeliveryDetails) ? driver.DeliveryDetails[0] : driver.DeliveryDetails)?.cityId ?? driver.cityId ?? null
  );
  const [availableNow, setAvailableNow] = useState<boolean>(Boolean(driver.availableNow ?? driver.isOnShift ?? false));

  // Password State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password) {
      if (password.length < 6) {
        toast.error(isAr ? "كلمة المرور يجب أن لا تقل عن 6 أحرف" : "Password must be at least 6 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error(isAr ? "كلمة المرور وتأكيد كلمة المرور غير متطابقين" : "Password and confirmation do not match");
        return;
      }
    }

    setIsSubmitting(true);

    const payload: Record<string, any> = {
      name,
      phone,
      email,
      active: isActive,
      verified: isVerified,
      forceAvailable,
      availableNow,
      // 0 = no city (null is dropped by the API validator).
      cityId: cityId ?? 0
    };

    if (password) {
      payload.password = password;
    }

    try {
      let response;
      try {
        response = await apiClient.put(`/api/delivery/${driver.id}`, payload);
      } catch (err) {
        try {
          response = await apiClient.patch(`/api/delivery/${driver.id}`, payload);
        } catch (err2) {
          response = await apiClient.put(`/api/users/${driver.id}`, payload);
        }
      }

      toast.success(
        isAr 
          ? (password ? "تم تحديث بيانات المندوب وكلمة المرور بنجاح" : "تم تحديث بيانات المندوب بنجاح")
          : (password ? "Driver profile and password updated successfully" : "Driver profile updated successfully")
      );
      queryClient.invalidateQueries({ queryKey: ["delivery"] });
      queryClient.invalidateQueries({ queryKey: ["deliverySummaryData"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setPassword("");
      setConfirmPassword("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Failed to update driver profile:", error);
      const errData = error?.response?.data;
      const errMsg = errData?.message || error?.message || "";
      const status = error?.response?.status;

      if (status === 409 || errMsg.includes("already_exists")) {
        if (errMsg.includes("phone")) {
          toast.error(isAr ? "رقم الهاتف مستخدم بالفعل لمندوب آخر" : "Phone number is already in use by another driver");
        } else if (errMsg.includes("email")) {
          toast.error(isAr ? "البريد الإلكتروني مستخدم بالفعل لمندوب آخر" : "Email is already in use by another driver");
        } else {
          toast.error(isAr ? "رقم الهاتف أو البريد الإلكتروني مستخدم بالفعل" : "Phone or email is already registered");
        }
      } else if (status === 400) {
        toast.error(errMsg || (isAr ? "بيانات غير صالحة، يرجى التأكد من كلمة المرور والبيانات المدخلة" : "Invalid data, please check the entered fields"));
      } else {
        toast.error(errMsg || (isAr ? "حدث خطأ أثناء تعديل بيانات المندوب" : "Failed to update driver profile"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-2 text-xs font-semibold border-primary/20 text-primary hover:bg-primary/5 rounded-xl shadow-xs"
        >
          <Pencil className="h-3.5 w-3.5" />
          {isAr ? "تعديل بيانات المندوب" : "Edit Driver Profile"}
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          dir={isAr ? "rtl" : "ltr"}
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border shadow-2xl rounded-3xl p-6"
        >
          <DialogHeader className={isAr ? "text-right" : "text-left"}>
            <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Pencil className="h-5 w-5" />
              </div>
              <span>{isAr ? `تعديل بيانات المندوب #${driver.id}` : `Edit Driver Profile #${driver.id}`}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {isAr 
                ? "قم بتحديث البيانات الشخصية، إعدادات الحساب، وكلمة المرور للمندوب في النظام." 
                : "Update personal details, account settings, and system password for this driver."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-2">
            {/* Main Personal Info Section */}
            <div className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <User className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "الاسم الكامل" : "Full Name"}
                </Label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={isAr ? "أدخل اسم المندوب الكامل" : "Enter driver full name"}
                  className="h-10 text-xs rounded-xl bg-background/50 focus:bg-background transition-all"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "رقم الهاتف" : "Phone Number"}
                </Label>
                <Input
                  type="text"
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+201012345678"
                  className="h-10 text-xs font-mono rounded-xl bg-background/50 focus:bg-background transition-all"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  {isAr ? "البريد الإلكتروني" : "Email Address"}
                </Label>
                <Input
                  type="email"
                  required
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="driver@example.com"
                  className="h-10 text-xs font-mono rounded-xl bg-background/50 focus:bg-background transition-all"
                />
              </div>
            </div>

            {/* Driver city */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                {isAr ? "مدينة المندوب" : "Driver city"}
              </Label>
              <CitySelector
                value={cityId}
                onChange={(id) => setCityId(id)}
                allCitiesLabel={isAr ? "بدون مدينة" : "No city"}
                className="h-10 w-full"
              />
              <p className="text-[11px] text-muted-foreground/80">
                {isAr
                  ? "أدمن المدينة هيشوف المندوب ده ويقدر يسند له طلبات لو في مدينته بس."
                  : "A city admin only sees and assigns drivers of their own city."}
              </p>
            </div>

            {/* Change Password Section */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-primary" />
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {isAr ? "تغيير كلمة المرور (اختياري)" : "Change Password (Optional)"}
                </h4>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {isAr ? "كلمة المرور الجديدة" : "New Password"}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      dir="ltr"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-10 text-xs font-mono rounded-xl bg-background/50 focus:bg-background transition-all pe-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors ${
                        isAr ? "left-2.5" : "right-2.5"
                      }`}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {isAr ? "تأكيد كلمة المرور" : "Confirm New Password"}
                  </Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    dir="ltr"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-xs font-mono rounded-xl bg-background/50 focus:bg-background transition-all"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground/80">
                {isAr 
                  ? "اترك حقول كلمة المرور فارغة إذا كنت لا تريد تغيير كلمة المرور الحالية." 
                  : "Leave password fields blank if you do not want to change the current password."}
              </p>
            </div>

            {/* Switches for Statuses & Permissions */}
            <div className="space-y-3 pt-4 border-t border-border/60">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                {isAr ? "حالة الحساب والصلاحيات" : "Account Status & Permissions"}
              </h4>

              {/* Account Active */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {isAr ? "تفعيل حساب المندوب (نشط)" : "Account Active"}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive 
                      ? (isAr ? "الحساب مفعل ويمكن للمندوب تسجيل الدخول واستلام الطلبات" : "Account active and driver can login")
                      : (isAr ? "الحساب معطل وموقوف عن العمل" : "Account disabled and suspended")}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
              </div>

              {/* Account Verified */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-foreground">
                    <ShieldCheck className="h-4 w-4 text-blue-500" />
                    {isAr ? "توثيق حساب المندوب (حساب موثق)" : "Account Verified"}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {isVerified 
                      ? (isAr ? "الحساب موثق رسمياً برمز التوثيق" : "Account officially verified")
                      : (isAr ? "الحساب غير موثق حالياً" : "Account unverified")}
                  </p>
                </div>
                <Switch
                  checked={isVerified}
                  onCheckedChange={setIsVerified}
                />
              </div>

              {/* Force Available */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-foreground">
                    <Zap className="h-4 w-4 text-amber-500" />
                    {isAr ? "متاح دائماً (Force Available)" : "Force Available"}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {forceAvailable 
                      ? (isAr ? "المندوب متاح دائماً لاستلام الطلبات بدون جدول شيفتات" : "Always available without schedule")
                      : (isAr ? "التواجد مقيد بجدول مواعيد الشيفت المحدد" : "Availability restricted to schedule")}
                  </p>
                </div>
                <Switch
                  checked={forceAvailable}
                  onCheckedChange={setForceAvailable}
                />
              </div>

              {/* Available Now */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl border bg-muted/30 hover:bg-muted/50 transition-all">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer text-foreground">
                    <Radio className="h-4 w-4 text-emerald-500" />
                    {isAr ? "شغال أونلاين الآن (Available Now)" : "Available Online Now"}
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    {availableNow 
                      ? (isAr ? "المندوب شغال حالياً أونلاين ومتاح لاستلام الطلبات" : "Driver is currently online and active on shift")
                      : (isAr ? "المندوب أوفلاين وغير متصل بالشفت حالياً" : "Driver is currently offline / not on shift")}
                  </p>
                </div>
                <Switch
                  checked={availableNow}
                  onCheckedChange={setAvailableNow}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4 border-t border-border/60 flex-wrap sm:flex-nowrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full sm:w-auto text-xs rounded-xl"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="w-full sm:w-auto gap-2 text-xs font-bold rounded-xl shadow-md"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {isAr ? "حفظ التعديلات" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

