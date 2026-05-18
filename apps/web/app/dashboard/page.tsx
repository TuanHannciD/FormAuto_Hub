import Link from "next/link";
import { Alert, Card, CardContent, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch, type DashboardSummary } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

async function getSummary() {
  try {
    return await apiFetch<DashboardSummary>("/api/dashboard/summary");
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const summary = await getSummary();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tổng quan vận hành</h2>
        <p className="mt-1 text-sm text-muted-foreground">Theo dõi credit, yêu cầu nạp và các thao tác automation gần đây.</p>
      </div>

      <Alert>
        Form automation luôn yêu cầu preview trước, user confirmation rõ ràng, và giới hạn 1 đến 5 preview responses mỗi lần.
      </Alert>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Credit hiện có" value={summary ? String(summary.currentCreditBalance) : "-"} />
        <Metric title="Đã nạp" value={summary ? String(summary.totalCreditsDeposited) : "-"} />
        <Metric title="Đã dùng" value={summary ? String(summary.totalCreditsUsed) : "-"} />
        <Metric title="Yêu cầu chờ duyệt" value={summary ? String(summary.pendingTopupOrders) : "-"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Link className="block rounded-md border border-border p-3 hover:bg-muted" href="/dashboard/forms">
              Analyze Google Form URL và cấu hình answer rules
            </Link>
            <Link className="block rounded-md border border-border p-3 hover:bg-muted" href="/dashboard/top-up">
              Tạo yêu cầu nạp credit thủ công
            </Link>
            <Link className="block rounded-md border border-border p-3 hover:bg-muted" href="/dashboard/usage-logs">
              Kiểm tra usage logs và hành động bị chặn
            </Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top-up gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {!summary || summary.recentTopupOrders.length === 0 ? (
              <EmptyState title="Chưa có yêu cầu nạp gần đây" detail="Tạo yêu cầu nạp thủ công khi cần thêm credit." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-muted-foreground">
                    <tr>
                      <th className="py-2">Credits</th>
                      <th className="py-2">Số tiền</th>
                      <th className="py-2">Trạng thái</th>
                      <th className="py-2">Tạo lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recentTopupOrders.map((order) => (
                      <tr className="border-t border-border" key={order.id}>
                        <td className="py-3">{order.credits}</td>
                        <td className="py-3">{formatCurrency(order.amount)}</td>
                        <td className="py-3"><StatusBadge status={order.status} /></td>
                        <td className="py-3">{formatDate(order.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage logs gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {!summary || summary.recentUsageLogs.length === 0 ? (
            <EmptyState title="Chưa có usage log gần đây" detail="Các hành động analyze, preview và submission sẽ xuất hiện tại đây." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr>
                    <th className="py-2">Thời gian</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Credits</th>
                    <th className="py-2">Kết quả</th>
                    <th className="py-2">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.recentUsageLogs.map((log) => (
                    <tr className="border-t border-border" key={log.id}>
                      <td className="py-3">{formatDate(log.createdAt)}</td>
                      <td className="py-3">{log.action}</td>
                      <td className="py-3">{log.creditsUsed}</td>
                      <td className="py-3"><StatusBadge status={log.status} /></td>
                      <td className="py-3">{log.description}</td>
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

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
