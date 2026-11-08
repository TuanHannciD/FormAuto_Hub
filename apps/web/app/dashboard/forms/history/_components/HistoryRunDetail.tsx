"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError, type CreditAvailability, type GenerationHistoryDetail, type SubmissionJob } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { AnswerCards } from "../../_components/AnswerCards";
import { historyError, removeHistoryCommand, storeHistoryCommand, terminalJob, unresolvedJob, type HistoryCommand } from "./history-command";
import { readSubmissionJob } from "../../_helpers";

export function CreditBalances({ credits }: { credits: CreditAvailability }) {
  return <p className="text-sm font-semibold tabular-nums">Còn lại {credits.available} credit</p>;
}
export function JobResult({ job }: { job: SubmissionJob }) {
  const unknown = unresolvedJob(job);
  const statusText = job.status === "Pending" || job.status === "Running" ? "Đang xử lý" : job.status === "Paused" ? "Đang tạm dừng" : job.status === "Cancelled" ? "Đã hủy" : "Chưa hoàn tất";
  return <Alert role="status" className={unknown ? "border-warning-border bg-warning-surface text-warning" : ""}>
    <p>{unknown ? "Chưa xác định được kết quả gửi. Hãy kiểm tra lại sau; hệ thống không tự gửi lại." : terminalJob(job) && job.successCount > 0 ? `Đã gửi thành công ${job.successCount} lượt · ${job.failedCount} lượt bị từ chối.` : `Lượt gửi: ${statusText}.`}</p>
    {job.fees && <><p className="mt-2">Đã dùng {job.fees.settledCredits} credit cho các lượt gửi thành công.</p><div className="mt-3"><CreditBalances credits={job.fees.credits} /></div></>}
  </Alert>;
}

export function HistoryRunDetail({ detail, pending, onPendingChange }: { detail: GenerationHistoryDetail; pending: HistoryCommand | null; onPendingChange: (value: HistoryCommand | null) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [sending, setSending] = useState(false);
  const [job, setJob] = useState<SubmissionJob | null>(null);
  const [error, setError] = useState("");
  const [fenced, setFenced] = useState(false);
  const lock = useRef(false);
  const eligible = detail.responses.filter(item => !item.sendBlocked);
  const maximum = selected.reduce((sum, id) => sum + (detail.responses.find(item => item.response.id === id)?.prepaidFirstSuccessAvailable ? 0 : 1), 0);
  const available = job?.fees?.credits ?? detail.credits;
  const disabled = sending || Boolean(pending) || fenced;

  async function send() {
    const userId = getStoredSession()?.userId;
    if (lock.current || disabled || !accepted || !userId || !selected.length || maximum > available.available) return;
    lock.current = true; setSending(true); setError(""); setConfirmOpen(false);
    const command: HistoryCommand = { contractVersion: 2, userId, projectId: detail.run.projectId, batchId: detail.run.batchId, commandId: crypto.randomUUID() };
    storeHistoryCommand(command); onPendingChange(command);
    try {
      const raw = await apiFetch<unknown>(`/api/projects/${command.projectId}/submissions/send`, { method: "POST", json: { contractVersion: 2, commandId: command.commandId, batchId: command.batchId, responseIds: selected, confirmed: true, duplicateWarningAccepted: true } });
      const value = readSubmissionJob(raw, { id: command.commandId, projectId: command.projectId });
      if (!value) throw new Error("Invalid admitted job identity");
      if (getStoredSession()?.userId !== userId) return;
      setJob(value); setFenced(true); setSelected([]);
      if (terminalJob(value)) removeHistoryCommand(command);
    } catch (e) {
      if (getStoredSession()?.userId !== userId) return;
      if (e instanceof ApiError && e.kind === "http" && [400, 404, 409].includes(e.status ?? 0) && e.code !== "CommandConflict") {
        removeHistoryCommand(command); setError(historyError(e));
        if (!["InsufficientAvailableCredit"].includes(e.code ?? "")) setFenced(true);
      } else { setFenced(true); setError("Kết quả gửi chưa xác định. Giữ mã lệnh để kiểm tra trạng thái; không tự động gửi lại."); }
    } finally { lock.current = false; setSending(false); setAccepted(false); }
  }
  return <div className="min-w-0 space-y-4">
    <Card><CardHeader><CardTitle>Tóm tắt lượt tạo</CardTitle><p className="mt-1 text-xs text-muted-foreground">Xem lại các bản đã tạo và chọn bản muốn gửi.</p></CardHeader><CardContent className="space-y-3">
      <p className="break-words font-semibold">{detail.run.formName}</p><p className="text-xs text-muted-foreground">{formatDate(detail.run.createdAt)} · {detail.responses.length} bản trả lời</p>
      <p className="text-sm">Đã dùng <span className="font-semibold">{detail.run.generationCredits} credit</span> để tạo</p><CreditBalances credits={available} />
    </CardContent></Card>
    {eligible.length < detail.responses.length && <Alert role="status" className="border-warning-border bg-warning-surface text-warning"><p className="font-semibold">Một số bản chưa thể gửi</p><p className="mt-1">Form đã thay đổi hoặc kết quả cũ chưa được đối soát. Bạn vẫn có thể xem, nhưng không thể chọn các bản này.</p></Alert>}
    {error && <Alert role="alert" className="border-warning-border bg-warning-surface text-warning">{error}</Alert>}
    {job && <JobResult job={job} />}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="space-y-1 text-sm"><p><span className="font-semibold">{selected.length}</span>/{detail.responses.length} bản đã chọn</p><p className="font-semibold tabular-nums">Dự kiến dùng {maximum} credit</p><p className="text-xs leading-5 text-muted-foreground">Chỉ tính phí cho bản gửi thành công.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={disabled || !eligible.length} onClick={() => { setSelected(selected.length ? [] : eligible.map(item => item.response.id)); setAccepted(false); }}>{selected.length ? "Bỏ chọn" : "Chọn các bản có thể gửi"}</Button><Button disabled={disabled || !selected.length || maximum > available.available} onClick={() => { setAccepted(false); setConfirmOpen(true); }}>Xem lại và gửi</Button></div>
      {maximum > available.available && <p role="alert" className="text-sm text-warning">Credit khả dụng chưa đủ. Hãy giảm số lượng đã chọn hoặc nạp thêm.</p>}
    </div>
    <section aria-label="Câu trả lời đã lưu" className="space-y-3">
      {detail.responses.slice(0, 100).map(item => <div key={item.response.id} className="min-w-0 rounded-xl border border-border bg-surface p-4"><div className="flex items-start gap-3"><label className="flex min-h-11 shrink-0 items-center"><input type="checkbox" className="h-5 w-5 accent-primary focus-visible:outline-primary" aria-label={`Chọn câu trả lời ${item.ordinal + 1}`} disabled={disabled || item.sendBlocked} checked={selected.includes(item.response.id)} onChange={event => { setSelected(ids => event.target.checked ? [...ids, item.response.id] : ids.filter(id => id !== item.response.id)); setAccepted(false); }} /></label><div className="min-w-0 flex-1"><p className="mb-3 text-sm font-semibold">Bản trả lời {item.ordinal + 1}</p><AnswerCards answers={item.response.answers} compact />{item.sendBlocked && <p className="mt-2 text-xs text-warning">Bản này chưa thể gửi lại vì biểu mẫu đã thay đổi.</p>}</div></div></div>)}
    </section>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Kiểm tra trước khi gửi</DialogTitle></DialogHeader><DialogBody className="space-y-4"><p className="text-sm">Bạn đã chọn <strong>{selected.length} bản</strong>. Phí gửi tối đa <strong>{maximum} credit</strong>; chỉ tính bản gửi thành công.</p><Alert>Gửi lại có thể tạo câu trả lời trùng trên Google Forms, kể cả bản đã từng gửi.</Alert><label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"><input className="mt-1 h-5 w-5 shrink-0 accent-primary" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />Tôi đã xem nội dung, có quyền gửi và chấp nhận khả năng tạo dữ liệu trùng.</label></DialogBody><DialogFooter><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Quay lại</Button><Button disabled={!accepted || disabled} onClick={() => void send()}>Gửi các bản đã chọn</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
