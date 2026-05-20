"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard } from "lucide-react";
import { DropdownSelect } from "@/components/dropdown-select";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type CreatePayosTopupOrderResponse, type CreditPackage, type DashboardSummary, type TopupOrder } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TopUpPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [orders, setOrders] = useState<TopupOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [packageId, setPackageId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Thủ công");
  const [paymentNote, setPaymentNote] = useState("");
  const [message, setMessage] = useState("");
  const [isCreatingPayos, setIsCreatingPayos] = useState(false);

  const selectedPackage = useMemo(() => packages.find((item) => item.id === packageId), [packageId, packages]);

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
    loadData().catch((error: Error) => setMessage(error.message));
  }, []);

  async function submitOrder(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await apiFetch<TopupOrder>("/api/topup-orders", {
        method: "POST",
        json: { packageId, paymentMethod, paymentNote }
      });
      setPaymentNote("");
      setMessage("Đã tạo yêu cầu nạp credit. Quản trị viên sẽ duyệt thủ công.");
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được yêu cầu nạp.");
    }
  }

  async function createPayosLink() {
    setMessage("");
    setIsCreatingPayos(true);
    try {
      const result = await apiFetch<CreatePayosTopupOrderResponse>("/api/topup-orders/payos", {
        method: "POST",
        json: { packageId }
      });
      setMessage("Đã tạo liên kết thanh toán PayOS. Credit chỉ cộng sau khi hệ thống xác minh thanh toán.");
      await loadData();
      window.location.href = result.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Không tạo được liên kết PayOS.");
    } finally {
      setIsCreatingPayos(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Tài khoản / Nạp credit</p>
          <h2 className="mt-2 text-2xl font-semibold">Nạp credit bằng PayOS</h2>
          <p className="mt-1 text-sm text-muted-foreground">Chọn gói credit, tạo link thanh toán và chờ backend xác minh PayOS.</p>
        </div>
        <div className="rounded-md border border-border bg-white px-3 py-2 text-sm">
          <span className="text-muted-foreground">Số dư: </span>
          <span className="font-semibold">{summary ? `${summary.currentCreditBalance} credit` : "-"}</span>
        </div>
      </div>

      <Alert>Credit chỉ được cộng sau khi backend xác minh thanh toán thành công. Giao diện không tự cộng credit.</Alert>

      <div className="grid gap-3 md:grid-cols-4">
        {["Chọn gói", "Chọn PayOS", "Tạo link thanh toán", "Chờ xác minh"].map((step, index) => (
          <div className="flex items-center gap-3 rounded-md border border-border bg-white p-3 text-sm" key={step}>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span>
            <span>{step}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.75fr]">
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
                    className={`rounded-lg border p-4 text-left transition hover:border-primary ${packageId === item.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border bg-white"}`}
                    key={item.id}
                    onClick={() => setPackageId(item.id)}
                    type="button"
                  >
                    <p className="text-sm text-muted-foreground">{item.name}</p>
                    <p className="mt-3 text-2xl font-semibold">{item.credits} cr</p>
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
                    label: `${item.name} - ${item.credits} credits - ${formatCurrency(item.price)}`
                  }))}
                />
              )}
            </div>
            {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

          <Card>
          <CardHeader>
            <CardTitle>Yêu cầu thủ công</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitOrder}>
              <label className="block text-sm font-medium">
                Phương thức ghi nhận thủ công
                <Input className="mt-2" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} />
              </label>
              <label className="block text-sm font-medium">
                Ghi chú cho admin
                <Textarea className="mt-2" value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} />
              </label>
              <Button disabled={!packageId} type="submit">Gửi yêu cầu</Button>
            </form>
          </CardContent>
        </Card>
        </div>

        <div className="space-y-4">
          <Card>
          <CardHeader>
            <CardTitle>Chi tiết đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Metric label="Gói sản phẩm" value={selectedPackage?.name ?? "-"} />
            <Metric label="Credit nhận" value={selectedPackage ? `${selectedPackage.credits} cr` : "-"} />
            <Metric label="Tổng số tiền" value={selectedPackage ? formatCurrency(selectedPackage.price) : "-"} />
            <Button className="w-full" disabled={!packageId || isCreatingPayos} type="button" onClick={createPayosLink}>
              <CreditCard size={16} />
              <span className="ml-2">{isCreatingPayos ? "Đang tạo liên kết..." : "Tạo link thanh toán"}</span>
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
              <CheckItem text="Backend xác minh webhook trước khi ghi ledger." />
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
          {orders.length === 0 ? (
            <EmptyState title="Chưa có yêu cầu nạp" detail="Yêu cầu mới sẽ hiển thị ở đây để theo dõi trạng thái duyệt." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Credit</th>
                    <th className="py-2">Số tiền</th>
                    <th className="py-2">Phương thức</th>
                    <th className="py-2">Trạng thái</th>
                    <th className="py-2">Tạo lúc</th>
                    <th className="py-2">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr className="border-t border-border" key={order.id}>
                      <td className="py-3">{order.credits}</td>
                      <td className="py-3">{formatCurrency(order.amount)}</td>
                      <td className="py-3">{order.paymentMethod}</td>
                      <td className="py-3"><StatusBadge status={order.status} /></td>
                      <td className="py-3">{formatDate(order.createdAt)}</td>
                      <td className="py-3">
                        <Link className="text-primary hover:underline" href={`/dashboard/top-up/${order.id}`}>
                          Xem
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
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
