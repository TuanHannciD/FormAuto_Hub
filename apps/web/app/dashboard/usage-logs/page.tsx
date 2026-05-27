"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, KeyValueRow, MobileRecord, MobileRecordList, PageHeader, Select } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type UsageLog, type UsageLogPageResponse } from "@/lib/api";
import { displayAction, displayToolName } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

const generatedAnswersAction = "Xem lại câu trả lời được tạo";
const pageSize = 20;
const actionOptions = [
  { value: generatedAnswersAction, label: "Chỉ xem câu trả lời được tạo" },
  { value: "", label: "Tất cả thao tác" },
  { value: "AnalyzeForm", label: "Phân tích biểu mẫu" },
  { value: "SubmitResponses", label: "Gửi câu trả lời" }
];

export default function UsageLogsPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [action, setAction] = useState(generatedAnswersAction);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const queryPath = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize)
    });

    if (action) {
      params.set("action", action);
    }

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return `/api/usage-logs?${params.toString()}`;
  }, [action, page, search]);

  useEffect(() => {
    setIsLoading(true);
    setError("");
    apiFetch<UsageLogPageResponse>(queryPath)
      .then((data) => {
        setLogs(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      })
      .catch((fetchError) => {
        setLogs([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được lịch sử sử dụng.");
      })
      .finally(() => setIsLoading(false));
  }, [queryPath]);

  const creditsUsed = logs.reduce((total, log) => total + log.creditsUsed, 0);
  const failedInPage = logs.filter((log) => log.status === "Failed").length;

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function updateAction(nextAction: string) {
    setAction(nextAction);
    setPage(1);
  }

  function resetFilters() {
    setAction(generatedAnswersAction);
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Lịch sử sử dụng" description="Mặc định chỉ hiển thị thao tác xem câu trả lời được tạo, vì đây là nhóm thao tác thể hiện giao dịch credit." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Kết quả theo filter" value={String(totalItems)} />
        <Metric label="Credit trong trang" value={String(creditsUsed)} />
        <Metric label="Thất bại trong trang" value={String(failedInPage)} />
      </div>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Bảng lịch sử sử dụng</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Dữ liệu được tải theo từng trang và theo filter hiện tại.
            </p>
          </div>
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_16rem_auto_auto]" onSubmit={applyFilters}>
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                className="pl-9"
                placeholder="Tìm theo thao tác, mô tả, trạng thái..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
            <Select value={action} onChange={(event) => updateAction(event.target.value)}>
              {actionOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button type="submit">Tìm</Button>
            <Button type="button" variant="secondary" onClick={resetFilters}>Đặt lại</Button>
          </form>
        </CardHeader>
        <CardContent>
          {error ? (
            <EmptyState title="Không tải được lịch sử sử dụng" detail={error} />
          ) : isLoading ? (
            <EmptyState title="Đang tải lịch sử sử dụng" detail="Hệ thống chỉ tải dữ liệu cho trang hiện tại." />
          ) : logs.length === 0 ? (
            <EmptyState title="Không có kết quả phù hợp" detail="Thử đổi từ khóa tìm kiếm hoặc chọn lại loại thao tác." />
          ) : (
            <>
            <MobileRecordList>
              {logs.map((log) => (
                <MobileRecord key={log.id}>
                  <KeyValueRow label="Thời gian" value={formatDate(log.createdAt)} />
                  <KeyValueRow label="Công cụ" value={displayToolName(log.toolName)} />
                  <KeyValueRow label="Thao tác" value={displayAction(log.action)} />
                  <KeyValueRow label="Credit" value={log.creditsUsed} />
                  <KeyValueRow label="Kết quả" value={<StatusBadge status={log.status} />} />
                  <KeyValueRow label="Mô tả" value={log.description} />
                </MobileRecord>
              ))}
            </MobileRecordList>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Công cụ</th>
                    <th className="py-2">Thao tác</th>
                    <th className="py-2">Credit</th>
                    <th className="py-2">Kết quả</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr className="border-t border-border/70" key={log.id}>
                      <td className="py-3">{formatDate(log.createdAt)}</td>
                      <td className="py-3">{displayToolName(log.toolName)}</td>
                      <td className="py-3">{displayAction(log.action)}</td>
                      <td className="py-3">{log.creditsUsed}</td>
                      <td className="py-3"><StatusBadge status={log.status} /></td>
                      <td className="py-3">{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => Math.min(Math.max(1, totalPages), current + 1))}
            />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <div className="metric-accent mb-4 h-1 w-10 rounded-full" />
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-[28px] font-extrabold leading-none text-slate-950">{value}</p>
      </CardContent>
    </Card>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  onPrevious,
  onNext
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Trang {totalPages === 0 ? 0 : page}/{totalPages} · {totalItems} kết quả
      </span>
      <div className="flex gap-2">
        <Button type="button" variant="secondary" disabled={page <= 1} onClick={onPrevious}>
          Trước
        </Button>
        <Button type="button" variant="secondary" disabled={totalPages === 0 || page >= totalPages} onClick={onNext}>
          Sau
        </Button>
      </div>
    </div>
  );
}
