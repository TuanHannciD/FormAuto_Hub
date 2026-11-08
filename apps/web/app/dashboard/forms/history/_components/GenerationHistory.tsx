"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { apiFetch, type GenerationHistoryDetail, type GenerationHistoryPage, type GenerationHistoryRun, type SubmissionJob } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { PaginationControls } from "@/components/pagination-controls";
import { Alert, Button, Card, CardContent, Dialog, DialogBody, DialogClose, DialogContent, DialogHeader, DialogTitle, PageHeader } from "@/components/ui";
import { buttonStyles } from "@/components/ui-styles";
import { formatDate } from "@/lib/utils";
import { HistoryRunDetail, JobResult } from "./HistoryRunDetail";
import { readSubmissionJob } from "../../_helpers";
import { historyError, readHistoryCommands, removeHistoryCommand, subscribeHistoryCommands, terminalJob, type HistoryCommand } from "./history-command";

export const modeLabel = (mode: string) => mode === "rules" ? "Quy tắc" : mode === "ai-custom" ? "AI tùy chỉnh" : "AI mặc định";

export function GenerationHistory() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<GenerationHistoryPage | null>(null);
  const [detail, setDetail] = useState<GenerationHistoryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<HistoryCommand | null>(null);
  const [commands, setCommands] = useState<HistoryCommand[]>([]);
  const [job, setJob] = useState<SubmissionJob | null>(null);
  const [scope] = useState(() => ({ epoch: 0, request: 0 }));
  const load = useCallback(async () => {
    const current = ++scope.request; const owner = getStoredSession()?.userId;
    setLoading(true); setError(""); setDetail(null); setData(null);
    try {
      const value = await apiFetch<GenerationHistoryPage>(`/api/generation-history?page=${page}&pageSize=10`);
      if (current === scope.request && getStoredSession()?.userId === owner) setData(value);
    } catch (e) { if (current === scope.request) setError(historyError(e)); }
    finally { if (current === scope.request) setLoading(false); }
  }, [page, scope]);
  useEffect(() => { void load(); return () => { scope.request++; scope.epoch++; }; }, [load, scope]);
  useEffect(() => {
    const sync = () => {
      const owner = getStoredSession()?.userId;
      const next = owner ? readHistoryCommands(owner) : [];
      setCommands(next);
      setPending(current => next.find(value => value.commandId === current?.commandId) ?? next[0] ?? null);
    };
    sync();
    return subscribeHistoryCommands(sync);
  }, []);

  async function open(run: GenerationHistoryRun) {
    const current = ++scope.request; setDetail(null); setError(""); setLoading(true);
    try { const value = await apiFetch<GenerationHistoryDetail>(`/api/generation-history/${run.batchId}`); if (current === scope.request) setDetail(value); }
    catch (e) { if (current === scope.request) setError(historyError(e)); }
    finally { if (current === scope.request) setLoading(false); }
  }
  async function recover(command: HistoryCommand) {
    if (loading) return; const stamp = scope.epoch; setPending(command); setLoading(true); setError("");
    try {
      const raw = await apiFetch<unknown>(`/api/projects/${command.projectId}/submissions/jobs/${command.commandId}`);
      const value = readSubmissionJob(raw, { id: command.commandId, projectId: command.projectId });
      if (!value) throw new Error("Invalid job status identity");
      if (stamp !== scope.epoch) return;
      setJob(value);
      if (terminalJob(value)) removeHistoryCommand(command);
    } catch { if (stamp === scope.epoch) setError("Chưa xác định được kết quả gửi. Hãy thử lại sau; hệ thống không tự gửi lại."); }
    finally { if (stamp === scope.epoch) setLoading(false); }
  }
  const columns: Array<BaseTableColumn<GenerationHistoryRun>> = [
    { key: "form", header: "Biểu mẫu", render: run => <span className="break-words font-semibold">{run.formName}</span> },
    { key: "mode", header: "Cách tạo / thời gian", render: run => <><p>{modeLabel(run.mode)}</p><p className="text-xs text-muted-foreground">{formatDate(run.createdAt)}</p></> },
    { key: "count", header: "Số bản", render: run => `${run.generatedCount}/${run.requestedCount}` },
    { key: "fee", header: "Phí tạo", render: run => `${run.generationCredits} credit` },
    { key: "outcomes", header: "Kết quả gửi", render: run => <span className="text-xs">{run.outcomes.successfulAttempts} thành công · {run.outcomes.rejectedAttempts} từ chối · {run.outcomes.unknownAttempts} chưa xác định</span> },
    { key: "action", header: "", render: run => <Button variant="secondary" onClick={() => void open(run)}>Xem lượt tạo</Button> }
  ];
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Lịch sử tạo câu trả lời" description="20 lượt tạo mới nhất trên toàn tài khoản. Dữ liệu đã tạo được giữ nguyên để xem và tái sử dụng." actions={<Link className={buttonStyles({ variant: "secondary" })} href="/dashboard/forms">Tạo câu trả lời mới</Link>} />
    <p className="text-sm text-muted-foreground">Bạn có thể giữ tối đa 20 lượt tạo để xem và gửi lại. Khi tạo lượt thứ 21, lượt cũ nhất rời danh sách này; giao dịch credit và nhật ký gửi vẫn được giữ.</p>
    {commands.length > 0 && <Alert className="space-y-3" role="status"><p className="font-semibold">Có lượt gửi cần kiểm tra</p><p>Hệ thống sẽ kiểm tra lại kết quả, không tự gửi lại.</p>{commands.map(command => <div key={command.commandId} className="border-t border-border pt-3"><Button variant="secondary" disabled={loading} onClick={() => void recover(command)}>Kiểm tra kết quả</Button></div>)}</Alert>}
    {job && !detail && <JobResult job={job} />}
    {error && <Alert role="alert" className="space-y-3 border-warning-border bg-warning-surface text-warning"><p>{error}</p><Button variant="secondary" onClick={() => void load()} disabled={loading}>Tải lại lịch sử</Button></Alert>}
    {loading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 aria-hidden size={18} className="animate-spin" />Đang tải lịch sử...</p>}
    {!loading && data && <Card><CardContent><BaseTable items={data.items} columns={columns} getRowKey={run => run.batchId} emptyTitle="Chưa có lượt tạo nào" emptyDetail="Tạo câu trả lời từ biểu mẫu để lưu lượt đầu tiên vào lịch sử." /><PaginationControls page={data.page} totalItems={data.totalItems} totalPages={data.totalPages} onPrevious={() => setPage(p => p - 1)} onNext={() => setPage(p => p + 1)} /></CardContent></Card>}
    <Dialog open={Boolean(detail)} onOpenChange={open => { if (!open) { scope.request++; setDetail(null); } }}>
      <DialogContent className="max-w-4xl" contentClassName="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6"><DialogTitle>Chi tiết lượt tạo</DialogTitle><DialogClose aria-label="Quay lại danh sách" className="shrink-0"><X aria-hidden size={18} /></DialogClose></DialogHeader>
        <DialogBody className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">{detail && <HistoryRunDetail key={detail.run.batchId} detail={detail} pending={pending} onPendingChange={setPending} />}</DialogBody>
      </DialogContent>
    </Dialog>
  </div>;
}
