"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import { Alert, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, apiFetchBlob, type TopupOrder } from "@/lib/api";
import { displayPaymentMethod } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function TopUpOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<TopupOrder | null>(null);
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  function closeDialog() {
    router.push("/dashboard/top-up");
  }

  useEffect(() => {
    apiFetch<TopupOrder>(`/api/topup-orders/${params.id}`)
      .then((data) => {
        setOrder(data);
        setIsMissing(false);
      })
      .catch((error) => {
        setIsMissing(true);
        showError(error, "Không tải được chi tiết yêu cầu nạp.");
      });
  }, [params.id]);

  useEffect(() => {
    if (!order?.evidenceFileId) {
      return;
    }

    let objectUrl: string | null = null;
    apiFetchBlob(`/api/topup-orders/evidence/${order.evidenceFileId}`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setEvidenceUrl(objectUrl);
      })
      .catch((error) => {
        setEvidenceUrl(null);
        showError(error, "Không tải được ảnh minh chứng.");
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [order?.evidenceFileId]);

  if (isMissing) {
    return (
      <Dialog open className="lg:pl-72" onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Không tìm thấy yêu cầu nạp</DialogTitle>
            <DialogDescription>Yêu cầu có thể không tồn tại hoặc không thuộc tài khoản hiện tại.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={closeDialog}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  if (!order) {
    return (
      <Dialog open className="lg:pl-72" onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
            <DialogDescription>Đang tải thông tin yêu cầu nạp...</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
          </DialogBody>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open className="lg:pl-72" onOpenChange={(open) => !open && closeDialog()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
          <DialogDescription>Theo dõi trạng thái thanh toán, xác minh và cộng credit.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <Alert>Credit được cộng sau khi thanh toán được xác minh hoặc yêu cầu được quản trị viên xử lý.</Alert>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-lg border border-border/70 bg-white/45 backdrop-blur">
              <div className="border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold">Thông tin yêu cầu</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Mã yêu cầu" value={<RequestCode id={order.id} />} />
                <Detail label="Gói credit" value={order.packageName || "-"} />
                <Detail label="Số credit" value={String(order.credits)} />
                <Detail label="Số tiền" value={formatCurrency(order.amount)} />
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <div className="mt-1"><StatusBadge status={order.status} /></div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-white/45 backdrop-blur">
              <div className="border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold">Tiến trình xử lý</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Cách ghi nhận thanh toán" value={displayPaymentMethod(order.paymentMethod)} />
                <Detail label="Ghi chú thanh toán" value={order.paymentNote || "-"} />
                <Detail label="Ảnh minh chứng" value={order.evidenceFileId ? "Đã tải ảnh" : "Không có"} />
                <Detail label="Tạo lúc" value={formatDate(order.createdAt)} />
                <Detail label="Đã thanh toán lúc" value={formatDate(order.paidAt)} />
                <Detail label="Được duyệt lúc" value={formatDate(order.approvedAt)} />
              </div>
            </section>
          </div>
          {evidenceUrl && (
            <section className="rounded-lg border border-border/70 bg-white/45 p-4 backdrop-blur">
              <h3 className="font-semibold">Ảnh minh chứng</h3>
              <div className="relative mt-3 h-[480px] w-full overflow-hidden rounded-md bg-white/55">
                <Image unoptimized fill className="object-contain" src={evidenceUrl} alt="Ảnh minh chứng nạp credit" sizes="(max-width: 768px) 100vw, 896px" />
              </div>
            </section>
          )}
        </DialogBody>
        <DialogFooter className="flex-col sm:flex-row">
          <Link className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border/70 bg-white/75 px-4 py-2 text-sm font-medium transition hover:bg-white sm:w-auto" href="/dashboard/top-up">
            Quay lại yêu cầu nạp
          </Link>
          <Button className="w-full sm:w-auto" type="button" onClick={closeDialog}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestCode({ id }: { id: string }) {
  const shortId = id.slice(0, 8).toUpperCase();

  async function copyId() {
    await navigator.clipboard.writeText(id);
    toast.success("Đã sao chép đầy đủ mã yêu cầu.");
  }

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="font-mono text-xs font-semibold">{shortId}</span>
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-white/75 text-muted-foreground hover:text-primary" type="button" onClick={copyId} aria-label="Sao chép đầy đủ mã yêu cầu">
        <Copy size={13} />
      </button>
    </span>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
