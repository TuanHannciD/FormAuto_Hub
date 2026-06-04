"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowRight, CheckCircle2, Copy, CreditCard, Eye, FileImage, Upload } from "lucide-react";
import { BaseTable, type BaseTableColumn } from "@/components/base-table";
import { DropdownSelect } from "@/components/dropdown-select";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, PageHeader, Textarea } from "@/components/ui";
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
      <Button className="min-h-9 px-3" type="button" variant="secondary" onClick={() => onOpenDetail(order.id)}>
        <Eye size={15} />
      </Button>
    ),
    hideOnMobile: true
  }
  ];
}

export default function TopUpPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [orders, setOrders] = useState<TopupOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [packageId, setPackageId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [evidenceFileId, setEvidenceFileId] = useState("");
  const [evidenceName, setEvidenceName] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedEvidenceUrl, setSelectedEvidenceUrl] = useState<string | null>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [isCreatingPayos, setIsCreatingPayos] = useState(false);

  const selectedPackage = useMemo(() => packages.find((item) => item.id === packageId), [packageId, packages]);
  const selectedOrder = useMemo(() => orders.find((order) => order.id === selectedOrderId) ?? null, [orders, selectedOrderId]);
  const topupOrderColumns = useMemo(() => createTopupOrderColumns(setSelectedOrderId), []);
  const pendingManualOrder = useMemo(
    () => orders.find((order) => order.paymentMethod === "Manual" && order.status === "Pending"),
    [orders]
  );

  async function loadData() {
    const [packageData, orderData, summaryData] = await Promise.all([
      apiFetch<CreditPackage[]>("/api/packages"),
      apiFetch<{ items: TopupOrder[] }>("/api/topup-orders"),
      apiFetch<DashboardSummary>("/api/dashboard/summary")
    ]);
    setPackages(packageData.filter((item) => item.isActive));
    setOrders(orderData.items);
    setSummary(summaryData);
    setPackageId((current) => current || packageData[0]?.id || "");
  }

  useEffect(() => {
    loadData().catch((error: Error) => showError(error, "Không tải được dữ liệu nạp credit."));
  }, []);

  useEffect(() => {
    if (!selectedOrder?.evidenceFileId) {
      setSelectedEvidenceUrl(null);
      return;
    }

    let objectUrl: string | null = null;
    apiFetchBlob(`/api/topup-orders/evidence/${selectedOrder.evidenceFileId}`)
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
  }, [selectedOrder?.evidenceFileId]);

  async function uploadEvidence(file: File | null) {
    if (!file) {
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
    try {
      await apiFetch<TopupOrder>("/api/topup-orders", {
        method: "POST",
        json: { packageId, paymentNote, fileId: evidenceFileId || null }
      });
      setPaymentNote("");
      setEvidenceFileId("");
      setEvidenceName("");
      toast.success("Đã tạo yêu cầu nạp credit. Quản trị viên sẽ đối soát và xử lý.");
      await loadData();
    } catch (error) {
      showError(error, "Không tạo được yêu cầu đối soát thủ công.");
    }
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
      <PageHeader
        eyebrow="Tài khoản / Nạp credit"
        title="Nạp credit bằng PayOS"
        description="Chọn gói credit, tạo liên kết thanh toán và chờ hệ thống xác minh PayOS."
        actions={
        <div className="rounded-md border border-border/70 bg-white/75 px-3 py-2 text-sm shadow-sm backdrop-blur">
          <span className="text-muted-foreground">Số dư: </span>
          <span className="font-semibold">{summary ? `${summary.currentCreditBalance} credit` : "-"}</span>
        </div>
        }
      />

      <Alert>Credit chỉ được cộng sau khi hệ thống xác minh thanh toán thành công. Giao diện không tự cộng credit.</Alert>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {["Chọn gói", "Tạo liên kết PayOS", "Thanh toán", "Chờ xác minh"].map((step, index) => (
          <div className="glass-panel flex items-center gap-3 rounded-lg p-3 text-sm" key={step}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Chọn gói credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                {packages.map((item) => (
                  <button
                    className={`rounded-lg border p-4 text-left shadow-sm backdrop-blur transition hover:border-primary ${packageId === item.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/70 bg-white/65"}`}
                    key={item.id}
                    onClick={() => setPackageId(item.id)}
                    type="button"
                  >
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="mt-3 text-2xl font-semibold">{item.credits} credit</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                    {packageId === item.id && <span className="mt-3 inline-flex rounded-full bg-primary px-2 py-1 text-xs text-primary-foreground">Đang chọn</span>}
                  </button>
                ))}
              </div>
              {packages.length === 0 && (
                <DropdownSelect
                  value={packageId}
                  onChange={setPackageId}
                  options={packages.map((item) => ({
                    value: item.id,
                    label: `${item.name} - ${item.credits} credit - ${formatCurrency(item.price)}`
                  }))}
                />
              )}
            </div>
          </CardContent>
        </Card>

          <details className="glass-panel rounded-lg">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold">
              <span>Yêu cầu đối soát thủ công</span>
              <span className="text-xs font-medium text-muted-foreground">Dùng khi PayOS chưa cập nhật</span>
            </summary>
            <div className="border-t border-border/70 p-5">
              {pendingManualOrder && (
                <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-950">
                  Bạn đang có một yêu cầu đối soát thủ công đang chờ xử lý. Mã yêu cầu: <RequestCode id={pendingManualOrder.id} />.
                </Alert>
              )}
              <form className="space-y-4" onSubmit={submitOrder}>
                <label className="block text-sm font-medium">
                  Ảnh minh chứng <span className="text-muted-foreground">(không bắt buộc)</span>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      accept="image/gif,image/jpeg,image/png,image/webp"
                      disabled={isUploadingEvidence || Boolean(pendingManualOrder)}
                      type="file"
                      onChange={(event) => uploadEvidence(event.target.files?.[0] ?? null)}
                    />
                    <span className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border/70 bg-white/65 px-3 text-sm text-muted-foreground">
                      {isUploadingEvidence ? <Upload size={15} /> : <FileImage size={15} />}
                      {isUploadingEvidence ? "Đang tải..." : evidenceName || "Chưa chọn ảnh"}
                    </span>
                  </div>
                </label>
                <label className="block text-sm font-medium">
                  Ghi chú chuyển khoản <span className="text-destructive">*</span>
                  <Textarea className="mt-2" disabled={Boolean(pendingManualOrder)} placeholder="Nhập nội dung chuyển khoản, ngân hàng hoặc thông tin để quản trị viên đối soát." value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
                </label>
                <Button className="w-full sm:w-auto" disabled={!packageId || !paymentNote.trim() || Boolean(pendingManualOrder)} type="submit">Gửi yêu cầu đối soát</Button>
              </form>
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Thanh toán PayOS</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Metric label="Gói sản phẩm" value={selectedPackage?.name ?? "-"} />
            <Metric label="Credit nhận" value={selectedPackage ? `${selectedPackage.credits} credit` : "-"} />
            <Metric label="Tổng số tiền" value={selectedPackage ? formatCurrency(selectedPackage.price) : "-"} />
            <p className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs leading-5 text-cyan-900">
              Đây là luồng chính. Sau khi tạo liên kết, hoàn tất thanh toán trên PayOS và chờ xác minh trước khi credit được cộng.
            </p>
              <Button className="w-full shadow-md" disabled={!packageId || isCreatingPayos} type="button" onClick={createPayosLink}>
              <CreditCard size={16} />
              <span className="ml-2">{isCreatingPayos ? "Đang tạo liên kết..." : "Tạo liên kết thanh toán"}</span>
              {!isCreatingPayos && <ArrowRight className="ml-2" size={16} />}
            </Button>
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lưu ý xác minh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <CheckItem text="Không cộng tiền trực tiếp từ trang return PayOS." />
              <CheckItem text="Hệ thống xác minh webhook trước khi ghi sổ giao dịch credit." />
              <CheckItem text="Nếu thanh toán chưa cập nhật, vui lòng kiểm tra lại giao dịch." />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử yêu cầu nạp</CardTitle>
        </CardHeader>
        <CardContent>
          <BaseTable
            items={orders}
            columns={topupOrderColumns}
            getRowKey={(order) => order.id}
            emptyTitle="Chưa có yêu cầu nạp"
            emptyDetail="Yêu cầu mới sẽ hiển thị ở đây để theo dõi trạng thái thanh toán."
            mobileFooter={(order) => (
              <div className="space-y-2 border-t border-border/70 pt-3">
                <span className="block text-xs text-muted-foreground">Mã yêu cầu: <RequestCode id={order.id} /></span>
                {order.evidenceFileId && <span className="block text-xs text-primary">Có ảnh minh chứng đã tải lên</span>}
                <button className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border/70 bg-white/75 px-4 py-2 text-sm font-medium text-primary transition hover:bg-white" type="button" onClick={() => setSelectedOrderId(order.id)}>
                  Xem chi tiết
                </button>
              </div>
            )}
          />
        </CardContent>
      </Card>

      <TopupOrderDetailDialog
        evidenceUrl={selectedEvidenceUrl}
        order={selectedOrder}
        onClose={() => setSelectedOrderId("")}
      />
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
      <button className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border/70 bg-white/75 text-muted-foreground hover:text-primary" type="button" onClick={copyId} aria-label="Sao chép đầy đủ mã yêu cầu">
        <Copy size={13} />
      </button>
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/70 bg-white/55 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 text-emerald-600" size={15} />
      <span>{text}</span>
    </div>
  );
}

function TopupOrderDetailDialog({
  evidenceUrl,
  order,
  onClose
}: {
  evidenceUrl: string | null;
  order: TopupOrder | null;
  onClose: () => void;
}) {
  if (!order) {
    return null;
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chi tiết yêu cầu nạp</DialogTitle>
          <DialogDescription>Theo dõi trạng thái thanh toán, xác minh và cộng credit.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <Alert>Credit được cộng sau khi thanh toán được xác minh hoặc yêu cầu được quản trị viên xử lý.</Alert>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-lg border border-border/70 bg-white/45 backdrop-blur">
              <div className="border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold">Thông tin yêu cầu</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Mã yêu cầu" value={<RequestCode id={order.id} />} />
                <Detail label="Gói credit" value={order.packageName || "-"} />
                <Detail label="Số credit" value={`${order.credits} credit`} />
                <Detail label="Số tiền" value={formatCurrency(order.amount)} />
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <div className="mt-1"><StatusBadge status={order.status} /></div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-border/70 bg-white/45 backdrop-blur">
              <div className="border-b border-border/70 px-4 py-3">
                <h3 className="font-semibold">Tiến trình xử lý</h3>
              </div>
              <div className="space-y-4 p-4 text-sm">
                <Detail label="Cách ghi nhận thanh toán" value={displayPaymentMethod(order.paymentMethod)} />
                <Detail label="Ghi chú thanh toán" value={order.paymentNote || "-"} />
                <Detail label="Ảnh minh chứng" value={order.evidenceFileId ? "Đã tải ảnh" : "Không có"} />
                <Detail label="Tạo lúc" value={formatDate(order.createdAt)} />
                <Detail label="Đã thanh toán lúc" value={formatDate(order.paidAt)} />
                <Detail label="Được duyệt lúc" value={formatDate(order.approvedAt)} />
              </div>
            </section>
          </div>
          {evidenceUrl && (
            <section className="rounded-lg border border-border/70 bg-white/45 p-4 backdrop-blur">
              <h3 className="font-semibold">Ảnh minh chứng</h3>
              <div className="relative mt-3 h-[480px] w-full overflow-hidden rounded-md bg-white/55">
                <Image unoptimized fill className="object-contain" src={evidenceUrl} alt="Ảnh minh chứng nạp credit" sizes="(max-width: 768px) 100vw, 896px" />
              </div>
            </section>
          )}
        </DialogBody>
        <DialogFooter>
          <Button className="w-full sm:w-auto" type="button" variant="secondary" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="mt-1 break-words font-medium">{value}</p>
    </div>
  );
}
