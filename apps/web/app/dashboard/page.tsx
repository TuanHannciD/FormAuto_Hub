"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Coins, CreditCard, History, Loader2, RefreshCw } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type DashboardSummary, type TopupOrder } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { displayAction } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const recentTopupColumns: Array<BaseTableColumn<TopupOrder>> = [
  { key: "credits", header: "Credit", render: (order) => order.credits },
  { key: "amount", header: "Số tiền", render: (order) => formatCurrency(order.amount) },
  { key: "status", header: "Trạng thái", render: (order) => <StatusBadge status={order.status} /> },
  { key: "createdAt", header: "Tạo lúc", render: (order) => formatDate(order.createdAt) }
];

const metrics = [
  { key: "currentCreditBalance", title: "Credit hiện có", icon: Coins },
  { key: "totalCreditsDeposited", title: "Tổng credit đã nạp", icon: CreditCard },
  { key: "totalCreditsUsed", title: "Credit đã sử dụng", icon: History },
  { key: "pendingTopupOrders", title: "Yêu cầu đang chờ", icon: RefreshCw }
] as const;

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [accountName, setAccountName] = useState("bạn");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadSummary = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      setSummary(await apiFetch<DashboardSummary>("/api/dashboard/summary"));
    } catch (error) {
      setErrorMessage("Không tải được tổng quan tài khoản. Vui lòng thử lại.");
      showError(error, "Không tải được tổng quan tài khoản.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setAccountName(getStoredSession()?.fullName || "bạn");
    void loadSummary();
  }, [loadSummary]);

  return (
    <div className="space-y-[22px]">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-[27px] font-bold leading-tight tracking-tight sm:text-[36px]">Xin chào, {accountName}</h1>
          <p className="mt-2 text-[13px] leading-6 text-secondary-foreground">Theo dõi credit và hoạt động gần đây của tài khoản.</p>
        </div>
        <Link href="/dashboard/forms" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-soft transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">Bắt đầu điền form <ArrowRight aria-hidden="true" size={18} /></Link>
      </header>

      {errorMessage && (
        <Alert role="alert" className="flex flex-col gap-3 border-destructive-border bg-destructive-surface text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>{errorMessage}</span>
          <Button variant="secondary" type="button" className="shrink-0 gap-2" disabled={isLoading} onClick={() => void loadSummary()}><RefreshCw aria-hidden="true" size={16} />Tải lại</Button>
        </Alert>
      )}

      <Card className="grid overflow-hidden rounded-2xl bg-surface shadow-none sm:grid-cols-2 xl:grid-cols-4" aria-label="Tổng quan credit" aria-busy={isLoading}>
        {metrics.map(({ key, title, icon: Icon }, index) => (
          <div key={key} className={`flex min-h-[120px] items-center gap-4 border-border px-6 py-6 ${index < 3 ? "border-b" : ""} ${index % 2 === 0 ? "sm:border-r" : ""} ${index < 2 ? "sm:border-b" : "sm:border-b-0"} ${index < 3 ? "xl:border-b-0 xl:border-r" : ""}`}>
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary"><Icon aria-hidden="true" size={22} /></span>
            <div className="min-w-0"><p className="text-xs font-medium text-secondary-foreground">{title}</p><p className="mt-2 break-all text-[27px] font-bold leading-none tracking-tight">{summary ? summary[key].toLocaleString("vi-VN") : "–"}</p></div>
          </div>
        ))}
      </Card>

      <div className="grid items-start gap-[22px] xl:grid-cols-2">
        <Card className="min-w-0 overflow-hidden rounded-2xl bg-surface shadow-none">
          <CardHeader className="flex min-h-[86px] items-start justify-between gap-3 px-6 py-5">
            <div><CardTitle className="text-[17px]">Sử dụng gần đây</CardTitle><p className="mt-1 text-xs leading-5 text-secondary-foreground">Các lượt tạo và gửi phản hồi mới nhất.</p></div>
            <Link href="/dashboard/usage-logs" className="shrink-0 text-xs font-semibold text-primary hover:underline">Xem tất cả</Link>
          </CardHeader>
          <CardContent className="min-h-[210px] px-5 py-4">
            {isLoading ? <LoadingPanel /> : errorMessage ? <UnavailablePanel /> : summary?.recentUsageLogs.length ? (
              <div className="divide-y divide-border">
                {summary.recentUsageLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div className="min-w-0 flex-1"><p className="text-sm font-semibold">{displayAction(log.action)}</p><p className="mt-1 text-xs leading-5 text-secondary-foreground">{formatDate(log.createdAt)}</p></div>
                    <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-semibold text-primary">{log.creditsUsed} credit</span><StatusBadge status={log.status} /></div>
                  </div>
                ))}
              </div>
            ) : <div className="py-3"><History aria-hidden="true" className="mx-auto mb-4 text-secondary-foreground" size={30} /><EmptyState title="Chưa có hoạt động sử dụng" detail="Các thao tác gần đây sẽ xuất hiện tại đây." /></div>}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden rounded-2xl bg-surface shadow-none">
          <CardHeader className="flex min-h-[86px] items-start justify-between gap-3 px-6 py-5">
            <div><CardTitle className="text-[17px]">Yêu cầu nạp gần đây</CardTitle><p className="mt-1 text-xs leading-5 text-secondary-foreground">Theo dõi số tiền, credit và trạng thái yêu cầu.</p></div>
            <Link href="/dashboard/top-up" className="shrink-0 text-xs font-semibold text-primary hover:underline">Nạp credit</Link>
          </CardHeader>
          <CardContent className="min-h-[210px] px-5 py-4">
            {isLoading ? <LoadingPanel /> : errorMessage ? <UnavailablePanel /> : summary?.recentTopupOrders.length ? (
              <BaseTable items={summary.recentTopupOrders} columns={recentTopupColumns} getRowKey={(order) => order.id} emptyTitle="Chưa có yêu cầu nạp gần đây" emptyDetail="Nạp thêm credit khi cần tiếp tục sử dụng." minWidthClassName="min-w-[500px]" />
            ) : <div className="py-3"><CreditCard aria-hidden="true" className="mx-auto mb-4 text-secondary-foreground" size={30} /><EmptyState title="Chưa có yêu cầu nạp gần đây" detail="Nạp thêm credit khi cần tiếp tục sử dụng." /></div>}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function LoadingPanel() {
  return <div role="status" className="flex min-h-[170px] items-center justify-center gap-3 text-sm text-secondary-foreground"><Loader2 aria-hidden="true" size={20} className="animate-spin" />Đang tải dữ liệu...</div>;
}

function UnavailablePanel() {
  return <p className="flex min-h-[170px] items-center justify-center text-center text-sm text-secondary-foreground">Dữ liệu chưa khả dụng. Hãy tải lại tổng quan.</p>;
}
