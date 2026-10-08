"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, Copy, Eye, FileImage, HandCoins, X, XCircle } from "lucide-react";
import { ManualGrantHistory } from "./_components/manual-grant-history";
import { MetricCard } from "@/components/metric-card";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { SearchableDropdownSelect } from "@/components/searchable-dropdown-select";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, KeyValueRow, PageHeader, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, apiFetchBlob, type AdminCreditUserOption, type AdminCreditUserOptionListResponse, type ManualCreditGrantResponse, type TopupOrder } from "@/lib/api";
import { displayPaymentMethod } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type AdminTopupOrder = TopupOrder & { userEmail?: string; packageName?: string };

export default function AdminManualCreditsPage() {
  const [requests, setRequests] = useState<AdminTopupOrder[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState("");
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantCredits, setGrantCredits] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [userOptions, setUserOptions] = useState<AdminCreditUserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const workingRef = useRef(false);
  const userSearchVersion = useRef(0);
  const invalidateUserSearch = useCallback(() => { userSearchVersion.current++; }, []);
  const [requestsError, setRequestsError] = useState("");
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);

  const selectedRequest = useMemo(
    () => requests.find((request) => request.id === selectedRequestId) ?? null,
    [requests, selectedRequestId]
  );
  const pendingCount = requests.filter((request) => request.status === "Pending").length;

  const requestColumns: Array<BaseTableColumn<AdminTopupOrder>> = [
    { key: "createdAt", header: "Tạo lúc", render: (item) => formatDate(item.createdAt) },
    { key: "request", header: "Mã yêu cầu", render: (item) => <RequestCode id={item.id} /> },
    { key: "email", header: "Người dùng", render: (item) => <span className="block max-w-[240px] truncate">{item.userEmail || "-"}</span> },
    { key: "package", header: "Gói", render: (item) => item.packageName || "-" },
    { key: "credits", header: "Số credit", render: (item) => `${item.credits} credit` },
    { key: "amount", header: "Số tiền", render: (item) => formatCurrency(item.amount) },
    { key: "status", header: "Trạng thái", render: (item) => <StatusBadge status={item.status} /> },
    {
      key: "detail",
      header: "Chi tiết",
      render: (item) => (
        <Button className="min-h-9 px-3" type="button" variant="secondary" aria-label="Xem chi tiết yêu cầu" onClick={() => { setRejectReason(""); setSelectedRequestId(item.id); }}>
          <Eye size={15} />
        </Button>
      ),
      hideOnMobile: true
    }
  ];

  async function loadRequests() {
    setIsLoadingRequests(true);
    try {
      const data = await apiFetch<AdminTopupOrder[]>("/api/admin/topup-orders/manual");
      setRequests(data);
      setRequestsError("");
    } catch (error) {
      setRequestsError("Không tải được danh sách yêu cầu đối soát.");
      throw error;
    } finally { setIsLoadingRequests(false); }
  }

  async function loadUsers(search: string) {
    const version = ++userSearchVersion.current;
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    setIsLoadingUsers(true);
    try {
      const data = await apiFetch<AdminCreditUserOptionListResponse>(`/api/admin/credit-operations/users${query}`);
      if (version === userSearchVersion.current) setUserOptions(data.items);
    } finally {
      if (version === userSearchVersion.current) setIsLoadingUsers(false);
    }
  }

  useEffect(() => {
    loadRequests().catch((error: Error) => showError(error, "Không tải được danh sách yêu cầu đối soát."));
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadUsers(grantEmail).catch((error: Error) => {
        showError(error, "Không tìm được người dùng theo email.");
      });
    }, 300);
    return () => { window.clearTimeout(timeout); invalidateUserSearch(); };
  }, [grantEmail, invalidateUserSearch]);

  useEffect(() => {
    if (!selectedRequest?.evidenceFileId) {
      setSelectedEvidenceUrl(null);
      setEvidenceLoading(false); setEvidenceError(false);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setSelectedEvidenceUrl(null);
    setEvidenceLoading(true); setEvidenceError(false);
    apiFetchBlob(`/api/admin/topup-orders/evidence/${selectedRequest.evidenceFileId}`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSelectedEvidenceUrl(objectUrl);
        setEvidenceLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        setSelectedEvidenceUrl(null);
        setEvidenceLoading(false); setEvidenceError(true);
        showError(error, "Không tải được ảnh minh chứng.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedRequest?.evidenceFileId]);

  function changeGrantEmail(value: string) {
    userSearchVersion.current++;
    setIsLoadingUsers(true);
    setGrantEmail(value);
    const matchedUser = userOptions.find((user) => user.email.toLowerCase() === value.trim().toLowerCase());
    setGrantUserId(matchedUser?.id ?? "");
  }

  function chooseGrantUser(value: string, email: string) {
    setGrantUserId(value);
    setGrantEmail(email);
  }

  async function approveRequest() {
    if (!selectedRequest || workingRef.current) {
      return;
    }

    workingRef.current = true;
    setIsWorking(true);
    try {
      await apiFetch(`/api/admin/topup-orders/${selectedRequest.id}/approve`, {
        method: "POST",
        json: { paymentNote: selectedRequest.paymentNote }
      });
      toast.success("Đã duyệt yêu cầu đối soát và cộng credit.");
      setSelectedRequestId("");
      await loadRequests();
    } catch (error) {
      showError(error, "Không duyệt được yêu cầu đối soát.");
    } finally {
      workingRef.current = false;
      setIsWorking(false);
    }
  }

  async function rejectRequest() {
    if (!selectedRequest || workingRef.current) {
      return;
    }

    workingRef.current = true;
    setIsWorking(true);
    try {
      await apiFetch(`/api/admin/topup-orders/${selectedRequest.id}/reject`, {
        method: "POST",
        json: { paymentNote: rejectReason }
      });
      setRejectReason("");
      setSelectedRequestId("");
      toast.success("Đã từ chối yêu cầu đối soát.");
      await loadRequests();
    } catch (error) {
      showError(error, "Không từ chối được yêu cầu đối soát.");
    } finally {
      workingRef.current = false;
      setIsWorking(false);
    }
  }

  async function submitManualGrant(event: FormEvent) {
    event.preventDefault();
    if (workingRef.current) return;
    const selectedUserId = grantUserId || userOptions.find((user) => user.email.toLowerCase() === grantEmail.trim().toLowerCase())?.id || "";
    if (!selectedUserId) {
      toast.error("Vui lòng chọn người dùng theo email hợp lệ.");
      return;
    }
    if (!Number.isInteger(Number(grantCredits)) || Number(grantCredits) <= 0 || Number(grantCredits) > 2147483647 || !grantReason.trim()) {
      toast.error("Nhập số credit nguyên dương và lý do cộng credit.");
      return;
    }

    workingRef.current = true;
    setIsWorking(true);
    try {
      const result = await apiFetch<ManualCreditGrantResponse>("/api/admin/credit-operations/manual-grants", {
        method: "POST",
        json: { userId: selectedUserId, credits: Number(grantCredits), reason: grantReason }
      });
      toast.success(`Đã cộng credit cho ${result.userEmail}. Số dư mới: ${result.balanceAfter} credit.`);
      setGrantEmail("");
      setGrantUserId("");
      setGrantCredits("");
      setGrantReason("");
      setHistoryRefresh(value => value + 1);
    } catch (error) {
      showError(error, "Không cộng được credit thủ công.");
    } finally {
      workingRef.current = false;
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quản trị / Đối soát credit"
        title="Đối soát và cộng credit thủ công"
        description="Xử lý yêu cầu nạp thủ công và cộng credit trực tiếp cho người dùng khi có lý do nội bộ rõ ràng."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={<HandCoins size={18} />} label="Yêu cầu đối soát" value={String(requests.length)} />
        <Metric icon={<CheckCircle2 size={18} />} label="Đang chờ" value={String(pendingCount)} />
        <Metric icon={<XCircle size={18} />} label="Đã xử lý" value={String(requests.length - pendingCount)} />
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Cộng credit thủ công</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_1.4fr_auto]" onSubmit={submitManualGrant}>
            <SearchableDropdownSelect
              disabled={isWorking}
              emptyText="Không tìm thấy email người dùng phù hợp"
              loading={isLoadingUsers}
              options={userOptions.map((user) => ({ value: user.id, label: user.email, description: user.fullName }))}
              placeholder="Tìm email người dùng"
              searchValue={grantEmail}
              value={grantUserId}
              onChange={(value, option) => chooseGrantUser(value, option.label)}
              onSearchChange={changeGrantEmail}
            />
            <Input aria-label="Số credit" disabled={isWorking} min={1} max={2147483647} step={1} placeholder="Số credit" type="number" value={grantCredits} onChange={(event) => setGrantCredits(event.target.value)} />
            <Input aria-label="Lý do cộng credit" disabled={isWorking} maxLength={1000} placeholder="Lý do cộng credit" value={grantReason} onChange={(event) => setGrantReason(event.target.value)} />
            <Button disabled={isWorking || isLoadingUsers || !grantUserId || !Number.isInteger(Number(grantCredits)) || Number(grantCredits) <= 0 || !grantReason.trim()} type="submit">
              Cộng credit
            </Button>
          </form>
        </CardContent>
      </Card>

      <ManualGrantHistory refreshKey={historyRefresh} />

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Danh sách yêu cầu đối soát</CardTitle>
        </CardHeader>
        <CardContent>
          {requestsError ? <Alert><p>{requestsError}</p><Button type="button" variant="secondary" disabled={isLoadingRequests} onClick={() => loadRequests().catch(error => showError(error))}>Thử lại</Button></Alert> : isLoadingRequests ? <p className="text-sm text-muted-foreground">Đang tải yêu cầu đối soát...</p> :
          <BaseTable
            items={requests}
            columns={requestColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Chưa có yêu cầu đối soát"
            emptyDetail="Yêu cầu mới sẽ xuất hiện sau khi người dùng gửi ghi chú chuyển khoản."
            minWidthClassName="min-w-[980px]"
            mobileFooter={(item) => (
              <Button className="w-full" type="button" variant="secondary" onClick={() => { setRejectReason(""); setSelectedRequestId(item.id); }}>
                Xem chi tiết
              </Button>
            )}
          />}
        </CardContent>
      </Card>

      <RequestDetailDialog
        evidenceUrl={selectedEvidenceUrl}
        evidenceLoading={evidenceLoading}
        evidenceError={evidenceError}
        isWorking={isWorking}
        rejectReason={rejectReason}
        request={selectedRequest}
        onApprove={approveRequest}
        onClose={() => setSelectedRequestId("")}
        onReject={rejectRequest}
        onRejectReasonChange={setRejectReason}
      />
    </div>
  );
}

function RequestDetailDialog({
  evidenceUrl,
  evidenceLoading,
  evidenceError,
  isWorking,
  rejectReason,
  request,
  onApprove,
  onClose,
  onReject,
  onRejectReasonChange
}: {
  evidenceUrl: string | null;
  evidenceLoading: boolean;
  evidenceError: boolean;
  isWorking: boolean;
  rejectReason: string;
  request: AdminTopupOrder | null;
  onApprove: () => void;
  onClose: () => void;
  onReject: () => void;
  onRejectReasonChange: (value: string) => void;
}) {
  if (!request) {
    return <Dialog open={false} className="max-w-3xl" />;
  }

  return (
    <Dialog open className="max-w-3xl" onOpenChange={(open) => !open && onClose()}>
      <DialogContent contentClassName="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="flex shrink-0 items-start justify-between gap-3">
          <div><DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
          <DialogDescription>Kiểm tra thông tin và minh chứng trước khi xử lý.</DialogDescription></div>
          <DialogClose size="icon" aria-label="Đóng chi tiết"><X size={16} /></DialogClose>
        </DialogHeader>
        <DialogBody className="min-h-0 space-y-4 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary-border bg-primary-soft/60 p-4">
            <div className="flex flex-wrap gap-x-8 gap-y-3">
              <div><p className="text-xs text-muted-foreground">Số tiền chuyển</p><p className="mt-1 text-xl font-extrabold">{formatCurrency(request.amount)}</p></div>
              <div><p className="text-xs text-muted-foreground">Credit nhận</p><p className="mt-1 text-xl font-extrabold text-primary">{request.credits} <span className="text-sm font-semibold">credit</span></p></div>
            </div>
            <StatusBadge status={request.status} />
          </div>
          <div className="grid items-start gap-5 md:grid-cols-2">
            <div className="min-w-0 space-y-4">
              <section aria-label="Thông tin yêu cầu" className="space-y-2 text-sm">
                <h3 className="mb-3 font-bold">Thông tin yêu cầu</h3>
                <KeyValueRow label="Người dùng" value={request.userEmail || "-"} />
                <KeyValueRow label="Gói credit" value={request.packageName || "-"} />
                <KeyValueRow label="Tạo lúc" value={formatDate(request.createdAt)} />
                <KeyValueRow label="Phương thức" value={displayPaymentMethod(request.paymentMethod)} />
                <KeyValueRow label="Mã yêu cầu" value={<RequestCode id={request.id} />} />
              </section>
              <div><p className="mb-2 text-xs font-semibold text-muted-foreground">{request.status === "Rejected" ? "Lý do từ chối" : "Ghi chú chuyển khoản"}</p><p className="whitespace-pre-wrap break-words rounded-xl bg-surface-subtle p-3 text-sm">{request.paymentNote || "Không có ghi chú"}</p></div>
            </div>
            <section aria-label="Minh chứng chuyển khoản" className="min-w-0 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold"><FileImage size={16} className="text-primary" />Minh chứng chuyển khoản</h3>
              {evidenceUrl ? <div className="relative h-[240px] overflow-hidden rounded-xl border border-border bg-surface-subtle">
                <Image unoptimized fill className="object-contain p-2" src={evidenceUrl} alt="Ảnh minh chứng nạp credit" sizes="(max-width: 768px) 90vw, 350px" />
              </div> : <div className="flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-subtle px-4 py-5 text-center text-sm text-muted-foreground">
                <FileImage size={24} aria-hidden="true" />
                <p>{evidenceLoading || (request.evidenceFileId && !evidenceError) ? "Đang tải minh chứng..." : evidenceError ? "Không tải được ảnh minh chứng." : "Yêu cầu này không có ảnh minh chứng."}</p>
              </div>}
            </section>
          </div>
          {request.status === "Pending" && (
            <div className="border-t border-border pt-4">
              <label className="block text-xs font-semibold text-muted-foreground">Lý do từ chối <span className="font-normal">(chỉ nhập khi từ chối yêu cầu)</span>
                <Textarea className="mt-2 min-h-16" rows={2} maxLength={1000} disabled={isWorking} placeholder="Lý do từ chối" value={rejectReason} onChange={(event) => onRejectReasonChange(event.target.value)} />
              </label>
            </div>
          )}
        </DialogBody>
        <DialogFooter className={request.status === "Pending" ? "grid shrink-0 grid-cols-2 sm:flex" : "shrink-0"}>
          {request.status === "Pending" && (
            <>
              <Button className="col-span-2 w-full sm:w-auto" disabled={isWorking} type="button" onClick={onApprove}>
                Duyệt và cộng credit
              </Button>
              <Button className="w-full sm:w-auto" disabled={isWorking || !rejectReason.trim()} type="button" variant="danger" onClick={onReject}>
                Từ chối yêu cầu
              </Button>
            </>
          )}
          <DialogClose className="w-full sm:w-auto">Đóng</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RequestCode({ id }: { id: string }) {
  const shortId = id.slice(0, 8).toUpperCase();

  async function copyId() {
    await navigator.clipboard.writeText(id);
    toast.success("Đã sao chép đầy đủ mã yêu cầu.");
  }

  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span className="font-mono text-xs font-semibold">{shortId}</span>
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-border bg-surface-subtle text-muted-foreground hover:text-primary" type="button" onClick={copyId} aria-label="Sao chép đầy đủ mã yêu cầu">
        <Copy size={13} />
      </button>
    </span>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <MetricCard title={label} value={value} icon={icon} tone="info" />;
}
