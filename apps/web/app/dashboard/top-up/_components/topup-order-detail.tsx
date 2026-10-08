"use client";

import Image from "next/image";
import { Copy, FileImage, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, KeyValueRow } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import type { TopupOrder } from "@/lib/api";
import { displayPaymentMethod } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";

export function TopupOrderDetailDialog({ order, evidenceUrl, evidenceError = false, onClose }: {
  order: TopupOrder | null; evidenceUrl: string | null; evidenceError?: boolean; onClose: () => void;
}) {
  return <Dialog open={order !== null} className="max-w-3xl" onOpenChange={open => { if (!open) onClose(); }}>
    {order && <DialogContent contentClassName="flex max-h-[calc(100dvh-2rem-2px)] flex-col">
      <DialogHeader className="flex shrink-0 items-start justify-between gap-3">
        <div><DialogTitle>Chi tiết yêu cầu nạp</DialogTitle><DialogDescription>Theo dõi thanh toán và trạng thái ghi nhận credit.</DialogDescription></div>
        <DialogClose size="icon" aria-label="Đóng chi tiết"><X size={16} /></DialogClose>
      </DialogHeader>
      <DialogBody className="min-h-0 space-y-4 overflow-y-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-border bg-primary-soft/60 p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <div><p className="text-xs text-muted-foreground">Số tiền</p><p className="mt-1 text-xl font-extrabold">{formatCurrency(order.amount)}</p></div>
            <div><p className="text-xs text-muted-foreground">Credit nhận</p><p className="mt-1 text-xl font-extrabold text-primary">{order.credits} <span className="text-sm font-semibold">credit</span></p></div>
          </div><StatusBadge status={order.status} />
        </div>
        <div className="grid items-start gap-5 md:grid-cols-2">
          <section className="min-w-0 space-y-2 text-sm" aria-label="Thông tin yêu cầu">
            <h3 className="mb-3 font-bold">Thông tin yêu cầu</h3>
            <KeyValueRow label="Gói credit" value={order.packageName || "-"} />
            <KeyValueRow label="Phương thức" value={displayPaymentMethod(order.paymentMethod)} />
            <KeyValueRow label="Tạo lúc" value={formatDate(order.createdAt)} />
            <KeyValueRow label="Thanh toán lúc" value={formatDate(order.paidAt)} />
            <KeyValueRow label="Duyệt lúc" value={formatDate(order.approvedAt)} />
            <div className="pt-2"><p className="mb-2 text-xs font-semibold text-muted-foreground">{order.status === "Rejected" ? "Lý do từ chối" : "Ghi chú thanh toán"}</p><p className="whitespace-pre-wrap break-words rounded-xl bg-surface-subtle p-3">{order.paymentNote || "Không có ghi chú"}</p></div>
          </section>
          <section className="min-w-0 space-y-3" aria-label="Minh chứng chuyển khoản">
            <h3 className="flex items-center gap-2 text-sm font-bold"><FileImage size={16} className="text-primary" />Minh chứng chuyển khoản</h3>
            {evidenceUrl ? <div className="relative h-[240px] overflow-hidden rounded-xl border border-border bg-surface-subtle"><Image unoptimized fill className="object-contain p-2" src={evidenceUrl} alt="Ảnh minh chứng nạp credit" sizes="(max-width: 768px) 90vw, 350px" /></div>
              : <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-subtle p-4 text-center text-sm text-muted-foreground"><FileImage size={24} aria-hidden="true" /><p>{evidenceError ? "Không tải được ảnh minh chứng." : order.evidenceFileId ? "Đang tải minh chứng..." : "Yêu cầu này không có ảnh minh chứng."}</p></div>}
          </section>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Credit được ghi nhận sau khi thanh toán được xác minh hoặc yêu cầu đối soát được duyệt.</p>
        <div className="flex items-start gap-2"><p className="min-w-0 flex-1 break-all font-mono text-[11px] text-muted-foreground">Mã yêu cầu: {order.id}</p><button type="button" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-border-strong text-muted-foreground hover:text-primary" aria-label="Sao chép đầy đủ mã yêu cầu" onClick={async () => { await navigator.clipboard.writeText(order.id); toast.success("Đã sao chép đầy đủ mã yêu cầu."); }}><Copy size={13} /></button></div>
      </DialogBody>
      <DialogFooter className="shrink-0"><DialogClose className="w-full sm:w-auto">Đóng</DialogClose></DialogFooter>
    </DialogContent>}
  </Dialog>;
}
