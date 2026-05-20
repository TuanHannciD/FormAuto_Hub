"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Button, Card, CardContent, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type TopupOrder } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TopUpOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<TopupOrder | null>(null);
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
      .catch(() => setIsMissing(true));
  }, [params.id]);

  if (isMissing) {
    return (
      <div className="space-y-6">
        <Link className="text-sm text-primary hover:underline" href="/dashboard/top-up">Quay lại yêu cầu nạp</Link>
        <Card>
          <CardContent>
            <p className="font-medium">Không tìm thấy yêu cầu nạp.</p>
            <p className="mt-1 text-sm text-muted-foreground">Yêu cầu có thể không tồn tại hoặc không thuộc tài khoản hiện tại.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6">
        <Link className="text-sm text-primary hover:underline" href="/dashboard/top-up">Quay lại yêu cầu nạp</Link>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Đang tải yêu cầu nạp...</p>
          </CardContent>
        </Card>
      </div>
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
            <section className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-semibold">Thông tin yêu cầu</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Mã yêu cầu" value={order.id} />
                <Detail label="Mã gói credit" value={order.packageId} />
                <Detail label="Credit" value={String(order.credits)} />
                <Detail label="Số tiền" value={formatCurrency(order.amount)} />
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <div className="mt-1"><StatusBadge status={order.status} /></div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border">
              <div className="border-b border-border px-4 py-3">
                <h3 className="font-semibold">Tiến trình xử lý</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Cách ghi nhận thanh toán" value={order.paymentMethod} />
                <Detail label="Ghi chú thanh toán" value={order.paymentNote || "-"} />
                <Detail label="Tạo lúc" value={formatDate(order.createdAt)} />
                <Detail label="Đã thanh toán lúc" value={formatDate(order.paidAt)} />
                <Detail label="Được duyệt lúc" value={formatDate(order.approvedAt)} />
              </div>
            </section>
          </div>
        </DialogBody>
        <DialogFooter>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted" href="/dashboard/top-up">
            Quay lại yêu cầu nạp
          </Link>
          <Button type="button" onClick={closeDialog}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
