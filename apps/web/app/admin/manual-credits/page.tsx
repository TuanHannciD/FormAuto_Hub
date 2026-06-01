"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import { CheckCircle2, Copy, Eye, HandCoins, XCircle } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { SearchableDropdownSelect } from "@/components/searchable-dropdown-select";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PageHeader, Textarea } from "@/components/ui";
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
  const [rejectReason, setRejectReason] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantCredits, setGrantCredits] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [userOptions, setUserOptions] = useState<AdminCreditUserOption[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

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
        <Button className="min-h-9 px-3" type="button" variant="secondary" onClick={() => setSelectedRequestId(item.id)}>
          <Eye size={15} />
        </Button>
      ),
      hideOnMobile: true
    }
  ];

  async function loadRequests() {
    const data = await apiFetch<AdminTopupOrder[]>("/api/admin/topup-orders/manual");
    setRequests(data);
  }

  async function loadUsers(search: string) {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
    setIsLoadingUsers(true);
    const data = await apiFetch<AdminCreditUserOptionListResponse>(`/api/admin/credit-operations/users${query}`);
    setUserOptions(data.items);
    setIsLoadingUsers(false);
  }

  useEffect(() => {
    loadRequests().catch((error: Error) => showError(error, "Không tải được danh sách yêu cầu đối soát."));
    loadUsers("").catch((error: Error) => {
      setIsLoadingUsers(false);
      showError(error, "Không tải được danh sách người dùng.");
    });
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadUsers(grantEmail).catch((error: Error) => {
        setIsLoadingUsers(false);
        showError(error, "Không tìm được người dùng theo email.");
      });
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [grantEmail]);

  useEffect(() => {
    if (!selectedRequest?.evidenceFileId) {
      setSelectedEvidenceUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    apiFetchBlob(`/api/admin/topup-orders/evidence/${selectedRequest.evidenceFileId}`)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setSelectedEvidenceUrl(objectUrl);
      })
      .catch((error) => {
        setSelectedEvidenceUrl(null);
        showError(error, "Không tải được ảnh minh chứng.");
      });

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedRequest?.evidenceFileId]);

  function changeGrantEmail(value: string) {
    setGrantEmail(value);
    const matchedUser = userOptions.find((user) => user.email.toLowerCase() === value.trim().toLowerCase());
    setGrantUserId(matchedUser?.id ?? "");
  }

  function chooseGrantUser(value: string, email: string) {
    setGrantUserId(value);
    setGrantEmail(email);
  }

  async function approveRequest() {
    if (!selectedRequest) {
      return;
    }

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
      setIsWorking(false);
    }
  }

  async function rejectRequest() {
    if (!selectedRequest) {
      return;
    }

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
      setIsWorking(false);
    }
  }

  async function submitManualGrant(event: FormEvent) {
    event.preventDefault();
    const selectedUserId = grantUserId || userOptions.find((user) => user.email.toLowerCase() === grantEmail.trim().toLowerCase())?.id || "";
    if (!selectedUserId) {
      toast.error("Vui lòng chọn người dùng theo email hợp lệ.");
      return;
    }

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
    } catch (error) {
      showError(error, "Không cộng được credit thủ công.");
    } finally {
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

            <Card>
        <CardHeader>
          <CardTitle>Cộng credit thủ công</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1.2fr_0.5fr_1.4fr_auto]" onSubmit={submitManualGrant}>
            <SearchableDropdownSelect
              emptyText="Không tìm thấy email người dùng phù hợp"
              loading={isLoadingUsers}
              options={userOptions.map((user) => ({ value: user.id, label: user.email, description: user.fullName }))}
              placeholder="Tìm email người dùng"
              searchValue={grantEmail}
              value={grantUserId}
              onChange={(value, option) => chooseGrantUser(value, option.label)}
              onSearchChange={changeGrantEmail}
            />
            <Input min={1} placeholder="Số credit" type="number" value={grantCredits} onChange={(event) => setGrantCredits(event.target.value)} />
            <Input placeholder="Lý do cộng credit" value={grantReason} onChange={(event) => setGrantReason(event.target.value)} />
            <Button disabled={isWorking || !grantEmail.trim() || Number(grantCredits) <= 0 || !grantReason.trim()} type="submit">
              Cộng credit
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách yêu cầu đối soát</CardTitle>
        </CardHeader>
        <CardContent>
          <BaseTable
            items={requests}
            columns={requestColumns}
            getRowKey={(item) => item.id}
            emptyTitle="Chưa có yêu cầu đối soát"
            emptyDetail="Yêu cầu mới sẽ xuất hiện sau khi người dùng gửi ghi chú chuyển khoản."
            minWidthClassName="min-w-[980px]"
            mobileFooter={(item) => (
              <Button className="w-full" type="button" variant="secondary" onClick={() => setSelectedRequestId(item.id)}>
                Xem chi tiết
              </Button>
            )}
          />
        </CardContent>
      </Card>

      <RequestDetailDialog
        evidenceUrl={selectedEvidenceUrl}
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
  isWorking,
  rejectReason,
  request,
  onApprove,
  onClose,
  onReject,
  onRejectReasonChange
}: {
  evidenceUrl: string | null;
  isWorking: boolean;
  rejectReason: string;
  request: AdminTopupOrder | null;
  onApprove: () => void;
  onClose: () => void;
  onReject: () => void;
  onRejectReasonChange: (value: string) => void;
}) {
  if (!request) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
          <DialogDescription>Xem thông tin người dùng, gói credit, ghi chú và ảnh minh chứng trước khi xử lý.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Mã yêu cầu" value={<RequestCode id={request.id} />} />
            <Detail label="Người dùng" value={request.userEmail || "-"} />
            <Detail label="Gói" value={request.packageName || "-"} />
            <Detail label="Số credit" value={`${request.credits} credit`} />
            <Detail label="Số tiền" value={formatCurrency(request.amount)} />
            <Detail label="Phương thức" value={displayPaymentMethod(request.paymentMethod)} />
            <Detail label="Trạng thái" value={<StatusBadge status={request.status} />} />
            <Detail label="Ảnh minh chứng" value={request.evidenceFileId ? "Đã có ảnh" : "Không có"} />
          </div>
          <Detail label="Ghi chú chuyển khoản" value={request.paymentNote || "-"} />

          {evidenceUrl ? (
            <div className="relative h-[420px] w-full overflow-hidden rounded-md border border-border/70 bg-white/55">
              <Image unoptimized fill className="object-contain" src={evidenceUrl} alt="Ảnh minh chứng nạp credit" sizes="(max-width: 768px) 100vw, 896px" />
            </div>
          ) : (
            <Alert>Yêu cầu này không có ảnh minh chứng.</Alert>
          )}

          {request.status === "Pending" && (
            <div className="space-y-3 border-t border-border/70 pt-4">
              <Textarea placeholder="Lý do từ chối" value={rejectReason} onChange={(event) => onRejectReasonChange(event.target.value)} />
            </div>
          )}
        </DialogBody>
        <DialogFooter className="flex-col sm:flex-row">
          {request.status === "Pending" && (
            <>
              <Button className="w-full sm:w-auto" disabled={isWorking} type="button" onClick={onApprove}>
                Duyệt và cộng credit
              </Button>
              <Button className="w-full sm:w-auto" disabled={isWorking || !rejectReason.trim()} type="button" variant="danger" onClick={onReject}>
                Từ chối yêu cầu
              </Button>
            </>
          )}
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onClose}>Đóng</Button>
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
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-white/75 text-muted-foreground hover:text-primary" type="button" onClick={copyId} aria-label="Sao chép đầy đủ mã yêu cầu">
        <Copy size={13} />
      </button>
    </span>
  );
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{label}</p>
          <p className="mt-2 text-[28px] font-extrabold leading-none text-slate-950">{value}</p>
        </div>
        <span className="rounded-md bg-cyan-50 p-2 text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-white/55 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}
