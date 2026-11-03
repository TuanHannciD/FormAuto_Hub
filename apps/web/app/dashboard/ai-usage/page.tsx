"use client";

import { useEffect, useState } from "react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { MetricCard } from "@/components/metric-card";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { safeAiFailureMessage } from "../forms/_helpers";

// ── Types ──────────────────────────────────────────────────────────

type AiModeStats = {
  mode: string;
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
  errorMessage?: string | null;
};

type AiDailyUsage = {
  date: string;
  runs: number;
  creditsUsed: number;
};

type AiUsageStats = {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  totalCreditsUsed: number;
  totalPreviewsGenerated: number;
  modeBreakdown: AiModeStats[];
  recentRuns: AiRecentRun[];
  usageByDay: AiDailyUsage[];
};

// ── Helpers ────────────────────────────────────────────────────────

const modeLabels: Record<string, string> = {
  Option2: "AI mặc định",
  Option3: "AI tùy chỉnh",
  FullAi: "AI mặc định",
  CustomAi: "AI tùy chỉnh"
};

const percent = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "-";

const displayDuration = (ms: number | null) => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const modeColors: Record<string, string> = {
  Option2: "border-info-border bg-info-surface text-info",
  Option3: "border-primary-border bg-primary-soft text-primary",
  FullAi: "border-info-border bg-info-surface text-info",
  CustomAi: "border-primary-border bg-primary-soft text-primary"
};

const recentRunColumns: Array<BaseTableColumn<AiRecentRun>> = [
  {
    key: "createdAt",
    header: "Thời gian",
    render: (run) => formatDate(run.createdAt)
  },
  {
    key: "mode",
    header: "Chế độ",
    render: (run) => (
      <Badge tone={run.mode === "FullAi" || run.mode === "Option2" ? "info" : "warning"}>
        {modeLabels[run.mode] ?? run.mode}
      </Badge>
    )
  },
  {
    key: "status",
    header: "Kết quả",
    render: (run) => (
      <div className="space-y-1">
        {run.status === "Succeeded" ? <Badge tone="success">Thành công</Badge> : <StatusBadge status={run.status} />}
        <p className="hidden break-all text-xs text-muted-foreground md:block">Mã lượt AI: {run.id}</p>
        {run.status === "Failed" && <p className="max-w-sm text-xs leading-5 text-destructive">{safeAiFailureMessage(run.errorMessage)}</p>}
      </div>
    )
  },
  {
    key: "provider",
    hideOnMobile: true,
    className: "max-w-xs break-words [overflow-wrap:anywhere]",
    header: "Nhà cung cấp",
    render: (run) => (
      <span className="text-xs text-muted-foreground">{run.provider} / {run.model}</span>
    )
  },
  {
    key: "generatedCount",
    header: "Đã tạo",
    render: (run) => `${run.generatedCount}/${run.requestedCount}`
  },
  {
    key: "creditsUsed",
    header: "Credit",
    render: (run) => run.creditsUsed
  },
  {
    key: "durationMs",
    hideOnMobile: true,
    header: "Thời lượng",
    render: (run) => displayDuration(run.durationMs)
  }
];

// ── Page ───────────────────────────────────────────────────────────

export default function AiUsagePage() {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");
    apiFetch<AiUsageStats>("/api/dashboard/ai-usage", { signal: controller.signal })
      .then(setStats)
      .catch((fetchError) => {
        if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
        setError("Không tải được thống kê AI.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [reload]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thống kê AI" description="Đang tải..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-24 animate-pulse bg-muted/30 rounded-xl" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thống kê AI" description="Không thể tải số liệu." />
        <EmptyState title="Lỗi" detail={error} /><Button type="button" variant="secondary" onClick={() => setReload(value => value + 1)}>Thử lại</Button>
      </div>
    );
  }

  if (!stats || stats.totalRuns === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Thống kê AI"
          description="Xem số liệu sử dụng tạo câu trả lời AI của bạn."
        />
        <EmptyState
          title="Chưa có dữ liệu AI"
          detail="Bạn chưa tạo bản xem trước AI nào. Chọn AI mặc định hoặc AI tùy chỉnh trong Tự động hóa biểu mẫu."
        />
      </div>
    );
  }

  const successRate = percent(stats.successfulRuns, stats.totalRuns);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê AI"
        description="Theo dõi số liệu sử dụng tạo câu trả lời AI."
      />

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard title="Tổng lượt AI" value={String(stats.totalRuns)} />
        <MetricCard title="Tỉ lệ thành công" value={successRate} tone="success" />
        <MetricCard title="Credit đã dùng" value={String(stats.totalCreditsUsed)} tone="primary" />
        <MetricCard title="Bản xem trước đã tạo" value={String(stats.totalPreviewsGenerated)} tone="info" />
      </div>

      {/* ── Mode breakdown ── */}
      <div className="grid grid-cols-2 gap-3">
        {stats.modeBreakdown.map((mode) => {
          const colorClass = modeColors[mode.mode] ?? "border-border bg-surface-subtle text-foreground";
          const label = modeLabels[mode.mode] ?? mode.mode;
          return (
            <Card key={mode.mode} className={colorClass}>
              <CardContent className="p-3 sm:p-4">
                <h2 className="text-sm font-semibold">{label}</h2>
                <dl className="mt-2 space-y-1 text-sm tabular-nums">
                  <div className="flex flex-wrap justify-between gap-x-2"><dt>Lượt dùng</dt><dd className="font-bold">{mode.runs}</dd></div>
                  <div className="flex flex-wrap justify-between gap-x-2"><dt>Credit</dt><dd className="font-bold">{mode.creditsUsed}</dd></div>
                </dl>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Daily usage bar chart (simple CSS) ── */}
      {stats.usageByDay.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sử dụng theo ngày (30 ngày qua)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 overflow-x-auto pb-2">
              {stats.usageByDay.map((day) => {
                const maxRuns = Math.max(...stats.usageByDay.map((d) => d.runs), 1);
                const height = Math.round((day.runs / maxRuns) * 80);
                return (
                  <div
                    key={day.date}
                    className="group relative flex shrink-0 flex-col items-center"
                  >
                    <div className="text-xs tabular-nums text-muted-foreground">
                      {day.runs} lượt
                    </div>
                    <div
                      className="w-3 rounded-t bg-accent transition-all hover:bg-accent"
                      style={{ height: `${Math.max(height, 2)}px` }}
                    />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {day.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent runs table ── */}
      <Card>
        <CardHeader>
          <CardTitle>Lượt AI gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <BaseTable
          columns={recentRunColumns}
          items={stats.recentRuns}
          getRowKey={(r) => r.id}
          mobileFooter={run => <details className="border-t border-border text-xs">
            <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary">Chi tiết lượt AI</summary>
            <dl className="space-y-2 pb-2">
              <div><dt className="text-muted-foreground">Mã lượt AI</dt><dd className="break-all">{run.id}</dd></div>
              <div><dt className="text-muted-foreground">Nhà cung cấp / mô hình</dt><dd className="break-words [overflow-wrap:anywhere]">{run.provider} / {run.model}</dd></div>
              <div><dt className="text-muted-foreground">Thời lượng</dt><dd>{displayDuration(run.durationMs)}</dd></div>
            </dl>
          </details>}
          emptyTitle="Chưa có lượt AI"
          emptyDetail="Bạn chưa thực hiện tạo câu trả lời AI nào."
        />
        </CardContent>
      </Card>
    </div>
  );
}
