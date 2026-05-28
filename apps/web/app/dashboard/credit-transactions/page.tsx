"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { DropdownSelect } from "@/components/dropdown-select";
import { PaginationControls } from "@/components/pagination-controls";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, PageHeader } from "@/components/ui";
import { apiFetch, type CreditTransaction, type CreditTransactionPageResponse } from "@/lib/api";
import { displayCreditTransactionType } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

const pageSize = 20;
const typeOptions = [
  { value: "", label: "Tất cả loại" },
  { value: "TopupApproved", label: "Nạp credit đã duyệt" },
  { value: "CreditUsed", label: "Credit đã sử dụng" },
  { value: "InitialGrant", label: "Credit khởi tạo" }
];

const transactionColumns: Array<BaseTableColumn<CreditTransaction>> = [
  { key: "createdAt", header: "Thời gian", render: (transaction) => formatDate(transaction.createdAt) },
  { key: "type", header: "Loại", render: (transaction) => <Badge tone="info">{displayCreditTransactionType(transaction.type)}</Badge> },
  { key: "amount", header: "Số credit", render: (transaction) => transaction.amount },
  { key: "balanceAfter", header: "Số dư sau đó", render: (transaction) => transaction.balanceAfter },
  { key: "description", header: "Mô tả", render: (transaction) => transaction.description }
];

export default function CreditTransactionsPage() {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [type, setType] = useState("");
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

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (type) {
      params.set("type", type);
    }

    return `/api/credit-transactions?${params.toString()}`;
  }, [page, search, type]);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrentRequest = true;

    setIsLoading(true);
    setError("");
    apiFetch<CreditTransactionPageResponse>(queryPath, { signal: controller.signal })
      .then((data) => {
        if (!isCurrentRequest) {
          return;
        }

        setTransactions(data.items);
        setTotalItems(data.totalItems);
        setTotalPages(data.totalPages);
      })
      .catch((fetchError) => {
        if (!isCurrentRequest || (fetchError instanceof DOMException && fetchError.name === "AbortError")) {
          return;
        }

        setTransactions([]);
        setTotalItems(0);
        setTotalPages(0);
        setError(fetchError instanceof Error ? fetchError.message : "Không tải được giao dịch credit.");
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

  const creditsInPage = transactions.reduce((total, transaction) => total + transaction.amount, 0);

  function updateSearch(nextSearch: string) {
    setPage(1);
    setSearch(nextSearch.trim());
  }

  function updateType(nextType: string) {
    setType(nextType);
    setPage(1);
  }

  function resetFilters() {
    setType("");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Giao dịch credit" description="Lịch sử ghi nhận credit được nạp và credit đã sử dụng." />
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Kết quả theo filter" value={String(totalItems)} />
        <Metric label="Credit trong trang" value={String(creditsInPage)} />
        <Metric label="Credit mới nhất" value={transactions[0] ? String(transactions[0].amount) : "-"} />
      </div>
      <Card>
        <CardHeader className="gap-4">
          <div>
            <CardTitle>Sổ ghi credit</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Dữ liệu được tải theo từng trang và theo từ khóa hiện tại.
            </p>
          </div>
          <CreditTransactionFilters
            search={search}
            type={type}
            isRefreshing={isLoading && transactions.length > 0}
            onReset={resetFilters}
            onSearchChange={updateSearch}
            onTypeChange={updateType}
          />
        </CardHeader>
        <CardContent className="space-y-4">
          {error && transactions.length === 0 ? (
            <EmptyState title="Không tải được giao dịch credit" detail={error} />
          ) : isLoading && transactions.length === 0 ? (
            <EmptyState title="Đang tải giao dịch credit" detail="Hệ thống chỉ tải dữ liệu cho trang hiện tại." />
          ) : (
            <>
              {error && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {error}
                </div>
              )}
              <BaseTable
                items={transactions}
                columns={transactionColumns}
                getRowKey={(transaction) => transaction.id}
                emptyTitle="Không có kết quả phù hợp"
                emptyDetail="Thử đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc."
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

function CreditTransactionFilters({
  search,
  type,
  isRefreshing,
  onSearchChange,
  onTypeChange,
  onReset
}: {
  search: string;
  type: string;
  isRefreshing: boolean;
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
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
    <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto_auto]" onSubmit={applyFilters}>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          className="pl-9"
          placeholder="Tìm theo loại, mô tả, nguồn tham chiếu..."
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
        />
      </label>
      <DropdownSelect value={type} options={typeOptions} onChange={onTypeChange} />
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
