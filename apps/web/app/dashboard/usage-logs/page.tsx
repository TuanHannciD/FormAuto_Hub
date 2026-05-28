"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { DropdownSelect } from "@/components/dropdown-select";
import { PaginationControls } from "@/components/pagination-controls";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
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

const columns: Array<BaseTableColumn<UsageLog>> = [
  { key: "createdAt", header: "Thời gian", render: (log) => formatDate(log.createdAt) },
  { key: "toolName", header: "Công cụ", render: (log) => displayToolName(log.toolName) },
  { key: "action", header: "Thao tác", render: (log) => displayAction(log.action) },
  { key: "creditsUsed", header: "Credit", render: (log) => log.creditsUsed },
  { key: "status", header: "Kết quả", render: (log) => <StatusBadge status={log.status} /> },
  { key: "description", header: "Mô tả", render: (log) => log.description }
];

export default function UsageLogsPage() {
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [action, setAction] = useState(generatedAnswersAction);
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
    const controller = new AbortController();
    let isCurrentRequest = true;

    setIsLoading(true);
    setError("");
    apiFetch<UsageLogPageResponse>(queryPath, { signal: controller.signal })
      .then((data) => {
        if (!isCurrentRequest) {
          return;
        }

        setLogs(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      })
      .catch((fetchError) => {
        if (!isCurrentRequest || (fetchError instanceof DOMException && fetchError.name === "AbortError")) {
          return;
        }

        setLogs([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được lịch sử sử dụng.");
      })
      .finally(() => {
        if (isCurrentRequest) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrentRequest = false;
      controller.abort();
    };
  }, [queryPath]);

  const creditsUsed = logs.reduce((total, log) => total + log.creditsUsed, 0);
  const failedInPage = logs.filter((log) => log.status === "Failed").length;

  function updateSearch(nextSearch: string) {
    setPage(1);
    setSearch(nextSearch.trim());
  }

  function updateAction(nextAction: string) {
    setAction(nextAction);
    setPage(1);
  }

  function resetFilters() {
    setAction(generatedAnswersAction);
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
          <UsageLogFilters
            action={action}
            search={search}
            isRefreshing={isLoading && logs.length > 0}
            onActionChange={updateAction}
            onReset={resetFilters}
            onSearchChange={updateSearch}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {error && logs.length === 0 ? (
            <EmptyState title="Không tải được lịch sử sử dụng" detail={error} />
          ) : isLoading && logs.length === 0 ? (
            <EmptyState title="Đang tải lịch sử sử dụng" detail="Hệ thống chỉ tải dữ liệu cho trang hiện tại." />
          ) : (
            <>
            {error && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </div>
            )}
            <BaseTable
              items={logs}
              columns={columns}
              getRowKey={(log) => log.id}
              emptyTitle="Không có kết quả phù hợp"
              emptyDetail="Thử đổi từ khóa tìm kiếm hoặc chọn lại loại thao tác."
            />
            <PaginationControls
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

function UsageLogFilters({
  action,
  search,
  isRefreshing,
  onActionChange,
  onSearchChange,
  onReset
}: {
  action: string;
  search: string;
  isRefreshing: boolean;
  onActionChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}) {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearchInput = useDebouncedValue(searchInput.trim(), 420);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    if (debouncedSearchInput !== search) {
      onSearchChange(debouncedSearchInput);
    }
  }, [debouncedSearchInput, onSearchChange, search]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchChange(searchInput.trim());
  }

  function resetFilters() {
    setSearchInput("");
    onReset();
  }

  return (
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
      <DropdownSelect value={action} options={actionOptions} onChange={onActionChange} />
      <Button type="submit">{isRefreshing ? "Đang lọc..." : "Tìm"}</Button>
      <Button type="button" variant="secondary" onClick={resetFilters}>Đặt lại</Button>
    </form>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedValue(value), delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [delayMs, value]);

  return debouncedValue;
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
