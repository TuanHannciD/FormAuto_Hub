"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, CreditCard, RefreshCw } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
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
      <span className="block max-w-[220px] break-all">
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadData() {
    setLoading(true); setError(false);
    try { setSummary(await apiFetch<AdminRevenueSummary>("/api/admin/revenue/summary")); }
    catch (error) { setError(true); showError(error, "Không tải được tổng quan quản trị."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Admin / Tổng quan"
        title="Tổng quan quản trị"
        description="Theo dõi doanh thu, credit và trạng thái thanh toán PayOS."
        actions={
        <Button disabled={loading} type="button" variant="secondary" onClick={loadData}>
          <RefreshCw size={16} />
          <span className="ml-2">Làm mới</span>
        </Button>
        }
      />
      {error && <Alert>Không tải được tổng quan quản trị. Bấm “Làm mới” để thử lại.</Alert>}
      <div aria-busy={loading} className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        <Metric icon={CircleDollarSign} label="Tổng doanh thu" tone="blue" value={summary ? formatCurrency(summary.totalRevenue) : "-"} />
        <Metric icon={CreditCard} label="Credit đã bán" tone="emerald" value={summary ? `${summary.creditSold} cr` : "-"} />
        <Metric icon={CreditCard} label="Credit đã dùng" tone="violet" value={summary ? `${summary.creditUsed} cr` : "-"} />
        <Metric icon={CheckCircle2} label="Thành công" tone="emerald" value={summary ? String(summary.successfulTopupOrders) : "-"} />
        <Metric icon={Clock3} label="Đang chờ" tone="amber" value={summary ? String(summary.pendingTopupOrders) : "-"} />
        <Metric icon={AlertTriangle} label="Thất bại" tone="red" value={summary ? String(summary.failedPayments) : "-"} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Thanh toán gần đây</CardTitle>
            <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg text-sm font-medium text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-h-10" href="/admin/payments">
              Xem tất cả
              <ArrowUpRight size={15} />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? <p role="status" className="py-4 text-sm text-muted-foreground">Đang tải thanh toán...</p> : error ? <p className="py-4 text-sm text-muted-foreground">Chưa tải được danh sách thanh toán.</p> : !summary || summary.recentPayments.length === 0 ? (
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

        <div className="min-w-0 space-y-4">
          <Card className="min-w-0 border-warning-border bg-warning-surface/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle size={18} />
                Cảnh báo webhook/payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-warning">
              <p>Credit chỉ được cộng sau khi PayOS được xác minh ở backend và giao dịch credit được ghi vào sổ.</p>
              <div className="rounded-xl border border-warning-border bg-surface-subtle p-3">
                <p className="text-xs font-medium uppercase text-warning">Cần theo dõi</p>
                <p className="mt-1">Theo dõi các giao dịch chưa xác minh hoặc cần đối soát lại.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
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
  return <MetricCard className="min-w-0 [&_[aria-hidden]]:hidden sm:[&_[aria-hidden]]:grid" title={label} value={value} icon={<Icon size={18} />} tone={({ blue: "info", emerald: "success", violet: "primary", amber: "warning", red: "danger" } as const)[tone]} />;
}

function Detail({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "danger" }) {
  return (
    <div className={tone === "danger" ? "rounded-xl border border-destructive-border bg-destructive-surface p-3" : "rounded-xl border border-border bg-surface-subtle p-3"}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
