"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DropdownSelect } from "@/components/dropdown-select";
import { Alert, Button, Card, CardContent, CardHeader, CardTitle, EmptyState, Input, Textarea } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type CreditPackage, type DashboardSummary, type TopupOrder } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TopUpPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [orders, setOrders] = useState<TopupOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [packageId, setPackageId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Thủ công");
  const [paymentNote, setPaymentNote] = useState("");
  const [message, setMessage] = useState("");

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Yêu cầu nạp credit</h2>
        <p className="mt-1 text-sm text-muted-foreground">Giai đoạn hiện tại chỉ hỗ trợ yêu cầu nạp và quản trị viên duyệt thủ công.</p>
      </div>

      <Alert>Cổng thanh toán tự động đang để sau. Không nhập thẻ, QR tự động hoặc thông tin thanh toán thật tại đây.</Alert>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tạo yêu cầu mới</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submitOrder}>
              <label className="block text-sm font-medium">
                Gói credit
                <DropdownSelect
                  className="mt-2"
                  value={packageId}
                  onChange={setPackageId}
                  options={packages.map((item) => ({
                    value: item.id,
                    label: `${item.name} - ${item.credits} credits - ${formatCurrency(item.price)}`
                  }))}
                />
              </label>
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
            {message && <p className="mt-4 text-sm text-muted-foreground">{message}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt số dư</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Metric label="Credit hiện có" value={summary ? String(summary.currentCreditBalance) : "-"} />
            <Metric label="Đang chờ duyệt" value={summary ? String(summary.pendingTopupOrders) : "-"} />
            <Metric label="Sau khi duyệt" value={selectedPackage && summary ? String(summary.currentCreditBalance + selectedPackage.credits) : "-"} />
          </CardContent>
        </Card>
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
    <div className="rounded-lg border border-border bg-muted/40 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}
