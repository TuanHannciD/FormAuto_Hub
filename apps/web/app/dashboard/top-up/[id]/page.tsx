"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Alert, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type TopupOrder } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TopUpOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<TopupOrder | null>(null);
  const [isMissing, setIsMissing] = useState(false);

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
            <p className="mt-1 text-sm text-muted-foreground">Yêu cầu có thể không tồn tại hoặc không thuộc user hiện tại.</p>
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
    <div className="space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" href="/dashboard/top-up">Quay lại yêu cầu nạp</Link>
        <h2 className="mt-3 text-2xl font-semibold">Chi tiết yêu cầu nạp</h2>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi trạng thái manual approval. Đây không phải payment gateway checkout.</p>
      </div>

      <Alert>Payment gateway vẫn Deferred. Yêu cầu này chỉ ghi nhận luồng nạp credit thủ công và chờ admin duyệt.</Alert>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Detail label="Order ID" value={order.id} />
            <Detail label="Package ID" value={order.packageId} />
            <Detail label="Credits" value={String(order.credits)} />
            <Detail label="Số tiền" value={formatCurrency(order.amount)} />
            <div>
              <p className="text-muted-foreground">Trạng thái</p>
              <div className="mt-1"><StatusBadge status={order.status} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual approval timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Detail label="Payment method" value={order.paymentMethod} />
            <Detail label="Payment note" value={order.paymentNote || "-"} />
            <Detail label="Created at" value={formatDate(order.createdAt)} />
            <Detail label="Paid at" value={formatDate(order.paidAt)} />
            <Detail label="Approved at" value={formatDate(order.approvedAt)} />
          </CardContent>
        </Card>
      </div>
    </div>
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
