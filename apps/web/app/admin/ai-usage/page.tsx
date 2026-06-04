"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader, Button, Input, Select } from "@/components/ui";
import { PaginationControls } from "@/components/pagination-controls";
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
  FullAi: "Option 2 — AI mặc định",
  CustomAi: "Option 3 — AI tùy chỉnh"
};

const perfColumns: Array<BaseTableColumn<AiProviderPerf>> = [
  { key: "provider", header: "Provider", render: (p) => p.provider },
  { key: "model", header: "Model", render: (p) => p.model },
  {
    key: "successfulRuns",
    header: "Thành công",
    render: (p) => <span className="text-green-600 font-semibold">{p.successfulRuns}</span>
  },
  {
    key: "failedRuns",
    header: "Thất bại",
    render: (p) => <span className={p.failedRuns > 0 ? "text-red-600 font-semibold" : ""}>{p.failedRuns}</span>
  },
  { key: "avgDurationMs", header: "TB thời gian", render: (p) => displayDuration(Math.round(p.avgDurationMs)) }
];

const topUserColumns: Array<BaseTableColumn<AiTopUser>> = [
  { key: "email", header: "Email", render: (u) => u.email },
  { key: "runs", header: "Lượt AI", render: (u) => u.runs },
  { key: "creditsUsed", header: "Credit dùng", render: (u) => u.creditsUsed }
];

const recentRunColumns: Array<BaseTableColumn<AiRecentRun>> = [
  { key: "createdAt", header: "Thời gian", render: (r) => formatDate(r.createdAt) },
  {
    key: "mode",
    header: "Chế độ",
    render: (r) => <Badge tone={r.mode === "FullAi" ? "info" : "warning"}>{r.mode === "FullAi" ? "Option 2" : "Option 3"}</Badge>
  },
  { key: "status", header: "Kết quả", render: (r) => <StatusBadge status={r.status} /> },
  { key: "provider", header: "Provider", render: (r) => <span className="text-xs text-muted-foreground">{r.provider} / {r.model}</span> },
  {
    key: "generatedCount",
    header: "Đã tạo",
    render: (r) => `${r.generatedCount}/${r.requestedCount}`
  },
  { key: "creditsUsed", header: "Credit", render: (r) => r.creditsUsed },
  { key: "durationMs", header: "Thời gian", render: (r) => displayDuration(r.durationMs) }
];

// ── Page ───────────────────────────────────────────────────────────

export default function AdminAiUsagePage() {
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  const [stats, setStats] = useState<AdminAiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Paged runs state
  const [pagedRuns, setPagedRuns] = useState<PagedRuns | null>(null);
  const [runsLoading, setRunsLoading] = useState(false);
  const [filters, setFilters] = useState<RunFilters>({
    status: "", mode: "", provider: "", model: "", fromDate: "", toDate: ""
  });
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const abortRef = useRef<AbortController | null>(null);

  // Fetch summary stats
  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    apiFetch<AdminAiUsageStats>("/api/admin/ai-usage", { signal: controller.signal })
      .then(setStats)
      .catch(() => {})
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  // Fetch paged runs
  const fetchRuns = useCallback(async (p: number, f: RunFilters) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunsLoading(true);
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
    } finally {
      if (!controller.signal.aborted) setRunsLoading(false);
    }
  }, []);

  // Load runs when tab switches to history or filters/page change
  useEffect(() => {
    if (activeTab === "history") {
      fetchRuns(page, filters);
    }
  }, [activeTab, page, filters, fetchRuns]);

  const applyFilters = () => {
    setPage(1);
    fetchRuns(1, filters);
  };

  const resetFilters = () => {
    const cleared: RunFilters = { status: "", mode: "", provider: "", model: "", fromDate: "", toDate: "" };
    setFilters(cleared);
    setPage(1);
    fetchRuns(1, cleared);
  };

  const tabs = [
    { id: "overview" as const, label: "Tổng quan" },
    { id: "history" as const, label: "Lịch sử" }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thống kê AI" description="Đang tải..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="h-24 animate-pulse bg-muted/30 rounded-lg" /></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats || stats.totalRuns === 0) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Admin / Thống kê AI" title="Thống kê AI" description="Xem số liệu AI generation toàn hệ thống." />
        <EmptyState title="Chưa có dữ liệu AI" detail="Chưa có người dùng nào thực hiện AI generation." />
      </div>
    );
  }

  const successRate = percent(stats.successfulRuns, stats.totalRuns);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin / Thống kê AI"
        title="Thống kê AI"
        description="Số liệu AI generation toàn hệ thống."
      />

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border/70">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id
                ? "whitespace-nowrap border-b-2 border-primary pb-3 text-sm font-semibold text-primary transition-colors"
                : "whitespace-nowrap border-b-2 border-transparent pb-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <MetricCard title="Tổng lượt AI" value={String(stats.totalRuns)} />
            <MetricCard title="Tỉ lệ thành công" value={successRate} tone="green" />
            <MetricCard title="Credit đã dùng" value={String(stats.totalCreditsUsed)} tone="violet" />
            <MetricCard title="Previews đã tạo" value={String(stats.totalPreviewsGenerated)} tone="blue" />
            <MetricCard title="Người dùng" value={String(stats.totalUsers)} tone="neutral" />
          </div>

          {/* Mode breakdown */}
          <div className="grid gap-4 sm:grid-cols-2">
            {stats.modeBreakdown.map((m) => {
              const label = modeLabels[m.mode] ?? m.mode;
              return (
                <Card key={m.mode}>
                  <CardHeader><CardTitle>{label}</CardTitle></CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    <p>Số lần dùng: <strong>{m.runs}</strong></p>
                    <p>Credit tiêu hao: <strong>{m.creditsUsed}</strong></p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Provider performance */}
          <Card>
            <CardHeader><CardTitle>Hiệu suất provider</CardTitle></CardHeader>
            <CardContent>
              <BaseTable columns={perfColumns} items={stats.providerPerformance} getRowKey={(p) => p.provider + p.model} emptyTitle="Chưa có provider" emptyDetail="Không có dữ liệu provider." />
            </CardContent>
          </Card>

          {/* Top users */}
          <Card>
            <CardHeader><CardTitle>Người dùng nhiều nhất</CardTitle></CardHeader>
            <CardContent>
              <BaseTable columns={topUserColumns} items={stats.topUsers} getRowKey={(u) => u.userId} emptyTitle="Chưa có người dùng" emptyDetail="Không có dữ liệu người dùng." />
            </CardContent>
          </Card>

          {/* Daily usage bar chart */}
          {stats.usageByDay.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Sử dụng theo ngày (30 ngày qua)</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-end gap-1 overflow-x-auto pb-2">
                  {stats.usageByDay.map((day) => {
                    const maxRuns = Math.max(...stats.usageByDay.map((d) => d.runs), 1);
                    const height = Math.round((day.runs / maxRuns) * 80);
                    return (
                      <div key={day.date} className="group relative flex shrink-0 flex-col items-center">
                        <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.runs} runs
                        </div>
                        <div className="w-3 rounded-t bg-cyan-400 transition-all hover:bg-cyan-500" style={{ height: `${Math.max(height, 2)}px` }} />
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
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử AI generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Trạng thái</label>
                <Select
                  value={filters.status}
                  onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="min-w-[140px]"
                >
                  <option value="">Tất cả</option>
                  <option value="Succeeded">Thành công</option>
                  <option value="Failed">Thất bại</option>
                  <option value="Partial">Một phần</option>
                  <option value="Running">Đang chạy</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Chế độ</label>
                <Select
                  value={filters.mode}
                  onChange={(e) => setFilters((prev) => ({ ...prev, mode: e.target.value }))}
                  className="min-w-[140px]"
                >
                  <option value="">Tất cả</option>
                  <option value="Option2">Option 2</option>
                  <option value="Option3">Option 3</option>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Provider</label>
                <Input
                  value={filters.provider}
                  onChange={(e) => setFilters((prev) => ({ ...prev, provider: e.target.value }))}
                  placeholder="VD: Deepseek"
                  className="min-w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Model</label>
                <Input
                  value={filters.model}
                  onChange={(e) => setFilters((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="VD: deepseek-v4"
                  className="min-w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Từ ngày</label>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="min-w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Đến ngày</label>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="min-w-[160px]"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="button" onClick={applyFilters} disabled={runsLoading}>
                  {runsLoading ? "Đang tải..." : "Lọc"}
                </Button>
                <Button type="button" variant="secondary" onClick={resetFilters}>
                  Xóa bộ lọc
                </Button>
              </div>
            </div>

            {/* Runs table */}
            {runsLoading && !pagedRuns ? (
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
              <EmptyState title="Không có dữ liệu" detail="Chưa có lượt AI generation nào." />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Metric card ──

function MetricCard({ title, value, tone = "neutral" }: { title: string; value: string; tone?: string }) {
  const borderColors: Record<string, string> = { neutral: "border-border/70", green: "border-green-300", violet: "border-violet-300", blue: "border-cyan-300" };
  const textColors: Record<string, string> = { neutral: "text-foreground", green: "text-green-700", violet: "text-violet-700", blue: "text-cyan-700" };
  return (
    <Card className={borderColors[tone] ?? borderColors.neutral}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={`mt-1 text-2xl font-bold ${textColors[tone] ?? textColors.neutral}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
