"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, CreditCard, RefreshCw } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type AdminRevenueSummary } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminRevenueSummary | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiFetch<AdminRevenueSummary>("/api/admin/revenue/summary")
      .then(setSummary)
      .catch((error: Error) => setMessage(error.message));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Admin / Tổng quan</p>
          <h2 className="mt-2 text-2xl font-semibold">Tổng quan quản trị</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi doanh thu, credit và trạng thái thanh toán PayOS.</p>
        </div>
        <Button type="button" variant="secondary">
          <RefreshCw size={16} />
          <span className="ml-2">Làm mới</span>
        </Button>
      </div>
      {message && <Alert className="border-red-200 bg-red-50 text-red-700">{message}</Alert>}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Metric icon={CircleDollarSign} label="Tổng doanh thu" tone="blue" value={summary ? formatCurrency(summary.totalRevenue) : "-"} />
        <Metric icon={CreditCard} label="Credit đã bán" tone="emerald" value={summary ? `${summary.creditSold} cr` : "-"} />
        <Metric icon={CreditCard} label="Credit đã dùng" tone="violet" value={summary ? `${summary.creditUsed} cr` : "-"} />
        <Metric icon={CheckCircle2} label="Thành công" tone="emerald" value={summary ? String(summary.successfulTopupOrders) : "-"} />
        <Metric icon={Clock3} label="Đang chờ" tone="amber" value={summary ? String(summary.pendingTopupOrders) : "-"} />
        <Metric icon={AlertTriangle} label="Thất bại" tone="red" value={summary ? String(summary.failedPayments) : "-"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Thanh toán gần đây</CardTitle>
            <Link className="inline-flex items-center gap-1 text-sm font-medium text-primary" href="/admin/payments">
              Xem tất cả
              <ArrowUpRight size={15} />
            </Link>
          </CardHeader>
          <CardContent>
            {!summary || summary.recentPayments.length === 0 ? (
              <EmptyState title="Chưa có thanh toán" detail="Các giao dịch PayOS sẽ hiển thị sau khi người dùng tạo liên kết thanh toán." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Mã PayOS</th>
                      <th className="px-3 py-2">Số tiền</th>
                      <th className="px-3 py-2">Credit</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentPayments.map((item) => (
                      <tr className="border-t border-border" key={item.id}>
                        <td className="px-3 py-3 font-medium">{item.providerOrderCode}</td>
                        <td className="px-3 py-3">{formatCurrency(item.amount)}</td>
                        <td className="px-3 py-3">{item.credits} cr</td>
                        <td className="px-3 py-3"><StatusBadge status={item.providerStatus} /></td>
                        <td className="px-3 py-3">{formatDate(item.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-900">
                <AlertTriangle size={18} />
                Cảnh báo webhook/payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-amber-900">
              <p>Credit chỉ được cộng sau khi PayOS được xác minh ở backend và giao dịch credit được ghi vào sổ.</p>
              <div className="rounded-md border border-amber-200 bg-white p-3">
                <p className="text-xs font-medium uppercase text-amber-700">Cần theo dõi</p>
                <p className="mt-1">Live PayOS sandbox và public webhook vẫn là bước smoke trước production.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Đối soát nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Tổng tiền đã thanh toán" value={summary ? formatCurrency(summary.totalRevenue) : "-"} />
              <Detail label="Credit đã cấp" value={summary ? `${summary.creditSold} cr` : "-"} />
              <Detail label="Giao dịch cần kiểm tra" value={summary ? String(summary.failedPayments) : "-"} tone="danger" />
              <Button className="w-full" type="button" variant="secondary">
                Xuất báo cáo đối soát
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  tone: "blue" | "emerald" | "violet" | "amber" | "red";
}) {
  const toneClass = {
    blue: "bg-blue-50 text-blue-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-700"
  }[tone];

  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <span className={`rounded-md p-1.5 ${toneClass}`}>
            <Icon size={15} />
          </span>
        </div>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className={tone === "danger" ? "rounded-md border border-red-200 bg-red-50 p-3" : "rounded-md border border-border p-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
