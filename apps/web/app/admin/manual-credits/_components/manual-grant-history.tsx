"use client";

import { useEffect, useState } from "react";
import { Eye, History, RefreshCw, Search, X } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { PaginationControls } from "@/components/pagination-controls";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, KeyValueRow } from "@/components/ui";
import { apiFetch, type ManualCreditHistoryItem, type ManualCreditHistoryResponse } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export function ManualGrantHistory({ refreshKey }: { refreshKey: number }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<ManualCreditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<ManualCreditHistoryItem | null>(null);

  useEffect(() => { setPage(1); setSearch(""); setQuery(""); }, [refreshKey]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(false);
    const params = new URLSearchParams({ page: String(page), pageSize: "10", search: query });
    apiFetch<ManualCreditHistoryResponse>(`/api/admin/credit-operations/manual-grants?${params}`)
      .then(result => { if (active) setData(result); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [query, page, reload, refreshKey]);

  function open(item: ManualCreditHistoryItem) { setSelected(item); }
  const columns: BaseTableColumn<ManualCreditHistoryItem>[] = [
    { key: "time", header: "Thời gian", render: item => formatDate(item.createdAt) },
    { key: "recipient", header: "Người nhận", render: item => <span className="block max-w-[220px] truncate" title={item.userEmail}>{item.userEmail || "Không còn thông tin tài khoản"}</span> },
    { key: "credits", header: "Credit cộng", render: item => <span className="font-bold text-success">+{item.credits}</span> },
    { key: "balance", header: "Số dư sau", render: item => `${item.balanceAfter} credit` },
    { key: "actor", header: "Người thực hiện", render: item => <span className="block max-w-[200px] truncate" title={item.adminEmail || undefined}>{item.adminEmail || "Chưa có dữ liệu"}</span> },
    { key: "reason", header: "Lý do", render: item => <span className="block max-w-[220px] truncate" title={item.reason}>{item.reason}</span> },
    { key: "detail", header: "Chi tiết", hideOnMobile: true, render: item => <Button type="button" size="icon" variant="secondary" aria-label="Xem chi tiết cộng credit" onClick={() => open(item)}><Eye size={16} /></Button> }
  ];
  return <>
    <Card className="min-w-0">
      <CardHeader><CardTitle className="flex items-center gap-2"><History size={18} className="text-primary" />Lịch sử cộng credit thủ công</CardTitle></CardHeader>
      <CardContent>
        <form className="mb-4 flex flex-col gap-2 sm:flex-row" onSubmit={event => { event.preventDefault(); setPage(1); setQuery(search.trim()); setReload(value => value + 1); }}>
          <Input aria-label="Tìm lịch sử cộng credit" className="min-w-0 flex-1" placeholder="Tìm email, người thực hiện hoặc lý do..." value={search} onChange={event => setSearch(event.target.value)} />
          <Button type="submit" variant="secondary"><Search size={16} />Tìm kiếm</Button>
          <Button type="button" variant="secondary" disabled={loading} aria-label="Làm mới lịch sử" onClick={() => setReload(value => value + 1)}><RefreshCw size={16} />Làm mới</Button>
        </form>
        <div aria-busy={loading}>
          {error ? <Alert>Không tải được lịch sử. Bấm “Làm mới” để thử lại.</Alert> : loading ? <p className="py-5 text-sm text-muted-foreground">Đang tải lịch sử cộng credit...</p> : <>
            <BaseTable items={data?.items ?? []} columns={columns} getRowKey={item => item.id} minWidthClassName="min-w-[1000px]"
              emptyTitle="Chưa có giao dịch cộng credit phù hợp" emptyDetail="Các khoản admin cộng trực tiếp sẽ được ghi tại đây."
              mobileFooter={item => <Button type="button" variant="secondary" className="w-full" onClick={() => open(item)}>Xem chi tiết cộng credit</Button>} />
            <PaginationControls page={data?.page ?? page} totalPages={data?.totalPages ?? 0} totalItems={data?.totalItems ?? 0}
              onPrevious={() => setPage(Math.max(1, (data?.page ?? page) - 1))} onNext={() => setPage((data?.page ?? page) + 1)} />
          </>}
        </div>
      </CardContent>
    </Card>
    <Dialog open={selected !== null} className="max-w-xl" onOpenChange={open => { if (!open) setSelected(null); }}>
      {selected && <DialogContent contentClassName="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="flex shrink-0 items-start justify-between gap-3"><div><DialogTitle>Chi tiết cộng credit</DialogTitle><DialogDescription>Giao dịch đã ghi vào số dư và sổ credit.</DialogDescription></div><DialogClose size="icon" aria-label="Đóng chi tiết"><X size={16} /></DialogClose></DialogHeader>
        <DialogBody className="min-h-0 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-success-border bg-success-surface p-4">
            <div><p className="text-xs text-success">Credit đã cộng</p><p className="text-2xl font-extrabold text-success">+{selected.credits}</p></div>
            <div className="text-right"><p className="text-xs text-muted-foreground">Số dư sau giao dịch</p><p className="font-bold">{selected.balanceAfter} credit</p></div>
          </div>
          <div className="space-y-2 text-sm">
            <KeyValueRow label="Người nhận" value={selected.userEmail || "Không còn thông tin tài khoản"} />
            <KeyValueRow label="Người thực hiện" value={selected.adminEmail || "Chưa có dữ liệu người thực hiện"} />
            <KeyValueRow label="Thời gian" value={formatDate(selected.createdAt)} />
          </div>
          <div><p className="mb-1 text-xs font-semibold text-muted-foreground">Lý do cộng credit</p><p className="whitespace-pre-wrap break-words rounded-xl bg-surface-subtle p-3 text-sm">{selected.reason}</p></div>
          <p className="break-all font-mono text-[11px] text-muted-foreground">Mã giao dịch: {selected.id}</p>
        </DialogBody>
        <DialogFooter className="shrink-0"><DialogClose>Đóng</DialogClose></DialogFooter>
      </DialogContent>}
    </Dialog>
  </>;
}
