"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, BarChart3, CircleDollarSign, RefreshCw, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, PageHeader } from "@/components/ui";
import { apiFetch, type AdminRevenueSummary } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

export default function RevenueReportPage() {
  const [summary, setSummary] = useState<AdminRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  async function loadData() {
    setLoading(true); setError(false);
    try { setSummary(await apiFetch<AdminRevenueSummary>("/api/admin/revenue/summary")); }
    catch (error) { setError(true); showError(error, "Không tải được báo cáo doanh thu."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Admin / Báo cáo doanh thu"
        title="Báo cáo doanh thu"
        description="Theo dõi doanh thu PayOS, credit đã cấp và giao dịch cần đối soát."
        actions={
        <div className="flex justify-end">
          <Button aria-label="Làm mới báo cáo" disabled={loading} type="button" variant="secondary" onClick={loadData}>
            <RefreshCw size={16} />
          </Button>
        </div>
        }
      />
      {error && <Alert>Không tải được báo cáo doanh thu. Bấm “Làm mới báo cáo” để thử lại.</Alert>}
      {loading && <p role="status" className="text-sm text-muted-foreground">Đang tải báo cáo doanh thu...</p>}
      <div aria-busy={loading} className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Tiền đến đã thanh toán" value={summary ? formatCurrency(summary.totalRevenue) : "-"} />
        <Metric icon={TrendingUp} label="Tổng credit đã cấp" value={summary ? `${summary.creditSold} cr` : "-"} />
        <Metric icon={BarChart3} label="Số giao dịch thành công" value={summary ? String(summary.successfulTopupOrders) : "-"} />
        <Metric icon={AlertTriangle} label="Giao dịch cần đối soát" tone="danger" value={summary ? String(summary.failedPayments) : "-"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <p className="self-start text-sm text-muted-foreground">Báo cáo hiện có số liệu tổng hợp; chưa có dữ liệu theo ngày.</p>
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle>Tỷ lệ xác minh thành công</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{summary ? successRate(summary) : "-"}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Tính từ các giao dịch thanh toán hiện có.</p>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  tone = "default"
}: {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return <MetricCard className="min-w-0 [&_[aria-hidden]]:hidden sm:[&_[aria-hidden]]:grid" title={label} value={value} icon={<Icon size={18} />} tone={tone === "danger" ? "danger" : "primary"} />;
}

function successRate(summary: AdminRevenueSummary) {
  const total = summary.successfulTopupOrders + summary.failedPayments;
  if (total === 0) {
    return "0.0";
  }

  return ((summary.successfulTopupOrders / total) * 100).toFixed(1);
}
