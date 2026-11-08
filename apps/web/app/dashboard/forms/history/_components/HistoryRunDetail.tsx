"use client";

import { useRef, useState } from "react";
import { apiFetch, ApiError, type CreditAvailability, type GenerationHistoryDetail, type SubmissionJob } from "@/lib/api";
import { getStoredSession } from "@/lib/auth";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui";
import { formatDate } from "@/lib/utils";
import { historyError, removeHistoryCommand, storeHistoryCommand, terminalJob, unresolvedJob, type HistoryCommand } from "./history-command";
import { readSubmissionJob } from "../../_helpers";

export function CreditBalances({ credits }: { credits: CreditAvailability }) {
  return <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm tabular-nums">{[["Số dư đã ghi sổ", credits.balance], ["Đang giữ", credits.reserved], ["Khả dụng", credits.available]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="font-semibold">{value} credit</dd></div>)}</dl>;
}
export function JobResult({ job }: { job: SubmissionJob }) {
  const unknown = unresolvedJob(job);
  return <Alert role="status" className={unknown ? "border-warning-border bg-warning-surface text-warning" : ""}>
    <p>{unknown ? "Kết quả gửi chưa xác định. Không tự động gửi lại; credit liên quan được giữ để đối soát." : terminalJob(job) && job.successCount > 0 ? `Đã gửi thành công ${job.successCount} lượt · ${job.failedCount} lượt bị từ chối.` : `Lượt gửi đang ở trạng thái ${job.status}. Chỉ kiểm tra trạng thái, không gửi lại.`}</p>
    {job.fees && <><p className="mt-2">Phí gửi tối đa: {job.fees.maximumSendCredits} · Đã trừ: {job.fees.settledCredits} · Còn giữ: {job.fees.heldCredits} · Đã giải phóng: {job.fees.releasedCredits} credit.</p><div className="mt-3"><CreditBalances credits={job.fees.credits} /></div></>}
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
    <Card><CardHeader><CardTitle>Chi tiết lượt tạo</CardTitle><p className="mt-1 text-xs text-muted-foreground">Xem lại các bản đã tạo và chọn bản muốn gửi.</p></CardHeader><CardContent className="space-y-3">
      <p className="break-words font-semibold">{detail.run.formName}</p><p className="text-xs text-muted-foreground">{formatDate(detail.run.createdAt)} · {detail.responses.length} câu trả lời · Chỉ đọc</p>
      <p className="text-sm">Phí tạo: <span className="font-semibold">{detail.run.generationCredits} credit</span></p><CreditBalances credits={available} />
      <details className="text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-primary">Quan sát biểu mẫu tại thời điểm tạo</summary><p className="text-muted-foreground">{detail.observation.completeness === "Partial" ? "Dữ liệu quan sát chưa đầy đủ." : "Dữ liệu quan sát đã lưu."} Quan sát không xác nhận khả năng gửi hay kết quả Google Forms.</p>{detail.observation.questions.map((question, index) => <p key={index} className="break-words py-1 text-xs">{question.entryId ?? "Chưa xác định trường"} · {question.questionType ?? "Chưa xác định loại"} · Bắt buộc: {question.required === null ? "Chưa biết" : question.required ? "Có" : "Không"}</p>)}</details>
    </CardContent></Card>
    {eligible.length < detail.responses.length && <Alert role="status" className="border-warning-border bg-warning-surface text-warning"><p className="font-semibold">Một số bản chưa thể gửi</p><p className="mt-1">Form đã thay đổi hoặc kết quả cũ chưa được đối soát. Bạn vẫn có thể xem, nhưng không thể chọn các bản này.</p></Alert>}
    {error && <Alert role="alert" className="border-warning-border bg-warning-surface text-warning">{error}</Alert>}
    {job && <JobResult job={job} />}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="space-y-1 text-sm"><p><span className="font-semibold">{selected.length}</span>/{detail.responses.length} bản đã chọn</p><p className="font-semibold tabular-nums">Phí gửi tối đa: {maximum} credit</p><p className="text-xs leading-5 text-muted-foreground">Chỉ trừ 1 credit cho mỗi bản gửi thành công. Không thu lại phí tạo.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={disabled || !eligible.length} onClick={() => { setSelected(selected.length ? [] : eligible.map(item => item.response.id)); setAccepted(false); }}>{selected.length ? "Bỏ chọn" : "Chọn tất cả có thể gửi"}</Button><Button disabled={disabled || !selected.length || maximum > available.available} onClick={() => { setAccepted(false); setConfirmOpen(true); }}>Xem lại và gửi</Button></div>
      {maximum > available.available && <p role="alert" className="text-sm text-warning">Credit khả dụng chưa đủ. Hãy giảm số lượng đã chọn hoặc nạp thêm.</p>}
    </div>
    <section aria-label="Câu trả lời đã lưu" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface">
      {detail.responses.slice(0, 100).map(item => <div key={item.response.id} className="min-w-0 p-4"><div className="flex items-start gap-3"><label className="flex min-h-11 shrink-0 items-center"><input type="checkbox" className="h-5 w-5 accent-primary focus-visible:outline-primary" aria-label={`Chọn câu trả lời ${item.ordinal + 1}`} disabled={disabled || item.sendBlocked} checked={selected.includes(item.response.id)} onChange={event => { setSelected(ids => event.target.checked ? [...ids, item.response.id] : ids.filter(id => id !== item.response.id)); setAccepted(false); }} /></label><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Câu trả lời {item.ordinal + 1}</p><p className="break-words text-sm text-secondary-foreground">{item.response.previewText}</p><p className="mt-1 text-xs text-muted-foreground">{item.outcomes.successfulAttempts} thành công · {item.outcomes.rejectedAttempts} từ chối · {item.outcomes.unknownAttempts} chưa xác định</p>{item.sendBlocked && <p className="mt-1 text-xs text-warning">{item.blockReason === "OutcomeUnresolved" ? "Chờ đối soát kết quả; không gửi lại." : "Chưa đủ bằng chứng về biểu mẫu để gửi."}</p>}<details className="text-sm"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-primary">Xem nội dung đầy đủ</summary><dl className="space-y-2">{item.response.answers.map((answer, index) => <div key={index}><dt className="break-words font-medium">{answer.label}</dt><dd className="whitespace-pre-wrap break-words text-secondary-foreground">{answer.values.join(", ")}</dd></div>)}</dl></details></div></div></div>)}
    </section>
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}><DialogContent><DialogHeader><DialogTitle>Kiểm tra trước khi gửi</DialogTitle></DialogHeader><DialogBody className="space-y-4"><p className="text-sm">Bạn đã chọn <strong>{selected.length} bản</strong>. Phí gửi tối đa <strong>{maximum} credit</strong>; chỉ tính bản gửi thành công.</p><Alert>Gửi lại có thể tạo câu trả lời trùng trên Google Forms, kể cả bản đã từng gửi.</Alert><label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm"><input className="mt-1 h-5 w-5 shrink-0 accent-primary" type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} />Tôi đã xem nội dung, có quyền gửi và chấp nhận khả năng tạo dữ liệu trùng.</label></DialogBody><DialogFooter><Button variant="secondary" onClick={() => setConfirmOpen(false)}>Quay lại</Button><Button disabled={!accepted || disabled} onClick={() => void send()}>Gửi các bản đã chọn</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
