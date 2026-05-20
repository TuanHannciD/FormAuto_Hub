"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { CheckCircle2, Clock3, Filter, Search, XCircle } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Select } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type AdminPayment } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);

  useEffect(() => {
    apiFetch<{ items: AdminPayment[] }>("/api/admin/payments")
      .then((data) => setPayments(data.items))
      .catch((error: Error) => showError(error, "Không tải được danh sách thanh toán."));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Admin / Top-up & thanh toán</p>
        <h2 className="mt-2 text-2xl font-semibold">Quản lý top-up và thanh toán</h2>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi đơn nạp credit, xác minh PayOS và lịch sử callback.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Clock3} label="Đang chờ xác minh" tone="amber" value={String(payments.filter((item) => item.topupOrderStatus === "Pending").length)} />
        <Stat icon={CheckCircle2} label="Đã thanh toán" tone="emerald" value={String(payments.filter((item) => item.providerStatus === "Paid").length)} />
        <Stat icon={XCircle} label="Lỗi xác minh" tone="red" value={String(payments.filter((item) => item.providerStatus === "Failed").length)} />
        <Stat icon={Filter} label="Cần đối soát" tone="slate" value={String(payments.filter((item) => !item.lastWebhookAt).length)} />
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <CardTitle>Danh sách thanh toán PayOS</CardTitle>
          <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={15} />
              <Input disabled className="pl-9" placeholder="Tìm mã đơn hoặc PayOS..." />
            </div>
            <Select disabled defaultValue="">
              <option value="">Trạng thái</option>
            </Select>
            <Select disabled defaultValue="">
              <option value="">Phương thức</option>
            </Select>
            <Button type="button" variant="secondary">Lọc</Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState title="Chưa có thanh toán" detail="Thanh toán PayOS sẽ xuất hiện sau khi user tạo yêu cầu nạp credit." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Mã PayOS</th>
                    <th className="px-3 py-2">Người dùng</th>
                    <th className="px-3 py-2">Số tiền</th>
                    <th className="px-3 py-2">Credit</th>
                    <th className="px-3 py-2">Thanh toán</th>
                    <th className="px-3 py-2">Top-up</th>
                    <th className="px-3 py-2">Webhook gần nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((item) => (
                    <tr className="border-t border-border" key={item.id}>
                      <td className="px-3 py-3 font-medium">{item.providerOrderCode}</td>
                      <td className="px-3 py-3">{item.userId.slice(0, 8)}</td>
                      <td className="px-3 py-3">{formatCurrency(item.amount)}</td>
                      <td className="px-3 py-3">{item.credits} cr</td>
                      <td className="px-3 py-3"><StatusBadge status={item.providerStatus} /></td>
                      <td className="px-3 py-3"><StatusBadge status={item.topupOrderStatus} /></td>
                      <td className="px-3 py-3">{item.lastWebhookAt ? formatDate(item.lastWebhookAt) : "Chưa có"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone: "amber" | "emerald" | "red" | "slate";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    slate: "bg-slate-100 text-slate-700"
  }[tone];

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
        </div>
        <span className={`rounded-md p-2 ${toneClass}`}>
          <Icon size={18} />
        </span>
      </CardContent>
    </Card>
  );
}
