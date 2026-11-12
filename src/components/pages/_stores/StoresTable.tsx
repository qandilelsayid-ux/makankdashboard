"use client";

import React, { useState } from "react";
import TableWithQuery from "@/components/common/table/TableWithQuery";
import StoresColumns from "@/pages/dashboard/stores/StoresColumns";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import { fetchHelper } from "@/api/fetch";
import { revalidatePathAction } from "@/api/global/revalidatePath";
import { usePathname, useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { CheckCircle2, XCircle, Ban } from "lucide-react";
import StatusOverrideModal from "@/components/common/dialog/StatusOverrideModal";

export default function StoresTable({
  permission,
  filters,
  cardHeader,
  extraParams
}: {
  permission: any;
  filters: any[];
  cardHeader: string;
  extraParams?: Record<string, unknown>;
}) {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingBulkStatus, setPendingBulkStatus] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (visibleIds: string[]) => {
    setSelectedIds(prev => {
      const allSelected = visibleIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !visibleIds.includes(id));
      } else {
        const union = new Set([...prev, ...visibleIds]);
        return Array.from(union);
      }
    });
  };

  const performBulkStatusChange = async (
    newStatus: string,
    extraData?: { statusReason?: string; busyMinutes?: number }
  ) => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const promises = selectedIds.map(id =>
        fetchHelper({
          endPoint: ["stores", Number(id), "status"],
          method: "PATCH",
          body: { status: newStatus, ...extraData }
        })
      );
      const results = await Promise.all(promises);
      const succeeded = results.filter(r => r?.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${t("Store status updated successfully")} (${succeeded})`);
      }
      if (failed > 0) {
        toast.error(`${t("Failed to update status")} (${failed})`);
      }

      setSelectedIds([]);
      await revalidatePathAction(pathname);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || t("Failed to update status"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    if (newStatus === "BUSY" || newStatus === "CLOSED") {
      setPendingBulkStatus(newStatus);
      setIsStatusModalOpen(true);
      return;
    }
    await performBulkStatusChange(newStatus);
  };

  const handleBulkApproval = async (approved: boolean) => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const promises = selectedIds.map(id =>
        fetchHelper({
          endPoint: ["stores", Number(id), "approval"],
          method: "PATCH",
          body: { approved }
        })
      );
      const results = await Promise.all(promises);
      const succeeded = results.filter(r => r?.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success((approved ? t("storeApproved") : t("storeRejected")) + ` (${succeeded})`);
      }
      if (failed > 0) {
        toast.error(t("error") + ` (${failed})`);
      }

      setSelectedIds([]);
      await revalidatePathAction(pathname);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkBlock = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    try {
      const promises = selectedIds.map(id =>
        fetchHelper({
          endPoint: ["stores", Number(id), "block"],
          method: "PATCH"
        })
      );
      const results = await Promise.all(promises);
      const succeeded = results.filter(r => r?.success).length;
      const failed = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(`${t("done")} (${succeeded})`);
      }
      if (failed > 0) {
        toast.error(`${t("error")} (${failed})`);
      }

      setSelectedIds([]);
      await revalidatePathAction(pathname);
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <Card className="border-primary/30 bg-primary/5 p-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">{t("Bulk actions for stores")}</h3>
              <p className="text-sm text-muted-foreground font-medium">
                {t("Selected stores count")}: {selectedIds.length}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Select */}
              <div className="min-w-[150px]">
                <Select disabled={isSubmitting} onValueChange={handleBulkStatusChange}>
                  <SelectTrigger className="w-full bg-white dark:bg-slate-900 border-primary/20">
                    <SelectValue placeholder={t("Change Status")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{t("normal")}</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="OPEN">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span>{t("Open")}</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="BUSY">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-orange-400" />
                        <span>{t("Busy")}</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="CLOSED">
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-500" />
                        <span>{t("Closed")}</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Approval Actions */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950/20"
                disabled={isSubmitting}
                onClick={() => handleBulkApproval(true)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {t("Approve")}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/20"
                disabled={isSubmitting}
                onClick={() => handleBulkApproval(false)}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                {t("Reject")}
              </Button>

              {/* Block/Unblock (Toggle) */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/20"
                disabled={isSubmitting}
                onClick={handleBulkBlock}
              >
                <Ban className="h-4 w-4 mr-1.5" />
                {t("Toggle Block")}
              </Button>

              {/* Clear */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isSubmitting}
                onClick={() => setSelectedIds([])}
              >
                {t("Cancel")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <TableWithQuery
        endPoint={["stores"]}
        columns={StoresColumns}
        hideCreateNew={!permission?.post}
        cardHeader={cardHeader}
        extraParams={extraParams}
        tableActions={{
          onEdit: permission?.put || permission?.patch,
          onDelete: permission?.delete ? ["stores"] : undefined,
          onInfo: true,
          fixedActions: true
        }}
        filters={filters}
        rowSelection={{
          selectedIds,
          onToggle: handleToggle,
          onToggleAll: handleToggleAll,
          getRowId: row => String(row.id)
        }}
      />
      <StatusOverrideModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setPendingBulkStatus(null);
        }}
        onConfirm={async (modalData) => {
          if (pendingBulkStatus) {
            await performBulkStatusChange(pendingBulkStatus, modalData);
          }
        }}
        status={pendingBulkStatus || "BUSY"}
      />
    </div>
  );
}
