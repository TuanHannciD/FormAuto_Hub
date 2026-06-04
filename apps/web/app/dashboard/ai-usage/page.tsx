"use client";

import { useEffect, useState } from "react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { Badge, Card, CardContent, CardHeader, CardTitle, EmptyState, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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
  FullAi: "Option 2 — AI mặc định",
  CustomAi: "Option 3 — AI tùy chỉnh"
};

const percent = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "-";

const displayDuration = (ms: number | null) => {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const modeColors: Record<string, string> = {
  FullAi: "border-cyan-400 bg-cyan-50 text-cyan-900",
  CustomAi: "border-violet-400 bg-violet-50 text-violet-900"
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
      <Badge tone={run.mode === "FullAi" ? "info" : "warning"}>
        {run.mode === "FullAi" ? "Option 2" : "Option 3"}
      </Badge>
    )
  },
  {
    key: "status",
    header: "Kết quả",
    render: (run) => <StatusBadge status={run.status} />
  },
  {
    key: "provider",
    header: "Provider",
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
    header: "Thời gian",
    render: (run) => displayDuration(run.durationMs)
  }
];

// ── Page ───────────────────────────────────────────────────────────

export default function AiUsagePage() {
  const [stats, setStats] = useState<AiUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Thống kê AI" description="Đang tải..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="h-24 animate-pulse bg-muted/30 rounded-lg" />
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
        <EmptyState title="Lỗi" detail={error} />
      </div>
    );
  }

  if (!stats || stats.totalRuns === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Thống kê AI"
          description="Xem số liệu sử dụng AI generation của bạn."
        />
        <EmptyState
          title="Chưa có dữ liệu AI"
          detail="Bạn chưa thực hiện lần tạo AI preview nào. Hãy vào Tự động hóa biểu mẫu và chọn Option 2 hoặc Option 3."
        />
      </div>
    );
  }

  const successRate = percent(stats.successfulRuns, stats.totalRuns);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thống kê AI"
        description="Theo dõi số liệu sử dụng AI generation."
      />

      {/* ── Metric cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Tổng lượt AI" value={String(stats.totalRuns)} />
        <MetricCard title="Tỉ lệ thành công" value={successRate} tone="green" />
        <MetricCard title="Credit đã dùng" value={String(stats.totalCreditsUsed)} tone="violet" />
        <MetricCard title="Previews đã tạo" value={String(stats.totalPreviewsGenerated)} tone="blue" />
      </div>

      {/* ── Mode breakdown ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.modeBreakdown.map((mode) => {
          const colorClass = modeColors[mode.mode] ?? "border-gray-300 bg-gray-50 text-gray-900";
          const label = modeLabels[mode.mode] ?? mode.mode;
          return (
            <Card key={mode.mode}>
              <CardHeader>
                <CardTitle>{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`rounded-lg border p-4 ${colorClass}`}>
                  <p className="text-sm font-medium">Số lần dùng: <span className="font-bold">{mode.runs}</span></p>
                  <p className="mt-1 text-sm font-medium">Credit tiêu hao: <span className="font-bold">{mode.creditsUsed}</span></p>
                </div>
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
                    <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                      {day.runs} runs
                    </div>
                    <div
                      className="w-3 rounded-t bg-cyan-400 transition-all hover:bg-cyan-500"
                      style={{ height: `${Math.max(height, 2)}px` }}
                    />
                    <div className="mt-1 text-[10px] text-muted-foreground">
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
          emptyTitle="Chưa có lượt AI"
          emptyDetail="Bạn chưa thực hiện AI generation nào."
        />
        </CardContent>
      </Card>
    </div>
  );
}

// ── Metric card sub-component ──

function MetricCard({
  title,
  value,
  tone = "neutral"
}: {
  title: string;
  value: string;
  tone?: "neutral" | "green" | "violet" | "blue" | "red";
}) {
  const borderColors: Record<string, string> = {
    neutral: "border-border/70",
    green: "border-green-300",
    violet: "border-violet-300",
    blue: "border-cyan-300",
    red: "border-red-300"
  };

  const textColors: Record<string, string> = {
    neutral: "text-foreground",
    green: "text-green-700",
    violet: "text-violet-700",
    blue: "text-cyan-700",
    red: "text-red-700"
  };

  return (
    <Card className={borderColors[tone]}>
      <CardContent className="pt-6">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className={`mt-1 text-2xl font-bold ${textColors[tone]}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
