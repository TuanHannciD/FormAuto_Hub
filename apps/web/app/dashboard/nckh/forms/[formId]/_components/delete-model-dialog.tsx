"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog, DialogClose, DialogContent, DialogTitle, Input, KeyValueRow } from "@/components/ui";
import { apiFetch, type NckhResearchModel, type NckhVariableListResponse, type NckhMappingListResponse, type NckhRelationListResponse, type NckhPositionListResponse, type NckhRawResponseListResponse, type NckhDatasetListResponse } from "@/lib/api";
import { readableNckhError } from "../_helpers";

type Impact = { model: NckhResearchModel; counts: [string, number][] };

// Counts come from existing owned GETs, never from the workspace's truncated/stale lists.
async function loadImpact(modelId: string): Promise<Impact> {
  const base = `/api/v1/nckh/models/${modelId}`;
  const [model, variables, mappings, relations, positions, responses, dataset] = await Promise.all([
    apiFetch<NckhResearchModel>(base),
    apiFetch<NckhVariableListResponse>(`${base}/variables?page=1&pageSize=1`),
    apiFetch<NckhMappingListResponse>(`${base}/mappings?page=1&pageSize=1`),
    apiFetch<NckhRelationListResponse>(`${base}/relations?page=1&pageSize=1`),
    apiFetch<NckhPositionListResponse>(`${base}/positions`),
    apiFetch<NckhRawResponseListResponse>(`${base}/responses?page=1&pageSize=1`),
    apiFetch<NckhDatasetListResponse>(`${base}/dataset?page=1&pageSize=1`)
  ]);
  const counts: [string, number][] = [
    ["Biến nghiên cứu", variables.totalItems], ["Ánh xạ câu hỏi", mappings.totalItems],
    ["Quan hệ", relations.totalItems], ["Vị trí canvas", positions.items.length],
    ["Câu trả lời khảo sát", responses.totalItems], ["Bản ghi chuẩn hóa", dataset.totalItems]
  ];
  if (model.id !== modelId || !model.name || counts.some(([, count]) => !Number.isSafeInteger(count) || count < 0)) {
    throw new Error("Không xác định được đầy đủ dữ liệu bị ảnh hưởng.");
  }
  return { model, counts };
}

export function DeleteModelDialog({ modelId, onClosed, onDeleted }: {
  modelId: string; onClosed: () => void; onDeleted: (modelId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setImpact(null); setName(""); setError(null);
    loadImpact(modelId).then(value => { if (!cancelled) setImpact(value); })
      .catch(cause => { if (!cancelled) setError(readableNckhError(cause, "Không tải được dữ liệu bị ảnh hưởng. Vui lòng thử lại.")); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [modelId, attempt]);

  async function remove() {
    if (busy.current || loading || !impact || impact.model.hasGeneratedForm || name !== impact.model.name) return;
    busy.current = true; setDeleting(true); setError(null);
    try {
      // Another tab may have renamed the model or generated a form since the popup opened.
      const current = await apiFetch<NckhResearchModel>(`/api/v1/nckh/models/${modelId}`);
      if (current.name !== impact.model.name || current.hasGeneratedForm) {
        setName("");
        setError("Mô hình đã thay đổi. Hãy tải lại thông tin và xác nhận lại.");
        setImpact(null);
        return;
      }
      await apiFetch<void>(`/api/v1/nckh/models/${modelId}`, { method: "DELETE" });
      if (mounted.current) { onDeleted(modelId); setOpen(false); }
    } catch (cause) {
      if (mounted.current) {
        setName(""); setImpact(null);
        setError(readableNckhError(cause, "Không xác nhận được kết quả xóa. Hãy tải lại thông tin trước khi thử lại."));
      }
    } finally {
      busy.current = false;
      if (mounted.current) setDeleting(false);
    }
  }

  return <Dialog open={open} dismissible={!deleting} className="max-w-xl" onAfterClose={onClosed}>
    <DialogContent contentClassName="flex max-h-[calc(100dvh-2rem-2px)] flex-col">
      <div className="shrink-0 border-b border-border p-5"><DialogTitle>Xóa mô hình nghiên cứu</DialogTitle></div>
      <div className="min-h-0 space-y-4 overflow-y-auto p-5" aria-busy={loading || deleting}>
        {loading && <p role="status" className="text-sm text-muted-foreground">Đang kiểm tra dữ liệu bị ảnh hưởng...</p>}
        {error && <Alert role="alert">{error}</Alert>}
        {!loading && !impact && <Button variant="secondary" disabled={deleting} onClick={() => setAttempt(value => value + 1)}>Tải lại thông tin</Button>}
        {impact && <>
          <p className="break-words text-sm">Xóa vĩnh viễn mô hình <strong>{impact.model.name}</strong> cùng các dữ liệu sau:</p>
          <dl className="rounded-xl border border-border px-4">{impact.counts.map(([label, count]) => <KeyValueRow key={label} label={label} value={count.toLocaleString("vi-VN")} />)}</dl>
          <p className="text-xs text-muted-foreground">Số lượng tại thời điểm kiểm tra, có thể thay đổi ở phiên khác. Nhật ký thu thập của mô hình cũng bị xóa. Form gốc và dữ liệu trên Google không bị xóa.</p>
          {impact.model.hasGeneratedForm ? <Alert className="border-warning/30 bg-warning/10 text-warning">Mô hình đã sinh form mới nên chưa thể xóa do ràng buộc dữ liệu hiện có.</Alert> : <>
            <Alert className="border-warning/30 bg-warning/10 text-warning">Thao tác này không thể hoàn tác.</Alert>
            <label className="block space-y-2 text-sm"><span>Nhập đúng tên mô hình để xác nhận</span>
              <Input value={name} onChange={event => setName(event.target.value)} disabled={deleting} autoComplete="off" spellCheck={false} />
            </label>
            <p className="text-xs text-muted-foreground">Phải trùng khớp đầy đủ, gồm chữ hoa, dấu và khoảng trắng.</p>
          </>}
        </>}
      </div>
      <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4">
        <DialogClose disabled={deleting}>Hủy</DialogClose>
        <Button variant="danger" disabled={loading || deleting || !impact || impact.model.hasGeneratedForm || name !== impact.model.name} onClick={remove}>
          {deleting ? "Đang xóa..." : "Xóa vĩnh viễn"}
        </Button>
      </div>
    </DialogContent>
  </Dialog>;
}
