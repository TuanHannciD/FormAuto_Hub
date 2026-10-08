"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { CheckCircle2, Clock3, Filter, Search, XCircle } from "lucide-react";
import { MetricCard } from "@/components/metric-card";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, PageHeader, Select } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type AdminPayment } from "@/lib/api";
import { displayStatus } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";

const paymentColumns: Array<BaseTableColumn<AdminPayment>> = [
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
  { key: "providerStatus", header: "Thanh toán", render: (item) => <StatusBadge status={item.providerStatus} /> },
  { key: "topupOrderStatus", header: "Top-up", render: (item) => <StatusBadge status={item.topupOrderStatus} /> },
  { key: "lastWebhookAt", header: "Webhook gần nhất", render: (item) => item.lastWebhookAt ? formatDate(item.lastWebhookAt) : "Chưa có" }
];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ query: "", status: "", provider: "" });

  useEffect(() => {
    apiFetch<{ items: AdminPayment[] }>("/api/admin/payments")
      .then((data) => setPayments(data.items))
      .catch((error: Error) => showError(error, "Không tải được danh sách thanh toán."));
  }, []);

  const statusOptions = useMemo(
    () => Array.from(new Set(payments.flatMap((item) => [item.providerStatus, item.topupOrderStatus]))).filter(Boolean).sort(),
    [payments]
  );
  const providerOptions = useMemo(
    () => Array.from(new Set(payments.map((item) => item.provider))).filter(Boolean).sort(),
    [payments]
  );
  const filteredPayments = useMemo(() => {
    const normalizedQuery = appliedFilters.query.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.providerOrderCode.toLowerCase().includes(normalizedQuery) ||
        item.providerPaymentLinkId.toLowerCase().includes(normalizedQuery) ||
        item.topupOrderId.toLowerCase().includes(normalizedQuery) ||
        item.userId.toLowerCase().includes(normalizedQuery) ||
        displayPaymentUser(item).toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        !appliedFilters.status ||
        item.providerStatus === appliedFilters.status ||
        item.topupOrderStatus === appliedFilters.status;
      const matchesProvider = !appliedFilters.provider || item.provider === appliedFilters.provider;
      return matchesQuery && matchesStatus && matchesProvider;
    });
  }, [appliedFilters, payments]);

  function applyFilters(event: React.FormEvent) {
    event.preventDefault();
    setAppliedFilters({ query, status: statusFilter, provider: providerFilter });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Top-up & thanh toán"
        title="Quản lý top-up và thanh toán"
        description="Theo dõi đơn nạp credit, xác minh PayOS và lịch sử callback."
      />
      <div className="grid grid-cols-2 gap-2 md:hidden">
        <CompactStat label="Chờ" value={String(payments.filter((item) => item.topupOrderStatus === "Pending").length)} />
        <CompactStat label="Đã trả" value={String(payments.filter((item) => item.providerStatus === "Paid").length)} />
        <CompactStat label="Lỗi" value={String(payments.filter((item) => item.providerStatus === "Failed").length)} />
        <CompactStat label="Đối soát" value={String(payments.filter((item) => !item.lastWebhookAt).length)} />
      </div>
      <div className="hidden gap-4 md:grid md:grid-cols-4">
        <Stat icon={Clock3} label="Đang chờ xác minh" tone="amber" value={String(payments.filter((item) => item.topupOrderStatus === "Pending").length)} />
        <Stat icon={CheckCircle2} label="Đã thanh toán" tone="emerald" value={String(payments.filter((item) => item.providerStatus === "Paid").length)} />
        <Stat icon={XCircle} label="Lỗi xác minh" tone="red" value={String(payments.filter((item) => item.providerStatus === "Failed").length)} />
        <Stat icon={Filter} label="Cần đối soát" tone="slate" value={String(payments.filter((item) => !item.lastWebhookAt).length)} />
      </div>

      <Card className="min-w-0">
        <CardHeader className="space-y-4">
          <CardTitle>Danh sách thanh toán PayOS</CardTitle>
          <form className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]" onSubmit={applyFilters}>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 text-muted-foreground" size={15} />
              <Input
                className="pl-9"
                placeholder="Tìm mã đơn, PayOS hoặc email..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">Trạng thái</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {displayStatus(status)}
                </option>
              ))}
            </Select>
            <Select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value)}>
              <option value="">Phương thức</option>
              {providerOptions.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </Select>
            <Button className="w-full md:w-auto" type="submit" variant="secondary">Lọc</Button>
          </form>
        </CardHeader>
        <CardContent>
          <BaseTable
            items={filteredPayments}
            columns={paymentColumns}
            getRowKey={(item) => item.id}
            emptyTitle={payments.length === 0 ? "Chưa có thanh toán" : "Không có thanh toán phù hợp"}
            emptyDetail={payments.length === 0 ? "Thanh toán PayOS sẽ xuất hiện sau khi user tạo yêu cầu nạp credit." : "Đổi từ khóa, trạng thái hoặc phương thức để xem thêm kết quả."}
            minWidthClassName="min-w-[860px]"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function displayPaymentUser(item: AdminPayment) {
  return item.userEmail || item.userId.slice(0, 8);
}

function CompactStat({ label, value }: { label: string; value: string }) {
  return <MetricCard title={label} value={value} />;
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
  return <MetricCard title={label} value={value} icon={<Icon size={18} />} tone={({ amber: "warning", emerald: "success", red: "danger", slate: "neutral" } as const)[tone]} />;
}
