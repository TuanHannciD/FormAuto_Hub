"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, CreditCard, RefreshCw } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type AdminPayment, type AdminRevenueSummary } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const recentPaymentColumns: Array<BaseTableColumn<AdminPayment>> = [
  { key: "providerOrderCode", header: "Mã PayOS", render: (item) => item.providerOrderCode, className: "font-medium" },
  {
    key: "user",
    header: "Người dùng",
    render: (item) => (
      <span className="block max-w-[220px] truncate" title={displayPaymentUser(item)}>
        {displayPaymentUser(item)}
      </span>
    )
  },
  { key: "amount", header: "Số tiền", render: (item) => formatCurrency(item.amount) },
  { key: "credits", header: "Credit", render: (item) => `${item.credits} cr` },
  { key: "status", header: "Trạng thái", render: (item) => <StatusBadge status={item.providerStatus} /> },
  { key: "createdAt", header: "Tạo lúc", render: (item) => formatDate(item.createdAt) }
];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminRevenueSummary | null>(null);

  useEffect(() => {
    apiFetch<AdminRevenueSummary>("/api/admin/revenue/summary")
      .then(setSummary)
      .catch((error: Error) => showError(error, "Không tải được tổng quan quản trị."));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Tổng quan"
        title="Tổng quan quản trị"
        description="Theo dõi doanh thu, credit và trạng thái thanh toán PayOS."
        actions={
        <Button type="button" variant="secondary">
          <RefreshCw size={16} />
          <span className="ml-2">Làm mới</span>
        </Button>
        }
      />
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
              <BaseTable
                items={summary.recentPayments}
                columns={recentPaymentColumns}
                getRowKey={(item) => item.id}
                emptyTitle="Chưa có thanh toán"
                emptyDetail="Các giao dịch PayOS sẽ hiển thị sau khi người dùng tạo liên kết thanh toán."
                minWidthClassName="min-w-[760px]"
              />
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
              <div className="rounded-md border border-amber-200 bg-white/75 p-3 backdrop-blur">
                <p className="text-xs font-medium uppercase text-amber-700">Cần theo dõi</p>
                <p className="mt-1">Theo dõi các giao dịch chưa xác minh hoặc cần đối soát lại.</p>
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

function displayPaymentUser(item: AdminPayment) {
  return item.userEmail || item.userId.slice(0, 8);
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
        <p className="text-[24px] font-extrabold leading-tight text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className={tone === "danger" ? "rounded-md border border-red-200 bg-red-50/85 p-3" : "rounded-md border border-border/70 bg-white/55 p-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
