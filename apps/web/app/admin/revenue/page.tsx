"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { AlertTriangle, BarChart3, CircleDollarSign, Download, RefreshCw, TrendingUp } from "lucide-react";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Select } from "@/components/ui";
import { apiFetch, type AdminRevenueSummary } from "@/lib/api";
import { showError } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

export default function RevenueReportPage() {
  const [summary, setSummary] = useState<AdminRevenueSummary | null>(null);

  useEffect(() => {
    apiFetch<AdminRevenueSummary>("/api/admin/revenue/summary")
      .then(setSummary)
      .catch((error: Error) => showError(error, "Không tải được báo cáo doanh thu."));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Admin / Báo cáo doanh thu</p>
          <h2 className="mt-2 text-2xl font-semibold">Báo cáo doanh thu</h2>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi doanh thu PayOS, credit đã cấp và giao dịch cần đối soát.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select disabled className="w-32" defaultValue="day">
            <option value="day">Ngày</option>
          </Select>
          <Select disabled className="w-40" defaultValue="payos">
            <option value="payos">PayOS</option>
          </Select>
          <Button type="button" variant="secondary">
            <Download size={16} />
            <span className="ml-2">Xuất CSV đang cập nhật</span>
          </Button>
          <Button type="button" variant="secondary">
            <RefreshCw size={16} />
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric icon={CircleDollarSign} label="Tiền đến đã thanh toán" value={summary ? formatCurrency(summary.totalRevenue) : "-"} />
        <Metric icon={TrendingUp} label="Tổng credit đã cấp" value={summary ? `${summary.creditSold} cr` : "-"} />
        <Metric icon={BarChart3} label="Số giao dịch thành công" value={summary ? String(summary.successfulTopupOrders) : "-"} />
        <Metric icon={AlertTriangle} label="Giao dịch cần đối soát" tone="danger" value={summary ? String(summary.failedPayments) : "-"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Doanh thu theo ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-border bg-muted/20 p-5 text-center">
              <div>
                <p className="font-medium">Biểu đồ doanh thu đang cập nhật</p>
                <p className="mt-2 max-w-sm text-sm text-muted-foreground">Dữ liệu tổng hợp hiện được hiển thị ở các chỉ số phía trên.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Xu hướng doanh thu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-muted-foreground">Đang cập nhật</p>
              <p className="mt-2 text-sm text-muted-foreground">Xu hướng sẽ hiển thị khi có dữ liệu theo kỳ.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tỷ lệ xác minh thành công</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{summary ? successRate(summary) : "-"}%</p>
              <p className="mt-2 text-sm text-muted-foreground">Tính từ payment records hiện có.</p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Alert>Hoàn tiền, gói thuê bao và nhà cung cấp thanh toán khác PayOS đang cập nhật.</Alert>
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
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <span className={tone === "danger" ? "rounded-md bg-red-50 p-1.5 text-red-700" : "rounded-md bg-primary/10 p-1.5 text-primary"}>
            <Icon size={15} />
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function successRate(summary: AdminRevenueSummary) {
  const total = summary.successfulTopupOrders + summary.failedPayments;
  if (total === 0) {
    return "0.0";
  }

  return ((summary.successfulTopupOrders / total) * 100).toFixed(1);
}
