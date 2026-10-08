"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, ChevronDown, Copy, CreditCard, Eye, FileImage, History, RefreshCw, Wallet } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { PaginationControls } from "@/components/pagination-controls";
import { TopupOrderDetailDialog } from "./_components/topup-order-detail";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Input, KeyValueRow, PageHeader, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, apiFetchBlob, type CreatePayosTopupOrderResponse, type CreditPackage, type DashboardSummary, type TopupOrder, type UploadTopupEvidenceResponse } from "@/lib/api";
import { displayPaymentMethod } from "@/lib/labels";
import { showError } from "@/lib/toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

function createTopupOrderColumns(onOpenDetail: (orderId: string) => void): Array<BaseTableColumn<TopupOrder>> {
  return [
  { key: "request", header: "Mã yêu cầu", render: (order) => <RequestCode id={order.id} /> },
  { key: "package", header: "Gói", render: (order) => order.packageName || "-" },
  { key: "credits", header: "Số credit", render: (order) => order.credits },
  { key: "amount", header: "Số tiền", render: (order) => formatCurrency(order.amount) },
  { key: "paymentMethod", header: "Phương thức", render: (order) => displayPaymentMethod(order.paymentMethod) },
  { key: "status", header: "Trạng thái", render: (order) => <StatusBadge status={order.status} /> },
  {
    key: "evidence",
    header: "Ảnh minh chứng",
    render: (order) => order.evidenceFileId ? <span className="text-primary">Đã có ảnh</span> : "Không có",
    hideOnMobile: true
  },
  { key: "createdAt", header: "Tạo lúc", render: (order) => formatDate(order.createdAt) },
  {
    key: "detail",
    header: "Chi tiết",
    render: (order) => (
      <Button className="min-h-9 px-3" type="button" variant="secondary" aria-label="Xem chi tiết yêu cầu" onClick={() => onOpenDetail(order.id)}>
        <Eye size={15} />
      </Button>
    ),
    hideOnMobile: true
  }
  ];
}

export default function TopUpPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [evidenceError, setEvidenceError] = useState(false);
  const [orders, setOrders] = useState<TopupOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [packageId, setPackageId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [evidenceFileId, setEvidenceFileId] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const submittingManualRef = useRef(false);
  const [isCreatingPayos, setIsCreatingPayos] = useState(false);

  const selectedPackage = useMemo(() => packages.find((item) => item.id === packageId), [packageId, packages]);
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) ?? null, [orders, selectedOrderId]);
  const topupOrderColumns = useMemo(() => createTopupOrderColumns(setSelectedOrderId), []);
  const pendingManualOrder = useMemo(
    () => orders.find((order) => order.paymentMethod === "Manual" && order.status === "Pending"),
    [orders]
  );

  const totalPages = Math.ceil(orders.length / 10);
  const currentPage = Math.min(historyPage, Math.max(1, totalPages));
  const pagedOrders = orders.slice((currentPage - 1) * 10, currentPage * 10);

  async function loadData() {
    setIsLoading(true); setLoadError(false);
    try {
      const [packageData, orderData, summaryData] = await Promise.all([
        apiFetch<CreditPackage[]>("/api/packages"),
        apiFetch<{ items: TopupOrder[] }>("/api/topup-orders"),
        apiFetch<DashboardSummary>("/api/dashboard/summary")
      ]);
      const activePackages = packageData.filter((item) => item.isActive);
      setPackages(activePackages);
      setOrders([...orderData.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)));
      setSummary(summaryData);
      setPackageId((current) => activePackages.some(item => item.id === current) ? current : activePackages[0]?.id || "");
    } catch (error) { setLoadError(true); throw error; }
    finally { setIsLoading(false); }
  }

  useEffect(() => {
    loadData().catch((error: Error) => showError(error, "Không tải được dữ liệu nạp credit."));
  }, []);

  useEffect(() => {
    setEvidenceError(false);
    if (!selectedOrder?.evidenceFileId) {
      setSelectedEvidenceUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setSelectedEvidenceUrl(null);
    apiFetchBlob(`/api/topup-orders/evidence/${selectedOrder.evidenceFileId}`)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSelectedEvidenceUrl(objectUrl);
      })
      .catch((error) => {
        if (cancelled) return;
        setSelectedEvidenceUrl(null);
        setEvidenceError(true);
        showError(error, "Không tải được ảnh minh chứng.");
      });

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedOrder?.evidenceFileId]);

  async function uploadEvidence(file: File | null) {
    if (!file) {
      return;
    }
    if (file.size > 5 * 1024 * 1024 || !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Chọn ảnh PNG, JPEG hoặc WebP, tối đa 5 MB.");
      return;
    }

    setIsUploadingEvidence(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await apiFetch<UploadTopupEvidenceResponse>("/api/topup-orders/evidence", {
        method: "POST",
        body: formData
      });
      setEvidenceFileId(result.fileId);
      setEvidenceName(result.fileName);
      toast.success("Đã tải ảnh minh chứng.");
    } catch (error) {
      setEvidenceFileId("");
      setEvidenceName("");
      showError(error, "Không tải được ảnh minh chứng.");
    } finally {
      setIsUploadingEvidence(false);
    }
  }

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    if (submittingManualRef.current || isUploadingEvidence) return;
    submittingManualRef.current = true;
    setIsSubmittingManual(true);
    try {
      await apiFetch<TopupOrder>("/api/topup-orders", {
        method: "POST",
        json: { packageId, paymentMethod: "Manual", paymentNote, fileId: evidenceFileId || null }
      });
      setPaymentNote("");
      setEvidenceFileId("");
      setEvidenceName("");
      toast.success("Đã tạo yêu cầu nạp credit. Quản trị viên sẽ đối soát và xử lý.");
      setHistoryPage(1);
      await loadData();
    } catch (error) {
      showError(error, "Không tạo được yêu cầu đối soát thủ công.");
    } finally { submittingManualRef.current = false; setIsSubmittingManual(false); }
  }

  async function createPayosLink() {
    setIsCreatingPayos(true);
    try {
      const result = await apiFetch<CreatePayosTopupOrderResponse>("/api/topup-orders/payos", {
        method: "POST",
        json: { packageId }
      });
      toast.success("Đã tạo liên kết thanh toán PayOS. Credit chỉ cộng sau khi hệ thống xác minh thanh toán.");
      await loadData();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      showError(error, "Không tạo được liên kết PayOS.");
    } finally {
      setIsCreatingPayos(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Tài khoản / Nạp credit" title="Nạp credit" description="Chọn gói phù hợp, thanh toán và theo dõi yêu cầu nạp của bạn."
        actions={<div className="flex items-center gap-3 rounded-xl border border-primary-border bg-primary-soft px-4 py-3"><Wallet size={20} className="text-primary" /><div><p className="text-xs text-muted-foreground">Số dư hiện tại</p><p className="font-bold text-primary">{summary ? `${summary.currentCreditBalance} credit` : "—"}</p></div></div>} />
      {loadError && <Alert><p>Không tải được dữ liệu nạp credit.</p><Button type="button" variant="secondary" disabled={isLoading} onClick={() => loadData().catch(error => showError(error))}>Thử lại</Button></Alert>}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <Card>
            <CardHeader><CardTitle>Chọn gói credit</CardTitle><p className="mt-1 text-sm text-muted-foreground">Giá và số credit được xác định theo gói bạn chọn.</p></CardHeader>
            <CardContent>
              {isLoading ? <p className="py-4 text-sm text-muted-foreground">Đang tải các gói credit...</p> : packages.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Hiện chưa có gói credit khả dụng.</p> : <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {packages.map(item => <button type="button" key={item.id} aria-pressed={packageId === item.id} disabled={isCreatingPayos || isSubmittingManual} onClick={() => setPackageId(item.id)}
                  className={`relative flex min-w-0 flex-col rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-50 ${packageId === item.id ? "border-primary bg-primary-soft ring-1 ring-primary" : "border-border-strong bg-surface hover:border-primary-border hover:bg-surface-subtle"}`}>
                  <div className="flex items-start justify-between gap-2"><p className="break-words text-sm font-semibold">{item.name}</p><CheckCircle2 size={18} aria-hidden="true" className={`shrink-0 ${packageId === item.id ? "text-primary" : "text-border-strong"}`} /></div>
                  <p className="mt-4 text-2xl font-extrabold tracking-tight text-primary">{item.credits} <span className="text-sm font-semibold">credit</span></p>
                  <p className="mt-3 border-t border-border/70 pt-3 text-base font-bold">{formatCurrency(item.price)}</p>
                </button>)}
              </div>}
            </CardContent>
          </Card>
          <Card>
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <div><h2 className="text-[17px] font-bold leading-6">Yêu cầu đối soát thủ công</h2><p className="mt-1 text-sm font-normal text-muted-foreground">Gửi thông tin nếu thanh toán của bạn chưa được cập nhật.</p></div>
                <ChevronDown size={18} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-border p-5">
                {pendingManualOrder && <Alert className="mb-4 border-warning-border bg-warning-surface text-warning">Bạn đang có một yêu cầu đối soát thủ công đang chờ xử lý. Mã yêu cầu: <RequestCode id={pendingManualOrder.id} />.</Alert>}
                <form className="space-y-4" onSubmit={submitOrder}>
                  <p className="text-sm text-muted-foreground">Gói đang chọn: <span className="font-semibold text-foreground">{selectedPackage?.name ?? "Chưa chọn gói"}</span></p>
                  <label className="block text-sm font-semibold">Ảnh minh chứng <span className="font-normal text-muted-foreground">(không bắt buộc)</span>
                    <div className="mt-2 rounded-xl border border-dashed border-border-strong bg-surface-subtle p-3">
                      <Input accept="image/jpeg,image/png,image/webp" disabled={isSubmittingManual || isUploadingEvidence || Boolean(pendingManualOrder)} type="file" onChange={event => uploadEvidence(event.target.files?.[0] ?? null)} />
                      <p className="mt-2 flex items-start gap-2 break-all text-xs font-normal text-muted-foreground"><FileImage size={14} className="shrink-0" />{isUploadingEvidence ? "Đang tải..." : evidenceName || "PNG, JPEG hoặc WebP · tối đa 5 MB"}</p>
                    </div>
                  </label>
                  <label className="block text-sm font-semibold">Ghi chú chuyển khoản <span className="text-destructive">*</span>
                    <Textarea className="mt-2" rows={3} maxLength={1000} disabled={isSubmittingManual || Boolean(pendingManualOrder)} placeholder="Nhập nội dung chuyển khoản, ngân hàng hoặc thông tin để quản trị viên đối soát." value={paymentNote} onChange={event => setPaymentNote(event.target.value)} />
                  </label>
                  <Button className="w-full sm:w-auto" disabled={isLoading || isSubmittingManual || isUploadingEvidence || !selectedPackage || !paymentNote.trim() || Boolean(pendingManualOrder)} type="submit">{isSubmittingManual ? "Đang gửi..." : "Gửi yêu cầu đối soát"}</Button>
                </form>
              </div>
            </details>
          </Card>
        </div>
        <Card className="min-w-0 xl:sticky xl:top-28">
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard size={18} className="text-primary" />Thanh toán PayOS</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm"><KeyValueRow label="Gói credit" value={selectedPackage?.name ?? "Chưa chọn"} /><KeyValueRow label="Credit nhận" value={selectedPackage ? `${selectedPackage.credits} credit` : "—"} /></div>
            <div className="rounded-xl border border-primary-border bg-primary-soft p-4"><p className="text-xs text-muted-foreground">Tổng thanh toán</p><p className="mt-1 text-2xl font-extrabold text-primary">{selectedPackage ? formatCurrency(selectedPackage.price) : "—"}</p></div>
            <Button className="w-full" disabled={isLoading || !selectedPackage || isCreatingPayos || isSubmittingManual} type="button" onClick={createPayosLink}><span>{isCreatingPayos ? "Đang tạo liên kết..." : "Tạo liên kết thanh toán"}</span>{!isCreatingPayos && <ArrowRight size={16} />}</Button>
            <p className="text-xs leading-5 text-muted-foreground">Bạn sẽ được chuyển sang PayOS để thanh toán. Credit được cộng sau khi giao dịch được xác minh thành công.</p>
            <ol className="space-y-3 border-t border-border pt-4 text-sm">
              {["Chọn gói credit", "Hoàn tất thanh toán trên PayOS", "Theo dõi trạng thái trong lịch sử"].map((step, index) => <li key={step} className="flex items-center gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index + 1}</span><span>{step}</span></li>)}
            </ol>
          </CardContent>
        </Card>
      </div>
      <Card className="min-w-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><History size={18} className="text-primary" />Lịch sử yêu cầu nạp</CardTitle><p className="mt-1 text-sm text-muted-foreground">Theo dõi thanh toán và kết quả đối soát của bạn.</p></div><Button type="button" variant="secondary" disabled={isLoading} onClick={() => loadData().catch(error => showError(error))}><RefreshCw size={16} />Làm mới</Button></CardHeader>
        <CardContent>
          {isLoading ? <p className="py-5 text-sm text-muted-foreground">Đang tải lịch sử nạp...</p> : loadError ? <p className="py-5 text-sm text-muted-foreground">Chưa tải được lịch sử. Bấm “Làm mới” để thử lại.</p> : <>
            <BaseTable items={pagedOrders} columns={topupOrderColumns} getRowKey={order => order.id} emptyTitle="Chưa có yêu cầu nạp" emptyDetail="Yêu cầu mới sẽ hiển thị ở đây để theo dõi trạng thái thanh toán."
              mobileFooter={order => <Button className="w-full" type="button" variant="secondary" onClick={() => setSelectedOrderId(order.id)}>Xem chi tiết</Button>} />
            <PaginationControls page={currentPage} totalPages={totalPages} totalItems={orders.length} onPrevious={() => setHistoryPage(Math.max(1, currentPage - 1))} onNext={() => setHistoryPage(Math.min(totalPages, currentPage + 1))} />
          </>}
        </CardContent>
      </Card>
      <TopupOrderDetailDialog order={selectedOrder} evidenceUrl={selectedEvidenceUrl} evidenceError={evidenceError} onClose={() => setSelectedOrderId("")} />
    </div>
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
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-border-strong bg-surface-subtle text-muted-foreground hover:text-primary" type="button" onClick={copyId} aria-label="Sao chép đầy đủ mã yêu cầu">
        <Copy size={13} />
      </button>
    </span>
  );
}
