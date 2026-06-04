"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Alert, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type DashboardSummary, type TopupOrder } from "@/lib/api";
import { displayAction } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const recentTopupColumns: Array<BaseTableColumn<TopupOrder>> = [
  { key: "credits", header: "Credit", render: (order) => order.credits },
  { key: "amount", header: "Số tiền", render: (order) => formatCurrency(order.amount) },
  { key: "status", header: "Trạng thái", render: (order) => <StatusBadge status={order.status} /> },
  { key: "createdAt", header: "Tạo lúc", render: (order) => formatDate(order.createdAt) }
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    apiFetch<DashboardSummary>("/api/dashboard/summary")
      .then(setSummary)
      .catch((error: Error) => showError(error, "Không tải được tổng quan vận hành."));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Tổng quan vận hành" description="Theo dõi credit, yêu cầu nạp và các thao tác biểu mẫu gần đây." />

      <Alert>
        Tự động hóa biểu mẫu luôn phải xem trước, người dùng phải xác nhận rõ ràng, và mỗi lần chỉ tạo 1 đến 100 câu trả lời xem trước.
      </Alert>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Credit hiện có" value={summary ? String(summary.currentCreditBalance) : "-"} />
        <Metric title="Đã nạp" value={summary ? String(summary.totalCreditsDeposited) : "-"} tone="green" />
        <Metric title="Đã dùng" value={summary ? String(summary.totalCreditsUsed) : "-"} tone="violet" />
        <Metric title="Yêu cầu chờ duyệt" value={summary ? String(summary.pendingTopupOrders) : "-"} tone="red" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Việc nên làm tiếp</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-2">
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/forms">
              Phân tích link Google Form và cài đặt cách trả lời
            </Link>
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/top-up">
              Nạp credit hoặc theo dõi giao dịch PayOS
            </Link>
            <Link className="block rounded-md border border-border/70 bg-white/55 p-3 transition hover:bg-white" href="/dashboard/usage-logs">
              Kiểm tra lịch sử sử dụng và hành động bị chặn
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lịch sử sử dụng gần đây</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!summary || summary.recentUsageLogs.length === 0 ? (
              <EmptyState title="Chưa có lịch sử sử dụng" detail="Các thao tác gần đây sẽ xuất hiện tại đây." />
            ) : (
              summary.recentUsageLogs.slice(0, 4).map((log) => (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-border/70 bg-white/55 p-3 2xl:grid-cols-[auto_minmax(0,1fr)_auto]" key={log.id}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-primary">
                    {log.creditsUsed}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5">{displayAction(log.action)}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{formatDate(log.createdAt)}</p>
                  </div>
                  <div className="col-start-2 2xl:col-start-auto">
                    <StatusBadge status={log.status} />
                  </div>
                </div>
              ))
            )}
            <Link className="inline-flex text-xs font-semibold text-primary hover:underline" href="/dashboard/usage-logs">
              Xem toàn bộ lịch sử
            </Link>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Yêu cầu nạp gần đây</CardTitle>
            <Link className="text-xs font-semibold text-primary hover:underline" href="/dashboard/top-up">
              Xem tất cả
            </Link>
          </CardHeader>
          <CardContent>
            {!summary || summary.recentTopupOrders.length === 0 ? (
              <EmptyState title="Chưa có yêu cầu nạp gần đây" detail="Nạp thêm credit khi cần tiếp tục sử dụng." />
            ) : (
              <BaseTable
                items={summary.recentTopupOrders}
                columns={recentTopupColumns}
                getRowKey={(order) => order.id}
                emptyTitle="Chưa có yêu cầu nạp gần đây"
                emptyDetail="Nạp thêm credit khi cần tiếp tục sử dụng."
                minWidthClassName="min-w-[560px]"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Metric({ title, value, tone = "cyan" }: { title: string; value: string; tone?: "cyan" | "green" | "violet" | "red" }) {
  const toneClass = {
    cyan: "metric-accent",
    green: "bg-emerald-200",
    violet: "bg-violet-200",
    red: "bg-red-200"
  }[tone];

  return (
    <Card>
      <CardContent>
        <div className={`mb-4 h-1 w-10 rounded-full ${toneClass}`} />
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-[28px] font-extrabold leading-none text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}
