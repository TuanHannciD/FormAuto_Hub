"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Alert, Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, Button, Input, Select } from "@/components/ui";
import { PaginationControls } from "@/components/pagination-controls";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────

type AiModeStats = {
  mode: string;
  runs: number;
  creditsUsed: number;
};

type AiProviderPerf = {
  provider: string;
  model: string;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
};

type AiTopUser = {
  userId: string;
  email: string;
  runs: number;
  creditsUsed: number;
};

type AiRecentRun = {
  id: string;
  mode: string;
  status: string;
  provider: string;
  model: string;
  requestedCount: number;
  generatedCount: number;
  creditsUsed: number;
  durationMs: number | null;
  createdAt: string;
  projectName: string | null;
};

type AiDailyUsage = {
  date: string;
  runs: number;
  creditsUsed: number;
};

type AdminAiUsageStats = {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalCreditsUsed: number;
  totalPreviewsGenerated: number;
  totalUsers: number;
  modeBreakdown: AiModeStats[];
  providerPerformance: AiProviderPerf[];
  topUsers: AiTopUser[];
  recentRuns: AiRecentRun[];
  usageByDay: AiDailyUsage[];
};

type PagedRuns = {
  items: AiRecentRun[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

type RunFilters = {
  status: string;
  mode: string;
  provider: string;
  model: string;
  fromDate: string;
  toDate: string;
};

// ── Helpers ────────────────────────────────────────────────────────

const percent = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "-";

const displayDuration = (ms: number | null) => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const modeLabels: Record<string, string> = {
  Option2: "AI mặc định",
  Option3: "AI tùy chỉnh",
  FullAi: "AI mặc định",
  CustomAi: "AI tùy chỉnh"
};

const perfColumns: Array<BaseTableColumn<AiProviderPerf>> = [
  { key: "provider", header: "Nhà cung cấp", render: (p) => p.provider },
  { key: "model", header: "Model", render: (p) => <span className="block max-w-[260px] [overflow-wrap:anywhere]">{p.model}</span> },
  {
    key: "successfulRuns",
    header: "Thành công",
    render: (p) => <span className="text-success font-semibold">{p.successfulRuns}</span>
  },
  {
    key: "failedRuns",
    header: "Thất bại",
    render: (p) => <span className={p.failedRuns > 0 ? "text-destructive font-semibold" : ""}>{p.failedRuns}</span>
  },
  { key: "avgDurationMs", header: "Thời lượng TB", render: (p) => displayDuration(Math.round(p.avgDurationMs)) }
];

const topUserColumns: Array<BaseTableColumn<AiTopUser>> = [
  { key: "email", header: "Email", render: (u) => <span className="block max-w-[260px] break-all">{u.email}</span> },
  { key: "runs", header: "Lượt AI", render: (u) => u.runs },
  { key: "creditsUsed", header: "Credit dùng", render: (u) => u.creditsUsed }
];

const recentRunColumns: Array<BaseTableColumn<AiRecentRun>> = [
  { key: "createdAt", header: "Thời gian", render: (r) => formatDate(r.createdAt) },
  {
    key: "mode",
    header: "Chế độ",
    render: (r) => <Badge tone={r.mode === "FullAi" || r.mode === "Option2" ? "info" : "warning"}>{modeLabels[r.mode] ?? r.mode}</Badge>
  },
  { key: "status", header: "Kết quả", render: (r) => r.status === "Succeeded" ? <Badge tone="success">Thành công</Badge> : <StatusBadge status={r.status} /> },
  { key: "provider", hideOnMobile: true, header: "Nhà cung cấp", render: (r) => <span className="block max-w-[260px] text-xs text-muted-foreground [overflow-wrap:anywhere]">{r.provider} / {r.model}</span> },
  {
    key: "generatedCount",
    header: "Đã tạo",
    render: (r) => `${r.generatedCount}/${r.requestedCount}`
  },
  { key: "creditsUsed", header: "Credit", render: (r) => r.creditsUsed },
  { key: "durationMs", hideOnMobile: true, header: "Thời lượng", render: (r) => displayDuration(r.durationMs) }
];

// ── Page ───────────────────────────────────────────────────────────

export default function AdminAiUsagePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [stats, setStats] = useState<AdminAiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState(false);
  const [reload, setReload] = useState(0);

  // Paged runs state
  const [pagedRuns, setPagedRuns] = useState<PagedRuns | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [runsError, setRunsError] = useState(false);
  const [filters, setFilters] = useState<RunFilters>({
    status: "", mode: "", provider: "", model: "", fromDate: "", toDate: ""
  });
  const [appliedFilters, setAppliedFilters] = useState<RunFilters>(filters);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const abortRef = useRef<AbortController | null>(null);

  // Fetch summary stats
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setStatsError(false);
    apiFetch<AdminAiUsageStats>("/api/admin/ai-usage", { signal: controller.signal })
      .then(setStats)
      .catch(() => { if (!controller.signal.aborted) setStatsError(true); })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reload]);

  // Fetch paged runs
  const fetchRuns = useCallback(async (p: number, f: RunFilters) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunsLoading(true);
    setRunsError(false);
    const params = new URLSearchParams();
    params.set("page", String(p));
    params.set("pageSize", String(pageSize));
    if (f.status) params.set("status", f.status);
    if (f.mode) params.set("mode", f.mode);
    if (f.provider) params.set("provider", f.provider);
    if (f.model) params.set("model", f.model);
    if (f.fromDate) params.set("fromDate", f.fromDate);
    if (f.toDate) params.set("toDate", f.toDate);

    try {
      const result = await apiFetch<PagedRuns>(`/api/admin/ai-usage/runs?${params.toString()}`, { signal: controller.signal });
      if (!controller.signal.aborted) setPagedRuns(result);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (!controller.signal.aborted) setRunsError(true);
    } finally {
      if (!controller.signal.aborted) setRunsLoading(false);
    }
  }, []);

  // Draft fields only affect requests after applying the filter.
  useEffect(() => {
    if (activeTab === "history") {
      fetchRuns(page, appliedFilters);
    }
    return () => abortRef.current?.abort();
  }, [activeTab, page, appliedFilters, fetchRuns]);

  const applyFilters = () => {
    setPage(1);
    setAppliedFilters({ ...filters });
  };

  const resetFilters = () => {
    const cleared: RunFilters = { status: "", mode: "", provider: "", model: "", fromDate: "", toDate: "" };
    setFilters(cleared);
    setPage(1);
    setAppliedFilters(cleared);
  };

  const tabs = [
    { id: "overview" as const, label: "Tổng quan" },
    { id: "history" as const, label: "Lịch sử" }
  ];

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <PageHeader title="Thống kê AI" description="Đang tải..." />
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="h-24 animate-pulse rounded-2xl bg-muted/30" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (statsError) {
    return <div className="space-y-4">
      <PageHeader eyebrow="Admin / Thống kê AI" title="Thống kê AI" description="Xem số liệu tạo câu trả lời AI toàn hệ thống." />
      <Alert className="space-y-3"><p>Không tải được thống kê AI.</p><Button type="button" variant="secondary" onClick={() => setReload(value => value + 1)}>Thử lại</Button></Alert>
    </div>;
  }

  if (!stats || stats.totalRuns === 0) {
    return (
      <div className="space-y-4">
        <PageHeader eyebrow="Admin / Thống kê AI" title="Thống kê AI" description="Xem số liệu tạo câu trả lời AI toàn hệ thống." />
        <EmptyState title="Chưa có dữ liệu AI" detail="Chưa có người dùng nào thực hiện tạo câu trả lời AI." />
      </div>
    );
  }

  const successRate = percent(stats.successfulRuns, stats.totalRuns);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Admin / Thống kê AI"
        title="Thống kê AI"
        description="Số liệu tạo câu trả lời AI toàn hệ thống."
      />

      {/* Tabs */}
      <div className="inline-flex flex-wrap gap-1 rounded-2xl border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
            className={
              activeTab === tab.id
                ? "min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-10"
                : "min-h-11 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:min-h-10"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
            <MetricCard title="Tổng lượt AI" value={String(stats.totalRuns)} />
            <MetricCard title="Tỉ lệ thành công" value={successRate} tone="success" />
            <MetricCard title="Credit đã dùng" value={String(stats.totalCreditsUsed)} tone="primary" />
            <MetricCard title="Bản xem trước đã tạo" value={String(stats.totalPreviewsGenerated)} tone="info" />
            <MetricCard title="Người dùng" value={String(stats.totalUsers)} tone="neutral" />
          </div>

          {/* Mode breakdown */}
          <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {stats.modeBreakdown.map((m) => {
              const label = modeLabels[m.mode] ?? m.mode;
              return (
                <section key={m.mode} className="border-b border-border py-2 text-sm">
                  <h2 className="font-semibold">{label}</h2>
                  <p className="mt-1 text-muted-foreground"><strong className="text-foreground">{m.runs}</strong> lượt · <strong className="text-foreground">{m.creditsUsed}</strong> credit</p>
                </section>
              );
            })}
          </div>

          {/* Provider performance */}
          <Card className="min-w-0">
            <CardHeader><CardTitle>Hiệu suất nhà cung cấp</CardTitle></CardHeader>
            <CardContent>
              <BaseTable columns={perfColumns} items={stats.providerPerformance} getRowKey={(p) => p.provider + p.model} emptyTitle="Chưa có provider" emptyDetail="Không có dữ liệu provider." />
            </CardContent>
          </Card>

          {/* Top users */}
          <Card className="min-w-0">
            <CardHeader><CardTitle>Người dùng nhiều nhất</CardTitle></CardHeader>
            <CardContent>
              <BaseTable columns={topUserColumns} items={stats.topUsers} getRowKey={(u) => u.userId} emptyTitle="Chưa có người dùng" emptyDetail="Không có dữ liệu người dùng." />
            </CardContent>
          </Card>

          {/* Daily usage bar chart */}
          {stats.usageByDay.length > 0 && (
            <Card className="min-w-0">
              <CardHeader><CardTitle>Sử dụng theo ngày (30 ngày qua)</CardTitle></CardHeader>
              <CardContent>
                <div role="region" aria-label="Biểu đồ sử dụng AI theo ngày" tabIndex={0} className="flex items-end gap-1 overflow-x-auto rounded-lg pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  {stats.usageByDay.map((day) => {
                    const maxRuns = Math.max(...stats.usageByDay.map((d) => d.runs), 1);
                    const height = Math.round((day.runs / maxRuns) * 80);
                    return (
                      <div key={day.date} className="group relative flex shrink-0 flex-col items-center">
                        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.runs} lượt
                        </div>
                        <div className="w-3 rounded-t bg-accent transition-all hover:bg-accent" style={{ height: `${Math.max(height, 2)}px` }} />
                        <div className="mt-1 text-[10px] text-muted-foreground">{day.date.slice(5)}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === "history" && (
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Lịch sử tạo câu trả lời AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-status" className="text-xs text-muted-foreground">Trạng thái</label>
                <Select
                  id="ai-run-status"
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="min-w-0"
                >
                  <option value="">Tất cả</option>
                  <option value="Succeeded">Thành công</option>
                  <option value="Failed">Thất bại</option>
                  <option value="Partial">Một phần</option>
                  <option value="Running">Đang chạy</option>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-mode" className="text-xs text-muted-foreground">Chế độ</label>
                <Select
                  id="ai-run-mode"
                  value={filters.mode}
                  onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value }))}
                  className="min-w-0"
                >
                  <option value="">Tất cả</option>
                  <option value="Option2">AI mặc định</option>
                  <option value="Option3">AI tùy chỉnh</option>
                </Select>
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-provider" className="text-xs text-muted-foreground">Provider</label>
                <Input
                  id="ai-run-provider"
                  value={filters.provider}
                  onChange={(e) => setFilters((prev) => ({ ...prev, provider: e.target.value }))}
                  placeholder="VD: Deepseek"
                  className="min-w-0"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-model" className="text-xs text-muted-foreground">Model</label>
                <Input
                  id="ai-run-model"
                  value={filters.model}
                  onChange={(e) => setFilters((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="VD: deepseek-v4"
                  className="min-w-0"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-from" className="text-xs text-muted-foreground">Từ ngày</label>
                <Input
                  id="ai-run-from"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="min-w-0"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="ai-run-to" className="text-xs text-muted-foreground">Đến ngày</label>
                <Input
                  id="ai-run-to"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="min-w-0"
                />
              </div>
              <div className="col-span-2 flex items-end gap-2 lg:col-span-3 xl:col-span-2">
                <Button type="button" onClick={applyFilters} disabled={runsLoading}>
                  {runsLoading ? "Đang tải..." : "Lọc"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>

            {/* Runs table */}
            {runsError ? <Alert>Không tải được lịch sử AI. Bấm “Lọc” để thử lại.</Alert> : runsLoading ? (
              <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                Đang tải dữ liệu...
              </div>
            ) : pagedRuns ? (
              <>
                <BaseTable
                  columns={recentRunColumns}
                  items={pagedRuns.items}
                  getRowKey={(r) => r.id}
                  emptyTitle="Không tìm thấy"
                  emptyDetail="Không có lượt AI nào phù hợp với bộ lọc."
                  mobileFooter={run => <details className="border-t border-border pt-2 text-xs">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary">Chi tiết lượt AI</summary>
                    <p className="pb-2 [overflow-wrap:anywhere]">{run.provider} / {run.model}</p>
                    <p className="pb-2">Thời lượng: {displayDuration(run.durationMs)}</p>
                  </details>}
                />
                <PaginationControls
                  page={pagedRuns.page}
                  totalPages={pagedRuns.totalPages}
                  totalItems={pagedRuns.totalItems}
                  onPrevious={() => setPage((p) => Math.max(1, p - 1))}
                  onNext={() => setPage((p) => Math.min(pagedRuns.totalPages, p + 1))}
                />
              </>
            ) : (
              <EmptyState title="Không có dữ liệu" detail="Chưa có lượt tạo câu trả lời AI nào." />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
